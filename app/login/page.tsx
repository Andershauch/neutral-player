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
  const microsoftEnabled = process.env.NEXT_PUBLIC_MICROSOFT_AUTH_ENABLED !== "false";

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full space-y-8 bg-white p-6 sm:p-10 rounded-[2rem] shadow-2xl shadow-blue-900/10 border border-gray-200 ring-1 ring-blue-50">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">
            Neutral<span className="text-blue-600">.</span>
          </h2>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400">{t.login.heading}</p>
        </div>

        {success === "account-created" && (
          <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-2xl text-[11px] font-bold uppercase text-center">
            {t.login.accountCreated}
          </div>
        )}

        {invite && (
          <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-2xl text-[11px] font-bold uppercase text-center">
            {t.login.invited}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-[11px] font-bold uppercase text-center">
            {t.login.loginFailed}
          </div>
        )}

        <form onSubmit={handleCredentialsLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 ml-1 mb-1">{t.login.email}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="mail@eksempel.dk"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 ml-1 mb-1">{t.login.password}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="********"
            />
          </div>
          <button
            type="submit"
            disabled={!!loadingProvider}
            className="w-full flex justify-center py-4 px-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 disabled:opacity-50 transition-all"
          >
            {loadingProvider === "credentials" ? t.login.loginLoading : t.login.loginButton}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
            <span className="px-4 bg-white text-gray-400">{t.login.or}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 bg-white">
            <GoogleSignInButton onClick={() => handleOAuthLogin("google")} disabled={!!loadingProvider || !googleEnabled} />
            <span>{loadingProvider === "google" ? "Forbinder..." : "Google"}</span>
          </div>

          <button
            onClick={() => handleOAuthLogin("azure-ad")}
            disabled={!!loadingProvider || !microsoftEnabled}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <MicrosoftIcon />
            {loadingProvider === "azure-ad" ? "Forbinder..." : "Microsoft"}
          </button>
        </div>

        {(!googleEnabled || !microsoftEnabled) && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 text-center">
            Nogle social login providers er midlertidigt deaktiveret i denne miljøopsætning.
          </p>
        )}

        <div className="text-center pt-6 border-t border-gray-50">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">{t.login.missingAccount}</p>
          <Link
            href={invite ? `/register?invite=${encodeURIComponent(invite)}` : "/pricing"}
            className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest mt-2 inline-block"
          >
            {t.login.buyOrCreate}
          </Link>
          <div className="mt-3">
            <Link
              href="/"
              className="text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest"
            >
              {t.login.backToFrontpage}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="2" width="9" height="9" fill="#F25022" />
      <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
      <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
      <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

export default function LoginPage() {
  const t = getMessages("da");
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-black uppercase text-xs tracking-[0.3em] text-gray-300 animate-pulse">
          {t.login.loading}
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
