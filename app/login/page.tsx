"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMessages } from "@/lib/i18n/messages";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

function LoginContent() {
  const t = getMessages("da");
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");
  const invite = searchParams.get("invite");
  const callbackUrl = invite ? `/invite/${encodeURIComponent(invite)}` : "/admin/dashboard";
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED !== "false";

  const handleOAuthLogin = async (provider: string) => {
    setLoadingProvider(provider);
    await signIn(provider, { callbackUrl });
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProvider("credentials");

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    if (result?.error) {
      alert(t.login.wrongCredentials);
      setLoadingProvider(null);
      return;
    }

    router.push(callbackUrl);
  };

  return (
    <div className="np-default-theme np-form-shell">
      <div className="np-form-layout">
        <aside className="np-form-aside">
          <div className="space-y-4">
            <p className="np-form-kicker">Log ind</p>
            <h1 className="np-form-title">
              Vend tilbage til dashboard, embeds og næste skridt.
            </h1>
            <p className="np-form-copy">
              Login skal føles som en fortsættelse af marketingoplevelsen. Derfor holder vi samme tone, samme
              overflader og samme fokus på at få dig hurtigt videre.
            </p>
          </div>

          <div className="np-section-card-muted">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Typisk når du logger ind</p>
            <ul className="mt-4 np-system-list">
              <li>Du fortsætter arbejdet i eksisterende projekter og varianter.</li>
              <li>Du accepterer en invitation eller går videre til team- og billing-flow.</li>
              <li>Du vender tilbage efter planvalg, verificering eller supportdialog.</li>
            </ul>
          </div>

          <div className="np-data-strip">
            <div className="np-data-chip">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Har du ikke en konto?</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">Gå til planer eller opret konto først.</p>
            </div>
            <div className="np-data-chip">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Inviteret?</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">Vi sender dig videre til den rigtige invite-side efter login.</p>
            </div>
            <div className="np-data-chip">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Brug for hjælp?</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">Kontakt os hvis adgang, setup eller planvalg driller.</p>
            </div>
          </div>
        </aside>

        <div className="np-form-card space-y-8 ring-1 ring-blue-50">
          <div className="text-center">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
              Neutral<span className="text-blue-600">.</span>
            </h2>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400">{t.login.heading}</p>
          </div>

          {success === "account-created" && (
            <div className="np-status-banner np-status-banner-success">{t.login.accountCreated}</div>
          )}

          {invite && <div className="np-status-banner np-status-banner-info">{t.login.invited}</div>}

          {error && <div className="np-status-banner np-status-banner-error">{t.login.loginFailed}</div>}

          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
              <label className="mb-1 ml-1 block text-[10px] font-black uppercase text-gray-400">{t.login.email}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="np-field"
                placeholder="mail@eksempel.dk"
              />
            </div>
            <div>
              <label className="mb-1 ml-1 block text-[10px] font-black uppercase text-gray-400">{t.login.password}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="np-field"
                placeholder="********"
              />
            </div>
            <button
              type="submit"
              disabled={!!loadingProvider}
              className="np-btn-primary flex w-full justify-center px-4 py-4 disabled:opacity-50"
            >
              {loadingProvider === "credentials" ? t.login.loginLoading : t.login.loginButton}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
              <span className="bg-white px-4 text-gray-400">{t.login.or}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-700">
              <GoogleSignInButton
                onClick={() => handleOAuthLogin("google")}
                disabled={!!loadingProvider || !googleEnabled}
              />
              <span>{loadingProvider === "google" ? "Forbinder..." : "Google"}</span>
            </div>
          </div>

          {!googleEnabled && (
            <p className="text-center text-[10px] font-bold uppercase tracking-widest text-amber-600">
              Google login er midlertidigt deaktiveret i denne miljøopsætning.
            </p>
          )}

          <div className="border-t border-gray-50 pt-6 text-center">
            <p className="text-[11px] font-bold uppercase tracking-tight text-gray-400">{t.login.missingAccount}</p>
            <Link
              href={invite ? `/register?invite=${encodeURIComponent(invite)}` : "/pricing"}
              className="mt-2 inline-block text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-700"
            >
              {t.login.buyOrCreate}
            </Link>
            <div className="mt-3">
              <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600">
                {t.login.backToFrontpage}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const t = getMessages("da");
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-xs font-black uppercase tracking-[0.3em] text-gray-300 animate-pulse">
          {t.login.loading}
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
