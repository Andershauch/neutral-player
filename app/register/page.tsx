"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const loginRes = await signIn("credentials", {
          redirect: false,
          email: formData.email,
          password: formData.password,
          callbackUrl: "/admin/dashboard",
        });

        if (loginRes?.ok) {
           router.push("/admin/dashboard");
           router.refresh();
        } else {
           router.push("/login?success=account-created");
        }
      } else {
        const data = await res.json();
        setError(data.error || "Noget gik galt.");
        setIsLoading(false);
      }
    } catch {
      setError("Der opstod en fejl. Prøv igen senere.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-sm w-full space-y-8 bg-white p-6 sm:p-10 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100">
        
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">
            Opret Konto<span className="text-blue-600">.</span>
          </h2>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400">
            Start din administration
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-[11px] font-bold uppercase text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3">
            {/* NAVN */}
            <div>
              <label htmlFor="name" className="block text-[10px] font-black uppercase text-gray-400 ml-1 mb-1">
                Fulde Navn
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="block w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-300"
                placeholder="Anders Andersen"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* EMAIL */}
            <div>
              <label htmlFor="email" className="block text-[10px] font-black uppercase text-gray-400 ml-1 mb-1">
                Email adresse
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-300"
                placeholder="mail@eksempel.dk"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label htmlFor="password" className="block text-[10px] font-black uppercase text-gray-400 ml-1 mb-1">
                Adgangskode
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="block w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-300"
                placeholder="Min. 6 tegn"
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-4 px-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {isLoading ? "Opretter..." : "Opret Bruger"}
            </button>
          </div>
        </form>

        <div className="text-center pt-6 border-t border-gray-50">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
            Har du allerede en konto?
          </p>
          <Link href="/login" className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest mt-2 inline-block">
            Log ind her →
          </Link>
        </div>

      </div>
    </div>
  );
}
