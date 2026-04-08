import { type MarketingPageKey } from "@/lib/marketing-pages";

export const MARKETING_CONTENT_SCHEMA_VERSION = 1;

export type MarketingLinkVariant = "primary" | "secondary" | "ghost";
export type MarketingMediaKind = "image" | "video";

export interface MarketingLinkField {
  label: string;
  href: string;
  variant: MarketingLinkVariant;
}

export interface MarketingAssetReference {
  assetKey: string;
  alt: string;
}

export interface MarketingHeroMedia {
  kind: MarketingMediaKind;
  primaryAsset: MarketingAssetReference;
  posterAsset?: MarketingAssetReference | null;
}

export interface MarketingHeroSection {
  kicker: string;
  badge?: string | null;
  title: string;
  body: string;
  primaryCta: MarketingLinkField;
  secondaryCta?: MarketingLinkField | null;
  media?: MarketingHeroMedia | null;
}

export interface MarketingSignalItem {
  label: string;
  value: string;
}

export interface MarketingServiceCard {
  title: string;
  summary: string;
  points: string[];
  cta: MarketingLinkField;
}

export interface MarketingStoryCard {
  company: string;
  impact: string;
  quote: string;
  person: string;
  role: string;
}

export interface MarketingCtaBlock {
  kicker: string;
  title: string;
  body: string;
  primaryCta: MarketingLinkField;
  secondaryCta?: MarketingLinkField | null;
  bullets?: string[];
}

export interface HomeMarketingContent {
  schemaVersion: number;
  hero: MarketingHeroSection;
  decisionSignals: MarketingSignalItem[];
  serviceCards: MarketingServiceCard[];
  stories: MarketingStoryCard[];
  trustedBy: string[];
  salesCta: MarketingCtaBlock;
}

