import { headers } from "next/headers";
import { notFound } from "next/navigation";
import MuxPlayerClient from "@/components/player/MuxPlayerClient";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ id: string }>;
}

type SourceHost = {
  hostname: string;
  port: string | null;
};

export default async function EmbedPage({ params }: PageProps) {
  const resolvedParams = await params;
  const embedId = resolvedParams.id;

  const embed = await prisma.embed.findUnique({
    where: { id: embedId },
    include: {
      groups: {
        include: {
          variants: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!embed) return notFound();

  const reqHeaders = await headers();
  const source = getSourceHost(reqHeaders);
  const ownHosts = getOwnHosts(reqHeaders);
  const allowedRules = parseAllowedRules(embed.allowedDomains);
  const hasActivePaidAccess = await hasActivePaidSubscription(embed.organizationId ?? null);

  const isDomainAllowed =
    allowedRules.includes("*") ||
    isOwnDomainSource(source, ownHosts) ||
    matchesAllowedRules(source, allowedRules) ||
    allowMissingSource(reqHeaders, source);

  if (!hasActivePaidAccess || !isDomainAllowed) {
    const blockedBySubscription = !hasActivePaidAccess;
    await createEmbedBlockAudit({
      organizationId: embed.organizationId ?? null,
      embedId: embed.id,
      reason: blockedBySubscription ? "subscription" : "domain",
      source,
    });

    return (
      <div className="flex items-center justify-center w-screen h-screen bg-black text-white font-sans p-6 text-center">
        <p className="opacity-80 text-sm">
          {blockedBySubscription
            ? "Embed er deaktiveret: abonnement er ikke aktivt."
            : "Afspilning er ikke tilladt fra dette domæne."}
        </p>
      </div>
    );
  }

  const allVariants = embed.groups.flatMap((g) => g.variants);
  const readyVariants = allVariants.filter((v) => v.muxPlaybackId !== null);

  if (readyVariants.length === 0) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-black text-white font-sans">
        <p className="opacity-50 text-sm">Videoen behandles eller er ikke uploadet endnu.</p>
      </div>
    );
  }

  return (
    <main className="w-screen h-screen bg-black overflow-hidden m-0 p-0">
      <MuxPlayerClient initialVariant={readyVariants[0]} allVariants={readyVariants} embedName={embed.name} />
    </main>
  );
}

function getSourceHost(reqHeaders: Headers): SourceHost | null {
  const origin = reqHeaders.get("origin");
  const referer = reqHeaders.get("referer");
  return parseHeaderUrl(origin) ?? parseHeaderUrl(referer);
}

function parseHeaderUrl(value: string | null): SourceHost | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return {
      hostname: url.hostname.toLowerCase(),
      port: url.port || null,
    };
  } catch {
    return null;
  }
}

function getOwnHosts(reqHeaders: Headers): SourceHost[] {
  const values = [reqHeaders.get("x-forwarded-host"), reqHeaders.get("host")]
    .filter(Boolean)
    .flatMap((v) => String(v).split(",").map((x) => x.trim()))
    .filter(Boolean);

  const hosts: SourceHost[] = [];
  for (const value of values) {
    const parsed = parseHostLike(value);
    if (parsed) hosts.push(parsed);
  }
  return hosts;
}

function parseHostLike(value: string): SourceHost | null {
  const clean = value.trim().toLowerCase();
  if (!clean) return null;
  const [hostname, port] = clean.split(":");
  if (!hostname) return null;
  return { hostname, port: port || null };
}

function parseAllowedRules(allowedDomains: string | null): string[] {
  if (!allowedDomains || !allowedDomains.trim()) return ["*"];
  return allowedDomains
    .split(",")
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean);
}

function isOwnDomainSource(source: SourceHost | null, ownHosts: SourceHost[]): boolean {
  if (!source) return false;
  return ownHosts.some((own) => hostMatches(source, own.hostname, own.port));
}

function matchesAllowedRules(source: SourceHost | null, rules: string[]): boolean {
  if (!source) return false;
  return rules.some((rule) => matchesRule(source, rule));
}

function matchesRule(source: SourceHost, rule: string): boolean {
  if (rule === "*") return true;

  const wildcard = rule.startsWith("*.");
  const normalized = wildcard ? rule.slice(2) : rule;
  const [ruleHost, rulePort] = normalized.split(":");
  if (!ruleHost) return false;

  if (wildcard) {
    if (!source.hostname.endsWith(`.${ruleHost}`)) return false;
  } else if (source.hostname !== ruleHost) {
    return false;
  }

  if (rulePort) {
    return source.port === rulePort;
  }
  return true;
}

function hostMatches(source: SourceHost, host: string, port: string | null): boolean {
  if (source.hostname !== host) return false;
  if (!port) return true;
  return source.port === port;
}

function allowMissingSource(reqHeaders: Headers, source: SourceHost | null): boolean {
  if (source) return false;
  const fetchSite = (reqHeaders.get("sec-fetch-site") || "").toLowerCase();
  return fetchSite === "" || fetchSite === "same-origin" || fetchSite === "same-site" || fetchSite === "none";
}

async function hasActivePaidSubscription(organizationId: string | null): Promise<boolean> {
  if (!organizationId) return false;

  const subscription = await prisma.subscription.findFirst({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    select: { status: true, plan: true },
  });

  if (!subscription) return false;
  if (subscription.status !== "active") return false;
  if (!subscription.plan || subscription.plan === "free") return false;
  return true;
}

async function createEmbedBlockAudit(input: {
  organizationId: string | null;
  embedId: string;
  reason: "subscription" | "domain";
  source: SourceHost | null;
}): Promise<void> {
  if (!input.organizationId) return;

  const sourceLabel = input.source
    ? `${input.source.hostname}${input.source.port ? `:${input.source.port}` : ""}`
    : "unknown-source";
  const action =
    input.reason === "subscription" ? "BLOCKERET_EMBED_SUBSCRIPTION" : "BLOCKERET_EMBED_DOMAIN";

  try {
    await prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        userId: null,
        userName: null,
        action,
        target: `Embed ${input.embedId} blokeret (${input.reason}) fra ${sourceLabel}`,
      },
    });
  } catch {
    // Embed-response må ikke fejle hvis audit-log ikke kan skrives.
  }
}
