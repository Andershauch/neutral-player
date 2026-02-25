"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMessages } from "@/lib/i18n/messages";

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
          <button
            onClick={() => handleOAuthLogin("google")}
            disabled={!!loadingProvider || !googleEnabled}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <GoogleIcon />
            {loadingProvider === "google" ? "Forbinder..." : "Google"}
          </button>

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

function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="11" cy="11" r="10.5" fill="#fff" stroke="#D1D5DB" />
      <g transform="translate(5 5) scale(0.5)">
        <path fill="#EA4335" d="M24 12.3c0-.8-.1-1.6-.3-2.3H12v4.4h6.7c-.3 1.5-1.2 2.8-2.5 3.7v3h4.1c2.4-2.2 3.7-5.4 3.7-8.8z" />
        <path fill="#34A853" d="M12 24c3.2 0 5.8-1 7.7-2.9l-4.1-3c-1.1.8-2.5 1.2-3.9 1.2-3 0-5.6-2-6.5-4.8H1v3.1A12 12 0 0 0 12 24z" />
        <path fill="#4A90E2" d="M5.1 14.5a7.2 7.2 0 0 1 0-5V6.4H1a12 12 0 0 0 0 10.7l4.1-3.1z" />
        <path fill="#FBBC05" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1 6.4l4.1 3.1c.9-2.8 3.5-4.7 6.9-4.7z" />
      </g>
    </svg>
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