export interface PricingMarketingContent {
  schemaVersion: number;
  hero: MarketingHeroSection;
  chooserPoints: string[];
  decisionSignals: MarketingSignalItem[];
  advisoryCta: MarketingCtaBlock;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqGroupContent {
  title: string;
  intro: string;
  items: FaqItem[];
}

export interface FaqMarketingContent {
  schemaVersion: number;
  hero: MarketingHeroSection;
  guidancePoints: string[];
  groups: FaqGroupContent[];
  closingCta: MarketingCtaBlock;
}

export interface ContactInfoCard {
  label: string;
  title: string;
  body: string;
  meta?: string | null;
}

export interface ContactMarketingContent {
  schemaVersion: number;
  hero: MarketingHeroSection;
  contactCards: ContactInfoCard[];
  supportPoints: string[];
  primaryActions: MarketingLinkField[];
}

export type MarketingPageContent =
  | HomeMarketingContent
  | PricingMarketingContent
  | FaqMarketingContent
  | ContactMarketingContent;

export interface MarketingContentValidationResult<T> {
  ok: boolean;
  errors: string[];
  value: T | null;
}

export interface MarketingEditorSection {
  id: string;
  label: string;
  description: string;
}

export const MARKETING_EDITOR_SECTIONS: Record<MarketingPageKey, readonly MarketingEditorSection[]> = {
  home: [
    { id: "hero", label: "Hero", description: "Kicker, overskrift, body, CTA'er og hero-media." },
    { id: "decisionSignals", label: "Signals", description: "Korte beslutningssignaler der leder videre i flowet." },
    { id: "serviceCards", label: "Services", description: "Servicekort med summary, punkter og CTA." },
    { id: "stories", label: "Stories", description: "Kundehistorier med impact, quote og person." },
    { id: "trustedBy", label: "Trusted by", description: "Kort liste med brands eller kunde-navne." },
    { id: "salesCta", label: "Sales CTA", description: "Afsluttende salgsblok med bullets og CTA'er." },
  ],
  pricing: [
    { id: "hero", label: "Hero", description: "Intro til planvalg og de vigtigste CTA'er." },
    { id: "chooserPoints", label: "Chooser points", description: "Rådgivende punkter til planvalg." },
    { id: "decisionSignals", label: "Signals", description: "Små chips der forklarer selvbetjening og sales-led køb." },
    { id: "advisoryCta", label: "Advisory CTA", description: "Sektion der leder videre til FAQ eller salg." },
  ],
  faq: [
    { id: "hero", label: "Hero", description: "Intro til FAQ-flowet og CTA'er." },
    { id: "guidancePoints", label: "Guidance", description: "Korte hjælpepunkter om hvornår man skal bruge FAQ, pricing eller contact." },
    { id: "groups", label: "FAQ groups", description: "Grupper med intro og spørgsmål/svar." },
    { id: "closingCta", label: "Closing CTA", description: "Afsluttende blok til contact eller pricing." },
  ],
  contact: [
    { id: "hero", label: "Hero", description: "Salgsvendt intro med CTA'er." },
    { id: "contactCards", label: "Contact cards", description: "Email, næste skridt og andre salgsnære informationskort." },
    { id: "supportPoints", label: "Support points", description: "Punkter om typiske ting vi hjælper med." },
    { id: "primaryActions", label: "Primary actions", description: "Knapper der leder videre til planvalg eller login." },
  ],
};

export function validateMarketingPageContent(
  pageKey: MarketingPageKey,
  input: unknown
): MarketingContentValidationResult<MarketingPageContent> {
  switch (pageKey) {
    case "home":
      return validateHomeMarketingContent(input);
    case "pricing":
      return validatePricingMarketingContent(input);
    case "faq":
      return validateFaqMarketingContent(input);
    case "contact":
      return validateContactMarketingContent(input);
    default:
      return {
        ok: false,
        errors: [`Ukendt marketing-side: ${String(pageKey)}`],
        value: null,
      };
  }
}

export function validateHomeMarketingContent(input: unknown): MarketingContentValidationResult<HomeMarketingContent> {
  const errors: string[] = [];
  const root = expectObject(input, "home", ["schemaVersion", "hero", "decisionSignals", "serviceCards", "stories", "trustedBy", "salesCta"], errors);
  if (!root) {
    return invalid(errors);
  }

  const value: HomeMarketingContent = {
    schemaVersion: requireSchemaVersion(root, "home.schemaVersion", errors),
    hero: requireHeroSection(root, "hero", errors, { allowMedia: true }),
    decisionSignals: requireSignalItems(root, "decisionSignals", errors, { min: 3, max: 6 }),
    serviceCards: requireServiceCards(root, "serviceCards", errors, { min: 2, max: 6 }),
    stories: requireStoryCards(root, "stories", errors, { min: 1, max: 6 }),
    trustedBy: requireStringList(root, "trustedBy", errors, { min: 1, max: 12, itemLabel: "brandnavn", maxLength: 40 }),
    salesCta: requireCtaBlock(root, "salesCta", errors, { allowBullets: true }),
  };

  return finalize(value, errors);
}

export function validatePricingMarketingContent(
  input: unknown
): MarketingContentValidationResult<PricingMarketingContent> {
  const errors: string[] = [];
  const root = expectObject(input, "pricing", ["schemaVersion", "hero", "chooserPoints", "decisionSignals", "advisoryCta"], errors);
  if (!root) {
    return invalid(errors);
  }

  const value: PricingMarketingContent = {
    schemaVersion: requireSchemaVersion(root, "pricing.schemaVersion", errors),
    hero: requireHeroSection(root, "hero", errors),
    chooserPoints: requireStringList(root, "chooserPoints", errors, { min: 2, max: 6, itemLabel: "rådgivningspunkt", maxLength: 160 }),
    decisionSignals: requireSignalItems(root, "decisionSignals", errors, { min: 2, max: 6 }),
    advisoryCta: requireCtaBlock(root, "advisoryCta", errors),
  };

  return finalize(value, errors);
}

export function validateFaqMarketingContent(input: unknown): MarketingContentValidationResult<FaqMarketingContent> {
  const errors: string[] = [];
  const root = expectObject(input, "faq", ["schemaVersion", "hero", "guidancePoints", "groups", "closingCta"], errors);
  if (!root) {
    return invalid(errors);
  }

  const value: FaqMarketingContent = {
    schemaVersion: requireSchemaVersion(root, "faq.schemaVersion", errors),
    hero: requireHeroSection(root, "hero", errors),
    guidancePoints: requireStringList(root, "guidancePoints", errors, { min: 2, max: 6, itemLabel: "hjælpepunkt", maxLength: 160 }),
    groups: requireFaqGroups(root, "groups", errors, { min: 1, max: 8 }),
    closingCta: requireCtaBlock(root, "closingCta", errors),
  };

  return finalize(value, errors);
}

export function validateContactMarketingContent(
  input: unknown
): MarketingContentValidationResult<ContactMarketingContent> {
  const errors: string[] = [];
  const root = expectObject(input, "contact", ["schemaVersion", "hero", "contactCards", "supportPoints", "primaryActions"], errors);
  if (!root) {
    return invalid(errors);
  }

  const value: ContactMarketingContent = {
    schemaVersion: requireSchemaVersion(root, "contact.schemaVersion", errors),
    hero: requireHeroSection(root, "hero", errors),
    contactCards: requireContactCards(root, "contactCards", errors, { min: 1, max: 6 }),
    supportPoints: requireStringList(root, "supportPoints", errors, { min: 2, max: 6, itemLabel: "supportpunkt", maxLength: 180 }),
    primaryActions: requireLinkArray(root, "primaryActions", errors, { min: 1, max: 3 }),
  };

  return finalize(value, errors);
}

function invalid<T>(errors: string[]): MarketingContentValidationResult<T> {
  return { ok: false, errors, value: null };
}

function finalize<T>(value: T, errors: string[]): MarketingContentValidationResult<T> {
  if (errors.length > 0) {
    return invalid(errors);
  }

  return { ok: true, errors: [], value };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function expectObject(
  input: unknown,
  path: string,
  allowedKeys: readonly string[],
  errors: string[]
): Record<string, unknown> | null {
  if (!isRecord(input)) {
    errors.push(`${path} skal være et objekt.`);
    return null;
  }

  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) {
      errors.push(`${path}.${key} er ikke et tilladt felt.`);
    }
  }

