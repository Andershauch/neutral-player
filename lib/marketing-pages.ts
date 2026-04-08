export const MARKETING_PAGE_KEYS = ["home", "pricing", "faq", "contact"] as const;

export type MarketingPageKey = (typeof MARKETING_PAGE_KEYS)[number];

export const MARKETING_PAGE_TITLES: Record<MarketingPageKey, string> = {
  home: "Landing",
  pricing: "Pricing",
  faq: "FAQ",
  contact: "Contact",
};

export const MARKETING_PAGE_DESCRIPTIONS: Record<MarketingPageKey, string> = {
  home: "Forsiden med hero, servicevalg, historier og salgs-CTA.",
  pricing: "Pricing-siden med planvalg, rådgivning og pricing-nære CTA'er.",
  faq: "FAQ-siden med grupperede spørgsmål, svar og afsluttende CTA.",
  contact: "Contact-siden med salgsintro, kontaktkort og primære handlinger.",
};

export const MARKETING_PAGE_VERSION_STATUSES = ["draft", "published", "archived"] as const;

export type MarketingPageVersionStatus = (typeof MARKETING_PAGE_VERSION_STATUSES)[number];

export function isSupportedMarketingPageKey(value: string): value is MarketingPageKey {
  return MARKETING_PAGE_KEYS.includes(value as MarketingPageKey);
}
