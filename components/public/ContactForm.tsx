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
    <form onSubmit={onSubmit} className="np-section-card-muted space-y-4">
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Skriv til os</p>
        <p className="text-sm leading-6 text-gray-600">
          Fortæl kort hvad du vil have hjælp til, så vender vi tilbage med det rigtige næste skridt.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">
            Navn
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={onChange("name")}
            className="np-field"
            placeholder="Dit navn"
          />
        </div>
        <div>
          <label className="mb-1 ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">
            Email
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={onChange("email")}
            className="np-field"
            placeholder="mail@firma.dk"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">
          Firma (valgfrit)
        </label>
        <input
          type="text"
          value={form.company}
          onChange={onChange("company")}
          className="np-field"
          placeholder="Firmanavn"
        />
      </div>

      <div>
        <label className="mb-1 ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">
          Besked
        </label>
        <textarea
          required
          minLength={10}
          value={form.message}
          onChange={onChange("message")}
          className="np-textarea"
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
        <button type="submit" disabled={loading} className="np-btn-primary px-5 py-3 disabled:opacity-50">
          {loading ? "Sender..." : "Send besked"}
        </button>
        {success && <p className="text-xs font-semibold text-emerald-700">Tak, vi vender tilbage snart.</p>}
      </div>

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    </form>
  );
}