  return input;
}

function requireSchemaVersion(parent: Record<string, unknown>, path: string, errors: string[]): number {
  const value = parent.schemaVersion;
  if (value !== MARKETING_CONTENT_SCHEMA_VERSION) {
    errors.push(`${path} skal være ${MARKETING_CONTENT_SCHEMA_VERSION}.`);
    return MARKETING_CONTENT_SCHEMA_VERSION;
  }
  return value;
}

function requireHeroSection(
  parent: Record<string, unknown>,
  key: string,
  errors: string[],
  options: { allowMedia?: boolean } = {}
): MarketingHeroSection {
  const path = key;
  const section = expectObject(
    parent[key],
    path,
    options.allowMedia ? ["kicker", "badge", "title", "body", "primaryCta", "secondaryCta", "media"] : ["kicker", "badge", "title", "body", "primaryCta", "secondaryCta"],
    errors
  );

  return {
    kicker: section ? requireString(section, `${path}.kicker`, errors, { maxLength: 60 }) : "",
    badge: section ? requireOptionalString(section, `${path}.badge`, errors, { maxLength: 120 }) : null,
    title: section ? requireString(section, `${path}.title`, errors, { maxLength: 160 }) : "",
    body: section ? requireString(section, `${path}.body`, errors, { maxLength: 420 }) : "",
    primaryCta: section ? requireLinkField(section, `${path}.primaryCta`, errors) : emptyLink(),
    secondaryCta: section ? requireOptionalLinkField(section, `${path}.secondaryCta`, errors) : null,
    media: section && options.allowMedia ? requireOptionalHeroMedia(section, `${path}.media`, errors) : null,
  };
}

function requireOptionalHeroMedia(
  parent: Record<string, unknown>,
  path: string,
  errors: string[]
): MarketingHeroMedia | null {
  const value = getValue(parent, path);
  if (value === undefined || value === null) {
    return null;
  }

  const media = expectObject(value, path, ["kind", "primaryAsset", "posterAsset"], errors);
  if (!media) {
    return null;
  }

  const kind = requireEnum(media, `${path}.kind`, ["image", "video"], errors);
  const primaryAsset = requireAssetReference(media, `${path}.primaryAsset`, errors);
  const posterAsset = requireOptionalAssetReference(media, `${path}.posterAsset`, errors);

  return {
    kind,
    primaryAsset,
    posterAsset,
  };
}

