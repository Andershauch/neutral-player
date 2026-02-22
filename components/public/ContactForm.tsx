"use client";

import { useState } from "react";

interface FormState {
  name: string;
  email: string;
  company: string;
  message: string;
  website: string;
}

export default function ContactForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    company: "",
    message: "",
    website: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Kunne ikke sende beskeden.");
      }
      setSuccess(true);
      setForm({ name: "", email: "", company: "", message: "", website: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukendt fejl");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5 space-y-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Skriv til os</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1">
            Navn
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={onChange("name")}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Dit navn"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={onChange("email")}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="mail@firma.dk"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1">
          Firma (valgfrit)
        </label>
        <input
          type="text"
          value={form.company}
          onChange={onChange("company")}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Firmanavn"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1">
          Besked
        </label>
        <textarea
          required
          minLength={10}
          value={form.message}
          onChange={onChange("message")}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 min-h-32"
          placeholder="Fortæl kort hvad du gerne vil have hjælp til."
        />
      </div>

      <input
        type="text"
        value={form.website}
        onChange={onChange("website")}
        autoComplete="off"
        tabIndex={-1}
        className="hidden"
        aria-hidden
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          {loading ? "Sender..." : "Send besked"}
        </button>
        {success && <p className="text-xs font-semibold text-emerald-700">Tak, vi vender tilbage snart.</p>}
      </div>

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    </form>
  );
}

