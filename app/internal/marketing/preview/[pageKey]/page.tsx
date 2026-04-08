import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingPagePreview from "@/components/internal/MarketingPagePreview";
import {
  getInternalMarketingPreviewContent,
  type InternalMarketingPreviewContent,
} from "@/lib/marketing-content-runtime";
import {
  MARKETING_PAGE_DESCRIPTIONS,
  MARKETING_PAGE_TITLES,
  isSupportedMarketingPageKey,
  type MarketingPageKey,
} from "@/lib/marketing-pages";
import { getMarketingPublicPath } from "@/lib/marketing-routes";
import { type MarketingPageContent } from "@/lib/marketing-content-schema";

export const dynamic = "force-dynamic";

export default async function InternalMarketingPreviewPage({
  params,
}: {
  params: Promise<{ pageKey: string }>;
}) {
  const { pageKey: rawPageKey } = await params;
  if (!isSupportedMarketingPageKey(rawPageKey)) {
    notFound();
  }

  const pageKey = rawPageKey as MarketingPageKey;
  const preview = await getInternalMarketingPreviewContent(pageKey);

  return (
    <div className="space-y-6">
      <section className="np-card np-card-pad bg-gradient-to-br from-white via-white to-blue-50/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="np-kicker text-blue-600">Internal draft preview</p>
            <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">
              {MARKETING_PAGE_TITLES[pageKey]}
            </h1>
            <p className="text-sm text-gray-500">{MARKETING_PAGE_DESCRIPTIONS[pageKey]}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/internal/marketing" className="np-btn-ghost inline-flex px-4 py-3">
              Tilbage til editor
            </Link>
            <Link href={getMarketingPublicPath(pageKey)} className="np-btn-ghost inline-flex px-4 py-3" target="_blank">
              Åbn live side
            </Link>
          </div>
        </div>
      </section>

      <section className="np-card p-5 md:p-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          <span className={`np-pill-badge ${preview.source === "draft" ? "" : "opacity-70"}`}>
            Preview-kilde: {toSourceLabel(preview.source)}
          </span>
          <span className="np-pill-badge">{preview.hasDraft ? "Draft findes" : "Ingen draft"}</span>
          <span className="np-pill-badge">{preview.hasPublished ? "Live version findes" : "Ingen live version"}</span>
        </div>

        <p className="text-sm text-gray-600">
          Denne side er kun til intern preview. Live public-siden fortsætter med at vise published content, indtil du
          publicerer draften fra editoren.
        </p>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          {getPreviewNotice(preview)}
        </div>
      </section>

      <section className="np-card p-5 md:p-6 space-y-4">
        <MarketingPagePreview pageKey={pageKey} content={preview.content} />
      </section>
    </div>
  );
}

function toSourceLabel(source: InternalMarketingPreviewContent<MarketingPageContent>["source"]) {
  if (source === "draft") return "Draft";
  if (source === "published") return "Published fallback";
  return "Default fallback";
}

function getPreviewNotice(preview: InternalMarketingPreviewContent<MarketingPageContent>) {
  if (preview.source === "draft") {
    return "Du ser den gemte draft-version. Det er den version der vil blive live ved næste publish.";
  }
  if (preview.source === "published") {
    return "Ingen gyldig draft blev fundet, så preview bruger den nuværende published version som fallback.";
  }
  return "Der findes hverken gyldig draft eller published content endnu, så preview bruger kode-defaults.";
}