function requireAssetReference(parent: Record<string, unknown>, path: string, errors: string[]): MarketingAssetReference {
  const value = getValue(parent, path);
  const asset = expectObject(value, path, ["assetKey", "alt"], errors);
  if (!asset) {
    return { assetKey: "", alt: "" };
  }

  return {
    assetKey: requireSlugLikeString(asset, `${path}.assetKey`, errors),
    alt: requireString(asset, `${path}.alt`, errors, { maxLength: 160 }),
  };
}

function requireOptionalAssetReference(
  parent: Record<string, unknown>,
  path: string,
  errors: string[]
): MarketingAssetReference | null {
  const value = getValue(parent, path);
  if (value === undefined || value === null) {
    return null;
  }
  return requireAssetReference(parent, path, errors);
}

function requireSignalItems(
  parent: Record<string, unknown>,
  path: string,
  errors: string[],
  options: { min: number; max: number }
): MarketingSignalItem[] {
  const values = requireArray(parent, path, errors, options);
  return values.map((value, index) => {
    const itemPath = `${path}[${index}]`;
    const item = expectObject(value, itemPath, ["label", "value"], errors);
    if (!item) {
      return { label: "", value: "" };
    }
    return {
      label: requireString(item, `${itemPath}.label`, errors, { maxLength: 48 }),
      value: requireString(item, `${itemPath}.value`, errors, { maxLength: 140 }),
    };
  });
}

function requireServiceCards(
  parent: Record<string, unknown>,
  path: string,
  errors: string[],
  options: { min: number; max: number }
): MarketingServiceCard[] {
  const values = requireArray(parent, path, errors, options);
  return values.map((value, index) => {
    const itemPath = `${path}[${index}]`;
    const item = expectObject(value, itemPath, ["title", "summary", "points", "cta"], errors);
    if (!item) {
      return { title: "", summary: "", points: [], cta: emptyLink() };
    }
    return {
      title: requireString(item, `${itemPath}.title`, errors, { maxLength: 80 }),
      summary: requireString(item, `${itemPath}.summary`, errors, { maxLength: 220 }),
      points: requireStringList(item, "points", errors, { min: 1, max: 5, itemLabel: "servicepunkt", maxLength: 120 }, itemPath),
      cta: requireLinkField(item, `${itemPath}.cta`, errors),
    };
  });
}

function requireStoryCards(
  parent: Record<string, unknown>,
  path: string,
  errors: string[],
  options: { min: number; max: number }
): MarketingStoryCard[] {
  const values = requireArray(parent, path, errors, options);
  return values.map((value, index) => {
    const itemPath = `${path}[${index}]`;
    const item = expectObject(value, itemPath, ["company", "impact", "quote", "person", "role"], errors);
    if (!item) {
      return { company: "", impact: "", quote: "", person: "", role: "" };
    }
    return {
      company: requireString(item, `${itemPath}.company`, errors, { maxLength: 70 }),
      impact: requireString(item, `${itemPath}.impact`, errors, { maxLength: 140 }),
      quote: requireString(item, `${itemPath}.quote`, errors, { maxLength: 320 }),
      person: requireString(item, `${itemPath}.person`, errors, { maxLength: 80 }),
      role: requireString(item, `${itemPath}.role`, errors, { maxLength: 80 }),
    };
  });
}

function requireCtaBlock(
  parent: Record<string, unknown>,
  path: string,
  errors: string[],
  options: { allowBullets?: boolean } = {}
): MarketingCtaBlock {
  const cta = expectObject(
    getValue(parent, path),
    path,
    options.allowBullets ? ["kicker", "title", "body", "primaryCta", "secondaryCta", "bullets"] : ["kicker", "title", "body", "primaryCta", "secondaryCta"],
    errors
  );
  if (!cta) {
    return {
      kicker: "",
      title: "",
      body: "",
      primaryCta: emptyLink(),
      secondaryCta: null,
      bullets: [],
    };
  }

  return {
    kicker: requireString(cta, `${path}.kicker`, errors, { maxLength: 60 }),
    title: requireString(cta, `${path}.title`, errors, { maxLength: 140 }),
    body: requireString(cta, `${path}.body`, errors, { maxLength: 320 }),
    primaryCta: requireLinkField(cta, `${path}.primaryCta`, errors),
    secondaryCta: requireOptionalLinkField(cta, `${path}.secondaryCta`, errors),
    bullets: options.allowBullets
      ? requireOptionalStringList(cta, "bullets", errors, { min: 1, max: 6, itemLabel: "bullet", maxLength: 140 }, path)
      : [],
  };
}

