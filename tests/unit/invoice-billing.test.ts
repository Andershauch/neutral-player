import { describe, expect, it } from "vitest";
import { invoiceRequestSchema, isValidEanChecksum, normalizeInvoiceRequest } from "@/lib/invoice-billing";

describe("EAN invoice requests", () => {
  it("accepts a complete public-sector request", () => {
    const parsed = invoiceRequestSchema.safeParse({
      plan: "kommune_monthly",
      eanNumber: "5798009811578",
      cvrNumber: "29189846",
      billingContactEmail: "faktura@kommune.dk",
      billingReference: "REK-2026-114",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an EAN number that is not 13 digits", () => {
    const parsed = invoiceRequestSchema.safeParse({
      plan: "kommune_monthly",
      eanNumber: "57980098",
      billingContactEmail: "faktura@kommune.dk",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an invalid billing email", () => {
    const parsed = invoiceRequestSchema.safeParse({
      plan: "kommune_monthly",
      eanNumber: "5798009811578",
      billingContactEmail: "ikke-en-email",
    });
    expect(parsed.success).toBe(false);
  });

  it("normalizes optional fields to null instead of empty strings", () => {
    const normalized = normalizeInvoiceRequest({
      plan: "kommune_monthly",
      eanNumber: " 5798009811578 ",
      cvrNumber: "",
      billingContactName: "",
      billingContactEmail: "Faktura@Kommune.DK",
      billingReference: "",
      note: "",
    });

    expect(normalized.eanNumber).toBe("5798009811578");
    expect(normalized.billingContactEmail).toBe("faktura@kommune.dk");
    expect(normalized.cvrNumber).toBeNull();
    expect(normalized.billingReference).toBeNull();
  });

  it("validates the GS1 check digit so typos are caught before invoicing", () => {
    expect(isValidEanChecksum("5798009811578")).toBe(true);
    // Samme nummer med ét forkert ciffer.
    expect(isValidEanChecksum("5798009811579")).toBe(false);
    expect(isValidEanChecksum("abc")).toBe(false);
  });
});
