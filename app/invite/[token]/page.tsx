"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Providers } from "@/components/Providers";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";

type InviteStatus = "loading" | "invalid" | "expired" | "accepted" | "pending";

interface InvitePayload {
  status: InviteStatus;
  email?: string;
  role?: string;
  organizationName?: string;
  expiresAt?: string;
  hasAccount?: boolean;
}

export default function InvitePage() {
  return (
    <Providers>
      <InvitePageContent />
    </Providers>
  );
}

function InvitePageContent() {
  const router = useRouter();
  const { status: authStatus, data: session } = useSession();
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [invite, setInvite] = useState<InvitePayload>({ status: "loading" });
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/invites/${token}`);
      const data = (await res.json()) as InvitePayload;
      if (!res.ok) {
        setInvite({ status: "invalid" });
        return;
      }
      setInvite(data);
    };

    void load();
  }, [token]);

  const acceptInvite = async () => {
    setAccepting(true);
    setError(null);
    const res = await fetch(`/api/invites/${token}`, { method: "POST" });
    const data = (await res.json()) as { error?: string };

    if (!res.ok) {
      setError(data.error || "Kunne ikke acceptere invitationen.");
      setAccepting(false);
      return;
    }

    setAccepted(true);
    router.push("/admin/dashboard");
    router.refresh();
  };

  const loggedInEmail = session?.user?.email?.toLowerCase();
  const inviteEmail = invite.email?.toLowerCase();
  const wrongAccount = Boolean(
    authStatus === "authenticated" &&
      invite.status === "pending" &&
      loggedInEmail &&
      inviteEmail &&
      loggedInEmail !== inviteEmail
  );

  const shouldRegisterFirst = invite.status === "pending" && invite.hasAccount === false;

  return (
    <div className="np-default-theme np-page-shell">
      <div className="np-page-wrap np-page-stack">
        <PublicSiteHeader />

        <div className="np-form-shell">
          <div className="np-form-layout">
            <aside className="np-form-aside">
              <div className="space-y-4">
                <p className="np-form-kicker">Invitation</p>
                <h1 className="np-form-title">Bliv sendt ind i det rigtige team uden friktion.</h1>
                <p className="np-form-copy">
                  Invitationer er et vigtigt spring mellem salg, onboarding og daglig drift. Derfor skal siden være
                  tydelig om konto, organisation og næste handling.
                </p>
              </div>

              <div className="np-section-card-muted">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Det hjælper siden med</p>
                <ul className="mt-4 np-system-list">
                  <li>At vise om invitationen er gyldig, udløbet eller allerede accepteret.</li>
                  <li>At guide dig til login eller konto-oprettelse med den rigtige email.</li>
                  <li>At pege dig videre til dashboard så snart invitationen er accepteret.</li>
                </ul>
              </div>

              {invite.status === "pending" && (
                <div className="np-data-strip">
                  <div className="np-data-chip">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Organisation</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">{invite.organizationName || "Ukendt org"}</p>
                  </div>
                  <div className="np-data-chip">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Rolle</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">{invite.role || "Ikke angivet"}</p>
                  </div>
                  <div className="np-data-chip">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Email</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">{invite.email || "Ikke angivet"}</p>
                  </div>
                </div>
              )}
            </aside>

            <div className="np-form-card np-form-card-wide">
              <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">Invitation</h1>

              {invite.status === "loading" && <p className="mt-4 text-sm font-semibold text-gray-500">Indlæser invitation...</p>}

              {invite.status === "invalid" && (
                <div className="mt-4 np-status-banner np-status-banner-error">Denne invitation er ugyldig eller findes ikke.</div>
              )}

              {invite.status === "expired" && (
                <div className="mt-4 np-status-banner np-status-banner-error">
                  Invitationen er udløbet. Bed en administrator om at sende en ny invitation.
                </div>
              )}

              {invite.status === "accepted" && (
                <div className="mt-4 space-y-4">
                  <div className="np-status-banner np-status-banner-success">
                    Invitationen er allerede accepteret. Du kan gå videre til dashboardet.
                  </div>
                  <Link href="/admin/dashboard" className="np-btn-primary inline-flex px-4 py-3 text-center">
                    Gå til dashboard
                  </Link>
                </div>
              )}

              {invite.status === "pending" && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-gray-600">
                    Du er inviteret til <strong>{invite.organizationName}</strong> som <strong>{invite.role}</strong>.
                  </p>
                  <p className="text-xs text-gray-500">Invitation sendt til: {invite.email}</p>

                  {authStatus === "loading" && <p className="text-sm font-semibold text-gray-500">Tjekker login...</p>}

                  {authStatus === "unauthenticated" && (
                    <div className="space-y-3">
                      {shouldRegisterFirst ? (
                        <>
                          <p className="text-xs font-semibold text-gray-600">
                            Der findes ikke en bruger med denne email endnu. Opret konto for at acceptere invitationen.
                          </p>
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <Link
                              href={`/register?invite=${encodeURIComponent(token)}`}
                              className="np-btn-primary px-4 py-3 text-center"
                            >
                              Opret konto og acceptér
                            </Link>
                            <Link
                              href={`/login?invite=${encodeURIComponent(token)}`}
                              className="np-btn-ghost px-4 py-3 text-center"
                            >
                              Jeg har allerede konto
                            </Link>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <Link href={`/login?invite=${encodeURIComponent(token)}`} className="np-btn-primary px-4 py-3 text-center">
                            Log ind for at acceptere
                          </Link>
                          <Link href={`/register?invite=${encodeURIComponent(token)}`} className="np-btn-ghost px-4 py-3 text-center">
                            Opret konto
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {authStatus === "authenticated" && (
                    <div className="space-y-3">
                      {wrongAccount ? (
                        <>
                          <div className="np-status-banner np-status-banner-error">
                            Du er logget ind som {session?.user?.email}, men invitationen er til {invite.email}.
                          </div>
                          <button
                            type="button"
                            onClick={() => signOut({ callbackUrl: `/login?invite=${encodeURIComponent(token)}` })}
                            className="np-btn-ghost border-red-200 px-4 py-3 text-red-700"
                          >
                            Log ud og brug den rigtige konto
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={acceptInvite}
                          disabled={accepting || accepted}
                          className="np-btn-primary px-4 py-3 disabled:opacity-50"
                        >
                          {accepting ? "Accepterer..." : "Acceptér invitation"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
