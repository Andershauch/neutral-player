"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleOAuthLogin = async (provider: string) => {
    setLoadingProvider(provider);
    await signIn(provider, { callbackUrl: "/admin/dashboard" });
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProvider("credentials");
    
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: "/admin/dashboard"
    });

    if (result?.error) {
       alert("Forkert email eller adgangskode");
       setLoadingProvider(null);
    } else {
       router.push("/admin/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
      {/* Containeren er nu max-w-sm for at se skarpere ud på alle skærme */}
      <div className="max-w-sm w-full space-y-8 bg-white p-6 sm:p-10 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100">
        
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">
            Neutral<span className="text-blue-600">.</span>
          </h2>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400">
            Velkommen tilbage
          </p>
        </div>

        {/* BESKEDER */}
        {success === "account-created" && (
          <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-2xl text-[11px] font-bold uppercase text-center">
            Konto oprettet! Log ind herunder.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-[11px] font-bold uppercase text-center">
            Login fejlede. Prøv igen.
          </div>
        )}

        {/* EMAIL FORMULAR */}
        <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 ml-1 mb-1">Email</label>
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
                <label className="block text-[10px] font-black uppercase text-gray-400 ml-1 mb-1">Adgangskode</label>
                <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                />
            </div>
            <button
                type="submit"
                disabled={!!loadingProvider}
                className="w-full flex justify-center py-4 px-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 disabled:opacity-50 transition-all"
            >
                {loadingProvider === "credentials" ? "Logger ind..." : "Log ind"}
            </button>
        </form>

        {/* DELER */}
        <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="px-4 bg-white text-gray-400">Eller</span></div>
        </div>

        {/* SOCIAL LOGIN */}
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => handleOAuthLogin("google")}
            disabled={!!loadingProvider}
            className="w-full flex items-center justify-center py-3 px-4 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            <svg className="h-4 w-4 mr-3" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {loadingProvider === "google" ? "Forbinder..." : "Google"}
          </button>

          <button
            onClick={() => handleOAuthLogin("azure-ad")}
            disabled={!!loadingProvider}
            className="w-full flex items-center justify-center py-3 px-4 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            <svg className="h-4 w-4 mr-3" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
            {loadingProvider === "azure-ad" ? "Forbinder..." : "Microsoft"}
          </button>
        </div>
        
        {/* OPRET BRUGER LINK */}
        <div className="text-center pt-6 border-t border-gray-50">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                Mangler du en konto?
            </p>
            <Link href="/register" className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest mt-2 inline-block">
                Opret her →
            </Link>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black uppercase text-xs tracking-[0.3em] text-gray-300 animate-pulse">Indlæser...</div>}>
      <LoginContent />
    </Suspense>
  );
}