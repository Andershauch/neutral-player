import { describe, expect, it } from "vitest";
import {
  canEditContentRole,
  canManageBillingRole,
  canManageMembersRole,
  canViewContentRole,
} from "@/lib/authz";

describe("RBAC role helpers", () => {
  it("allows viewers to view but not edit/manage", () => {
    expect(canViewContentRole("viewer")).toBe(true);
    expect(canEditContentRole("viewer")).toBe(false);
    expect(canManageMembersRole("viewer")).toBe(false);
    expect(canManageBillingRole("viewer")).toBe(false);
  });

  it("allows editors to edit but not manage members/billing", () => {
    expect(canViewContentRole("editor")).toBe(true);
    expect(canEditContentRole("editor")).toBe(true);
    expect(canManageMembersRole("editor")).toBe(false);
    expect(canManageBillingRole("editor")).toBe(false);
  });

  it("allows admins and owners to manage members and billing", () => {
    for (const role of ["admin", "owner"] as const) {
      expect(canViewContentRole(role)).toBe(true);
      expect(canEditContentRole(role)).toBe(true);
      expect(canManageMembersRole(role)).toBe(true);
      expect(canManageBillingRole(role)).toBe(true);
    }
  });
});
