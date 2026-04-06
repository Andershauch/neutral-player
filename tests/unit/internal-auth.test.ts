import { describe, expect, it } from "vitest";
import { getInternalAdminEmails, resolveInternalRole } from "@/lib/internal-auth";

describe("internal auth bootstrap governance", () => {
  it("keeps explicit internal roles unchanged", () => {
    expect(
      resolveInternalRole({
        userRole: "np_super_admin",
        email: "owner@example.com",
        internalEmailAllowlist: new Set(),
      })
    ).toBe("np_super_admin");

    expect(
      resolveInternalRole({
        userRole: "np_support_admin",
        email: "support@example.com",
        internalEmailAllowlist: new Set(["support@example.com"]),
      })
    ).toBe("np_support_admin");
  });

  it("uses INTERNAL_ADMIN_EMAILS only as bootstrap fallback to np_super_admin", () => {
    expect(
      resolveInternalRole({
        userRole: "contributor",
        email: "bootstrap@example.com",
        internalEmailAllowlist: new Set(["bootstrap@example.com"]),
      })
    ).toBe("np_super_admin");
  });

  it("rejects non-internal users outside the bootstrap allowlist", () => {
    expect(
      resolveInternalRole({
        userRole: "contributor",
        email: "member@example.com",
        internalEmailAllowlist: new Set(["bootstrap@example.com"]),
      })
    ).toBeNull();
  });

  it("normalizes INTERNAL_ADMIN_EMAILS values", () => {
    const original = process.env.INTERNAL_ADMIN_EMAILS;
    process.env.INTERNAL_ADMIN_EMAILS = " Admin@One.com, support@two.com ,, THIRD@THREE.COM ";

    try {
      expect([...getInternalAdminEmails()]).toEqual([
        "admin@one.com",
        "support@two.com",
        "third@three.com",
      ]);
    } finally {
      process.env.INTERNAL_ADMIN_EMAILS = original;
    }
  });
});
