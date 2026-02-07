"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link"; // <--- Vigtig: Bruges til linket

function LoginContent() {
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  
  // Hent parametre fra URL (fejl eller succes beskeder)
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");

  // State til email/password formen
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Håndterer Google og Microsoft login
  const handleOAuthLogin = async (provider: string) => {
    setLoadingProvider(provider);
    await signIn(provider, { callbackUrl: "/admin/dashboard" });
  };

  // Håndterer Email/Password login
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-bold text-gray-900">Velkommen</h2>
          <p className="mt-2 text-sm text-gray-600">Log ind på din konto</p>
        </div>

        {/* SUCCES BESKED (Hvis man lige har oprettet sig) */}
        {success === "account-created" && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm text-center">
            Din konto er oprettet! Du kan nu logge ind.
          </div>
        )}

        {/* FEJL BESKED */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm text-center">
            Der opstod en fejl ved login.
          </div>
        )}

        {/* EMAIL FORMULAR */}
        <form onSubmit={handleCredentialsLogin} className="space-y-4 mt-8">
            <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="mail@eksempel.dk"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Adgangskode</label>
                <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="••••••••"
                />
            </div>
            <button
                type="submit"
                disabled={!!loadingProvider}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
                {loadingProvider === "credentials" ? "Logger ind..." : "Log ind"}
            </button>
        </form>

        {/* DELER ("ELLER") */}
        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Eller fortsæt med</span></div>
        </div>

        {/* GOOGLE & MICROSOFT KNAPPER */}
        <div className="space-y-3">
          <button
            onClick={() => handleOAuthLogin("google")}
            disabled={!!loadingProvider}
            className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm"
          >
            <span className="mr-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            </span>
            {loadingProvider === "google" ? "Forbinder..." : "Log ind med Google"}
          </button>

          <button
            onClick={() => handleOAuthLogin("azure-ad")}
            disabled={!!loadingProvider}
            className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm"
          >
            <span className="mr-2">
               <svg className="h-5 w-5" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
            </span>
            {loadingProvider === "azure-ad" ? "Forbinder..." : "Log ind med Microsoft"}
          </button>
        </div>
        
        {/* LINK TIL OPRET BRUGER (Det du manglede!) */}
        <div className="text-center mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
                Har du ikke en konto endnu?
                <br />
                <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline mt-1 inline-block">
                    Opret ny bruger her →
                </Link>
            </p>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Indlæser...</div>}>
      <LoginContent />
    </Suspense>
  );
}