function requireFaqGroups(
  parent: Record<string, unknown>,
  path: string,
  errors: string[],
  options: { min: number; max: number }
): FaqGroupContent[] {
  const values = requireArray(parent, path, errors, options);
  return values.map((value, index) => {
    const itemPath = `${path}[${index}]`;
    const item = expectObject(value, itemPath, ["title", "intro", "items"], errors);
    if (!item) {
      return { title: "", intro: "", items: [] };
    }

    const items = requireArray(item, `${itemPath}.items`, errors, { min: 1, max: 12 }).map((faqItem, itemIndex) => {
      const faqPath = `${itemPath}.items[${itemIndex}]`;
      const faq = expectObject(faqItem, faqPath, ["question", "answer"], errors);
      if (!faq) {
        return { question: "", answer: "" };
      }
      return {
        question: requireString(faq, `${faqPath}.question`, errors, { maxLength: 180 }),
        answer: requireString(faq, `${faqPath}.answer`, errors, { maxLength: 420 }),
      };
    });

    return {
      title: requireString(item, `${itemPath}.title`, errors, { maxLength: 80 }),
      intro: requireString(item, `${itemPath}.intro`, errors, { maxLength: 220 }),
      items,
    };
  });
}

function requireContactCards(
  parent: Record<string, unknown>,
  path: string,
  errors: string[],
  options: { min: number; max: number }
): ContactInfoCard[] {
  const values = requireArray(parent, path, errors, options);
  return values.map((value, index) => {
    const itemPath = `${path}[${index}]`;
    const item = expectObject(value, itemPath, ["label", "title", "body", "meta"], errors);
    if (!item) {
      return { label: "", title: "", body: "", meta: null };
    }
    return {
      label: requireString(item, `${itemPath}.label`, errors, { maxLength: 40 }),
      title: requireString(item, `${itemPath}.title`, errors, { maxLength: 120 }),
      body: requireString(item, `${itemPath}.body`, errors, { maxLength: 180 }),
      meta: requireOptionalString(item, `${itemPath}.meta`, errors, { maxLength: 160 }),
    };
  });
}

function requireLinkArray(
  parent: Record<string, unknown>,
  path: string,
  errors: string[],
  options: { min: number; max: number }
): MarketingLinkField[] {
  const values = requireArray(parent, path, errors, options);
  return values.map((value, index) => {
    const itemPath = `${path}[${index}]`;
    const item = expectObject(value, itemPath, ["label", "href", "variant"], errors);
    if (!item) {
      return emptyLink();
    }
    return {
      label: requireString(item, `${itemPath}.label`, errors, { maxLength: 40 }),
      href: requireHref(item, `${itemPath}.href`, errors),
      variant: requireEnum(item, `${itemPath}.variant`, ["primary", "secondary", "ghost"], errors),
    };
  });
}

function requireLinkField(parent: Record<string, unknown>, path: string, errors: string[]): MarketingLinkField {
  const value = getValue(parent, path);
  const item = expectObject(value, path, ["label", "href", "variant"], errors);
  if (!item) {
    return emptyLink();
  }

  return {
    label: requireString(item, `${path}.label`, errors, { maxLength: 40 }),
    href: requireHref(item, `${path}.href`, errors),
    variant: requireEnum(item, `${path}.variant`, ["primary", "secondary", "ghost"], errors),
  };
}

function requireOptionalLinkField(
  parent: Record<string, unknown>,
  path: string,
  errors: string[]
): MarketingLinkField | null {
  const value = getValue(parent, path);
  if (value === undefined || value === null) {
    return null;
  }
  return requireLinkField(parent, path, errors);
}

