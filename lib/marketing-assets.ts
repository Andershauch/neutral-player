export const MARKETING_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"] as const;
export const MARKETING_MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MARKETING_ASSET_FALLBACK_URL = "/images/hero-product-demo.svg";

export type MarketingImageMimeType = (typeof MARKETING_IMAGE_MIME_TYPES)[number];

export function isAllowedMarketingImageMimeType(value: string): value is MarketingImageMimeType {
  return MARKETING_IMAGE_MIME_TYPES.includes(value as MarketingImageMimeType);
}

export function createMarketingAssetKey(input: {
  fileName: string;
  title?: string | null;
  suffix?: string;
}): string {
  const base = sanitizeMarketingAssetSegment(input.title || stripExtension(input.fileName));
  const suffix = sanitizeMarketingAssetSegment(input.suffix || Date.now().toString());
  return `marketing/${base}-${suffix}`;
}

export function sanitizeMarketingAssetSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "asset";
}

export function createDataUrlFromBytes(bytes: Uint8Array, mimeType: MarketingImageMimeType): string {
  return `data:${mimeType};base64,${Buffer.from(bytes).toString("base64")}`;
}

export function describeAspectRatio(width: number | null, height: number | null): string {
  if (!width || !height || width <= 0 || height <= 0) {
    return "Ukendt ratio";
  }

  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.06) {
    return "16:9 anbefales til hero og story-flader";
  }
  if (Math.abs(ratio - 4 / 3) < 0.06) {
    return "4:3 passer godt til editor-preview og support-kort";
  }
  if (Math.abs(ratio - 1) < 0.04) {
    return "1:1 fungerer bedst til logoer og små badges";
  }
  if (ratio > 1.65) {
    return "Bred ratio passer bedst til hero-flader";
  }
  if (ratio < 0.9) {
    return "Stående ratio kræver ekstra omtanke i hero-flader";
  }
  return "Custom ratio, tjek preview før publish";
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}
