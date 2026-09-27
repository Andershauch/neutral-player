"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Card from "@/components/ui/Card";

interface InvoiceRequestFormProps {
  planKey: string;
  planName: string;
  defaults: {
    eanNumber: string;
    cvrNumber: string;
    billingContactName: string;
    billingContactEmail: string;
    billingReference: string;
  };
  hasPendingRequest: boolean;
}

export default function InvoiceRequestForm({
  planKey,
  planName,
  defaults,
  hasPendingRequest,
}: InvoiceRequestFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(defaults);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const update = (field: keyof typeof defaults) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/invoice-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey, ...form, note }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke sende anmodningen.");
      }
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ukendt fejl");
    } finally {
      setSaving(false);
    }
  };

  if (done || hasPendingRequest) {
    return (
      <Card className="space-y-4">
        <p className="np-kicker text-blue-600">Anmodning modtaget</p>
        <h2 className="text-lg font-bold uppercase tracking-tight text-gray-900">
          Vi behandler jeres anmodning
        </h2>
        <p className="max-w-prose text-sm text-gray-600">
          Vi sender en faktura til det oplyste EAN-nummer. Så snart fakturaen er registreret, aktiverer vi{" "}
          <span className="font-semibold">{planName}</span> på jeres workspace. I beholder adgangen i prøveperioden
          imens.
        </p>
        <Link href="/admin/billing" className="np-btn-ghost inline-flex px-4 py-3">
          Tilbage til plan
        </Link>
      </Card>
    );
  }

  return (
    <form onSubmit={submit} className="np-card np-card-pad space-y-5">
      <div className="space-y-1">
        <p className="np-kicker text-blue-600">{planName}</p>
        <h2 className="text-lg font-bold uppercase tracking-tight text-gray-900">Anmod om faktura</h2>
        <p className="max-w-prose text-sm text-gray-500">
          Offentlige kunder betaler via EAN-faktura frem for kort. Udfyld oplysningerne, så sender vi fakturaen og
          aktiverer planen, når den er registreret.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          id="eanNumber"
          label="EAN-nummer"
          hint="13 cifre"
          value={form.eanNumber}
          onChange={update("eanNumber")}
          required
          inputMode="numeric"
          disabled={saving}
        />
        <Field
          id="cvrNumber"
          label="CVR-nummer"
          hint="8 cifre, valgfrit"
          value={form.cvrNumber}
          onChange={update("cvrNumber")}
          inputMode="numeric"
          disabled={saving}
        />
        <Field
          id="billingContactName"
          label="Fakturakontakt"
          hint="Navn på den der modtager fakturaen"
          value={form.billingContactName}
          onChange={update("billingContactName")}
          disabled={saving}
        />
        <Field
          id="billingContactEmail"
          label="Email til fakturakontakt"
          type="email"
          value={form.billingContactEmail}
          onChange={update("billingContactEmail")}
          required
          disabled={saving}
        />
        <Field
          id="billingReference"
          label="Rekvisitionsnummer"
          hint="Valgfrit, men mange kommuner kræver det"
          value={form.billingReference}
          onChange={update("billingReference")}
          disabled={saving}
        />
      </div>

      <div>
        <label htmlFor="note" className="mb-1 ml-1 block text-[10px] font-black uppercase text-gray-400">
          Bemærkning
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          disabled={saving}
          className="np-field"
          placeholder="Fx forventet antal enheder, ønsket startdato eller kontraktreference."
        />
      </div>

      {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" disabled={saving} className="np-btn-primary px-5 py-3 disabled:opacity-50">
          {saving ? "Sender..." : "Send anmodning"}
        </button>
        <Link href="/admin/billing" className="np-btn-ghost inline-flex justify-center px-5 py-3">
          Annullér
        </Link>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  ...inputProps
}: {
  id: string;
  label: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 ml-1 block text-[10px] font-black uppercase text-gray-400">
        {label}
      </label>
      <input id={id} name={id} className="np-field" {...inputProps} />
      {hint ? <p className="mt-1 ml-1 text-[11px] text-gray-400">{hint}</p> : null}
    </div>
  );
}
