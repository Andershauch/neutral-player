"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import { getMessages } from "@/lib/i18n/messages";

function RegisterContent() {
  const t = getMessages("da");
  const router = useRouter();
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");
  const callbackUrl = invite ? `/invite/${encodeURIComponent(invite)}` : "/setup/workspace";

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

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error || "Noget gik galt.");
        setIsLoading(false);
        return;
      }

      const loginRes = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
        callbackUrl,
      });

      if (loginRes?.ok) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }

      const loginUrl = invite
        ? `/login?success=account-created&invite=${encodeURIComponent(invite)}`
        : "/login?success=account-created";
      router.push(loginUrl);
    } catch {
      setError(t.register.genericError);
      setIsLoading(false);
    }
  };

  return (
    <div className="np-page-stack">
      <PublicSiteHeader />
      <div className="np-form-shell">
        <div className="np-form-layout">
          <aside className="np-form-aside">
            <div className="space-y-4">
              <p className="np-form-kicker">Opret konto</p>
              <h1 className="np-form-title">Start roligt, og byg videre bagefter.</h1>
              <p className="np-form-copy">
                Kontooprettelsen skal føles tæt på planvalg og onboarding. Derfor holder vi samme visuelle retning og
                leder videre til workspace-setup uden at miste momentum.
              </p>
            </div>

            <div className="np-section-card-muted">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Efter oprettelse</p>
              <ul className="mt-4 np-system-list">
                <li>Du bliver sendt videre til workspace setup eller invitationen du kom fra.</li>
                <li>Du kan vælge plan, verificere email og fortsætte direkte mod første projekt.</li>
                <li>Hvis du er i tvivl om løsning, kan du stadig vende tilbage til pricing eller kontakt.</li>
              </ul>
            </div>

            <div className="np-data-strip">
              <div className="np-data-chip">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Hurtig vej ind</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">Fra konto til workspace på få trin.</p>
              </div>
              <div className="np-data-chip">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Inviteret?</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">Vi bruger samme flow og sender dig tilbage til invitationen.</p>
              </div>
              <div className="np-data-chip">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Brug for sparring?</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">Kontakt os hvis du vil afklare plan eller service før opstart.</p>
              </div>
            </div>
          </aside>

          <div className="np-form-card space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">
                {t.register.title}
                <span className="text-blue-600">.</span>
              </h2>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400">{t.register.subtitle}</p>
            </div>

            {invite && <div className="np-status-banner np-status-banner-info">{t.register.invited}</div>}

            {error && <div className="np-status-banner np-status-banner-error">{error}</div>}

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <div>
                  <label htmlFor="name" className="mb-1 ml-1 block text-[10px] font-black uppercase text-gray-400">
                    {t.register.name}
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="np-field"
                    placeholder="Anders Andersen"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-1 ml-1 block text-[10px] font-black uppercase text-gray-400">
                    {t.register.email}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="np-field"
                    placeholder="mail@eksempel.dk"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-1 ml-1 block text-[10px] font-black uppercase text-gray-400">
                    {t.register.password}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="np-field"
                    placeholder={t.register.passwordPlaceholder}
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
                  className="np-btn-primary flex w-full justify-center px-4 py-4 disabled:opacity-50 active:scale-[0.98]"
                >
                  {isLoading ? t.register.creating : t.register.createButton}
                </button>
              </div>
            </form>

            <div className="border-t border-gray-50 pt-6 text-center">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">{t.register.hasAccount}</p>
              <Link
                href={invite ? `/login?invite=${encodeURIComponent(invite)}` : "/login"}
                className="mt-2 inline-block text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
              >
                {t.register.loginHere}
              </Link>
              <div className="mt-3">
                <Link href="/pricing" className="text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest">
                  {t.register.seePlans}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const t = getMessages("da");
  return (
    <Suspense
      fallback={
        <div className="np-default-theme np-page-shell">
          <div className="np-page-wrap np-page-stack">
            <PublicSiteHeader />
            <div className="min-h-[60vh] flex items-center justify-center font-black uppercase text-xs tracking-[0.3em] text-gray-300 animate-pulse">
              {t.register.loading}
            </div>
          </div>
        </div>
      }
    >
      <div className="np-default-theme np-page-shell">
        <div className="np-page-wrap np-page-stack">
          <RegisterContent />
        </div>
      </div>
    </Suspense>
  );
}
