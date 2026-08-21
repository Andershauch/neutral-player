import { z } from "zod";

/// EAN-lokationsnumre er altid 13 cifre (GS1 GLN).
const EAN_PATTERN = /^\d{13}$/;
/// CVR er 8 cifre.
const CVR_PATTERN = /^\d{8}$/;

export const invoiceRequestSchema = z.object({
  plan: z.string().min(1, "Vælg en plan."),
  eanNumber: z
    .string()
    .trim()
    .regex(EAN_PATTERN, "EAN-nummer skal være præcis 13 cifre."),
  cvrNumber: z
    .string()
    .trim()
    .regex(CVR_PATTERN, "CVR-nummer skal være 8 cifre.")
    .optional()
    .or(z.literal("")),
  billingContactName: z.string().trim().max(200).optional().or(z.literal("")),
  billingContactEmail: z.string().trim().email("Skriv en gyldig email til fakturakontakten."),
  billingReference: z.string().trim().max(120).optional().or(z.literal("")),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type InvoiceRequestInput = z.infer<typeof invoiceRequestSchema>;

export function normalizeInvoiceRequest(input: InvoiceRequestInput) {
  return {
    plan: input.plan,
    eanNumber: input.eanNumber.trim(),
    cvrNumber: emptyToNull(input.cvrNumber),
    billingContactName: emptyToNull(input.billingContactName),
    billingContactEmail: input.billingContactEmail.trim().toLowerCase(),
    billingReference: emptyToNull(input.billingReference),
    note: emptyToNull(input.note),
  };
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/// Gyldigt EAN-nummer efter GS1's mod-10 kontrolciffer.
/// Fanger tastefejl før en faktura sendes til et forkert lokationsnummer.
export function isValidEanChecksum(ean: string): boolean {
  if (!EAN_PATTERN.test(ean)) return false;

  const digits = ean.split("").map(Number);
  const checkDigit = digits[12];
  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  const expected = (10 - (sum % 10)) % 10;
  return expected === checkDigit;
}
