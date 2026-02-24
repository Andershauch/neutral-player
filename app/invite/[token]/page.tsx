"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Providers } from "@/components/Providers";

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white border border-gray-100 rounded-[2rem] shadow-xl shadow-blue-900/5 p-8">
        <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">Invitation</h1>

        {invite.status === "loading" && (
          <p className="mt-4 text-sm font-semibold text-gray-500">Indlæser invitation...</p>
        )}

        {invite.status === "invalid" && (
          <p className="mt-4 text-sm font-semibold text-red-600">
            Denne invitation er ugyldig eller findes ikke.
          </p>
        )}

        {invite.status === "expired" && (
          <p className="mt-4 text-sm font-semibold text-red-600">
            Invitationen er udløbet. Bed en administrator om at sende en ny invitation.
          </p>
        )}

        {invite.status === "accepted" && (
          <p className="mt-4 text-sm font-semibold text-emerald-700">
            Invitationen er allerede accepteret. Du kan gå videre til dashboardet.
          </p>
        )}

        {invite.status === "pending" && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-600">
              Du er inviteret til <strong>{invite.organizationName}</strong> som <strong>{invite.role}</strong>.
            </p>
            <p className="text-xs text-gray-500">Invitation sendt til: {invite.email}</p>

            {authStatus === "loading" && (
              <p className="text-sm font-semibold text-gray-500">Tjekker login...</p>
            )}

            {authStatus === "unauthenticated" && (
              <div className="space-y-3">
                {shouldRegisterFirst ? (
                  <>
                    <p className="text-xs font-semibold text-gray-600">
                      Der findes ikke en bruger med denne email endnu. Opret konto for at acceptere invitationen.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link
                        href={`/register?invite=${encodeURIComponent(token)}`}
                        className="px-4 py-3 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest text-center"
                      >
                        Opret konto og acceptér
                      </Link>
                      <Link
                        href={`/login?invite=${encodeURIComponent(token)}`}
                        className="px-4 py-3 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest text-center"
                      >
                        Jeg har allerede konto
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href={`/login?invite=${encodeURIComponent(token)}`}
                      className="px-4 py-3 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest text-center"
                    >
                      Log ind for at acceptere
                    </Link>
                    <Link
                      href={`/register?invite=${encodeURIComponent(token)}`}
                      className="px-4 py-3 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest text-center"
                    >
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
                    <p className="text-sm font-semibold text-red-600">
                      Du er logget ind som {session?.user?.email}, men invitationen er til {invite.email}.
                    </p>
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: `/login?invite=${encodeURIComponent(token)}` })}
                      className="px-4 py-3 rounded-xl border border-red-200 text-red-700 text-xs font-black uppercase tracking-widest"
                    >
                      Log ud og brug den rigtige konto
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={acceptInvite}
                    disabled={accepting || accepted}
                    className="px-4 py-3 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50"
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
  );
}