function requireArray(
  parent: Record<string, unknown>,
  path: string,
  errors: string[],
  options: { min: number; max: number }
): unknown[] {
  const value = getValue(parent, path);
  if (!Array.isArray(value)) {
    errors.push(`${path} skal være en liste.`);
    return [];
  }
  if (value.length < options.min || value.length > options.max) {
    errors.push(`${path} skal have mellem ${options.min} og ${options.max} elementer.`);
  }
  return value;
}

function requireStringList(
  parent: Record<string, unknown>,
  key: string,
  errors: string[],
  options: { min: number; max: number; itemLabel: string; maxLength: number },
  basePath = key
): string[] {
  const values = requireArray(parent, `${basePath === key ? key : `${basePath}.${key}`}`, errors, options);
  return values.map((value, index) => {
    const itemPath = `${basePath === key ? key : `${basePath}.${key}`}[${index}]`;
    if (typeof value !== "string" || !value.trim()) {
      errors.push(`${itemPath} skal være en ikke-tom ${options.itemLabel}.`);
      return "";
    }
    const trimmed = value.trim();
    if (trimmed.length > options.maxLength) {
      errors.push(`${itemPath} er for lang.`);
    }
    return trimmed;
  });
}

function requireOptionalStringList(
  parent: Record<string, unknown>,
  key: string,
  errors: string[],
  options: { min: number; max: number; itemLabel: string; maxLength: number },
  basePath = key
): string[] {
  const value = parent[key];
  if (value === undefined || value === null) {
    return [];
  }
  return requireStringList(parent, key, errors, options, basePath);
}

function requireString(
  parent: Record<string, unknown>,
  path: string,
  errors: string[],
  options: { maxLength: number; minLength?: number }
): string {
  const value = getValue(parent, path);
  if (typeof value !== "string" || !value.trim()) {
    errors.push(`${path} mangler eller er tom.`);
    return "";
  }

  const trimmed = value.trim();
  if (trimmed.length > options.maxLength) {
    errors.push(`${path} er for lang.`);
  }
  if (options.minLength && trimmed.length < options.minLength) {
    errors.push(`${path} er for kort.`);
  }
  return trimmed;
}

function requireOptionalString(
  parent: Record<string, unknown>,
  path: string,
  errors: string[],
  options: { maxLength: number }
): string | null {
  const value = getValue(parent, path);
  if (value === undefined || value === null) {
    return null;
  }
  return requireString(parent, path, errors, options);
}

function requireEnum<T extends string>(
  parent: Record<string, unknown>,
  path: string,
  allowed: readonly T[],
  errors: string[]
): T {
  const value = getValue(parent, path);
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    errors.push(`${path} skal være en af: ${allowed.join(", ")}.`);
    return allowed[0];
  }
  return value as T;
}

function requireHref(parent: Record<string, unknown>, path: string, errors: string[]): string {
  const value = requireString(parent, path, errors, { maxLength: 240 });
  const isInternal = value.startsWith("/");
  const isExternal = value.startsWith("https://");
  if (!isInternal && !isExternal) {
    errors.push(`${path} skal starte med / eller https://.`);
  }
  return value;
}

function requireSlugLikeString(parent: Record<string, unknown>, path: string, errors: string[]): string {
  const value = requireString(parent, path, errors, { maxLength: 80 });
  if (!/^[a-z0-9][a-z0-9/_-]*$/i.test(value)) {
    errors.push(`${path} skal være en sikker asset-reference.`);
  }
  return value;
}

function getValue(parent: Record<string, unknown>, path: string): unknown {
  const segments = path.split(".");
  let current: unknown = parent;
  for (const segment of segments) {
    if (!isRecord(current)) {
      current = undefined;
      break;
    }
    current = current[segment];
  }

  if (current !== undefined) {
    return current;
  }

  const leafKey = segments.at(-1);
  if (!leafKey || !isRecord(parent)) {
    return undefined;
  }

  return parent[leafKey];
}

function emptyLink(): MarketingLinkField {
  return {
    label: "",
    href: "/",
    variant: "primary",
  };
}
