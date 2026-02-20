import { createHmac, timingSafeEqual } from "crypto";

interface VerificationPayload {
  userId: string;
  email: string;
  exp: number;
}

export function createEmailVerificationToken(input: {
  userId: string;
  email: string;
  expiresInSeconds?: number;
}): string {
  const exp = Math.floor(Date.now() / 1000) + (input.expiresInSeconds ?? 60 * 60 * 24);
  const payload: VerificationPayload = {
    userId: input.userId,
    email: input.email.toLowerCase(),
    exp,
  };
  const payloadJson = JSON.stringify(payload);
  const encoded = toBase64Url(payloadJson);
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function parseEmailVerificationToken(token: string): VerificationPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  if (!safeEqualHex(signature, expected)) return null;

  try {
    const json = fromBase64Url(encoded);
    const payload = JSON.parse(json) as VerificationPayload;
    if (!payload.userId || !payload.email || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function sign(input: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET mangler.");
  }
  return createHmac("sha256", secret).update(input).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const aBuf = Buffer.from(a, "hex");
    const bBuf = Buffer.from(b, "hex");
    if (aBuf.length !== bBuf.length) return false;
    return timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}
