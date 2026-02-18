import crypto from "crypto";

export const inviteRoles = ["owner", "admin", "editor", "viewer"] as const;
export type InviteRole = (typeof inviteRoles)[number];

export function isInviteRole(value: string): value is InviteRole {
  return inviteRoles.includes(value as InviteRole);
}

export function createInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashInviteToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getInviteExpiry(days = 7): Date {
  const now = Date.now();
  const ms = days * 24 * 60 * 60 * 1000;
  return new Date(now + ms);
}

export function getBaseUrl(requestUrl?: string): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.APP_URL) return process.env.APP_URL;
  if (requestUrl) return new URL(requestUrl).origin;
  return "http://localhost:3000";
}
