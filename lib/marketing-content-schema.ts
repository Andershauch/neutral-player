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

export interface MarketingEditorField {
  /// Feltnavnet som det staar i JSON.
  name: string;
  /// Hvad feltet betyder, skrevet til en redaktoer og ikke til en udvikler.
  what: string;
  /// Konkret raad om laengde, tone eller format.
  guidance?: string;
  required: boolean;
}

export interface MarketingEditorSection {
  id: string;
  label: string;
  description: string;
  /// Hvor paa siden sektionen lander, saa redaktoeren kan finde den igen.
  placement: string;
  /// Hvad sektionen skal opnaa. Det vigtigste at forstaa foer man skriver.
  purpose: string;
  /// Antalsgraenser, hvis sektionen er en liste.
  count?: { min: number; max: number; unit: string };
  fields: MarketingEditorField[];
  /// Konkrete raad om hvad der virker og hvad man skal undgaa.
  tips?: string[];
}

/// Faellesfelter der gaar igen paa tvaers af sektioner.
const CTA_FIELDS: MarketingEditorField[] = [
  {
    name: "label",
    what: "Teksten på knappen.",
    guidance: "Skriv hvad der sker, når man klikker. \"Prøv gratis i 10 dage\" slår \"Læs mere\".",
    required: true,
  },
  {
    name: "href",
    what: "Hvor knappen fører hen.",
    guidance: "Skal starte med / og pege på en side vi selv har, fx /register, /pricing eller /contact.",
    required: true,
  },
  {
    name: "variant",
    what: "Knappens vægt.",
    guidance: "\"primary\" til det ene vigtigste skridt. \"ghost\" eller \"secondary\" til alt andet.",
    required: true,
  },
];

const HERO_FIELDS: MarketingEditorField[] = [
  {
    name: "kicker",
    what: "Den lille linje over overskriften, der siger hvem siden er til.",
    guidance: "3-8 ord. Fx \"Video til kommuner, skoler og offentlige institutioner\".",
    required: true,
  },
  {
    name: "badge",
    what: "Lille fremhævet linje under kickeren. Kan udelades med null.",
    guidance: "Brug den til ét konkret løfte, ikke til et slogan.",
    required: false,
  },
  {
    name: "title",
    what: "Sidens overskrift.",
    guidance:
      "Skriv hvad kunden får, ikke hvad produktet hedder. Hold den under 60 tegn, så den ikke brækker på mobil.",
    required: true,
  },
  {
    name: "body",
    what: "Afsnittet under overskriften.",
    guidance: "2-3 sætninger. Forklar hvad man gør, og hvad man får ud af det. Undgå fagsprog.",
    required: true,
  },
  { name: "primaryCta", what: "Den vigtigste knap på siden.", required: true },
  { name: "secondaryCta", what: "Den sekundære knap. Kan udelades med null.", required: false },
];

export const MARKETING_EDITOR_SECTIONS: Record<MarketingPageKey, readonly MarketingEditorSection[]> = {
  home: [
    {
      id: "hero",
      label: "Hero",
      description: "Det første besøgende ser: overskrift, brødtekst, knapper og demovideo.",
      placement: "Øverst på forsiden, ved siden af afspilleren.",
      purpose:
        "Svar på tre spørgsmål inden for ti sekunder: hvad er det, hvem er det til, og hvad gør jeg nu. En besøgende fra en kommune skal kunne se sig selv i teksten med det samme.",
      fields: [
        ...HERO_FIELDS,
        {
          name: "media",
          what: "Billede eller video i heroen. Kan udelades med null.",
          guidance:
            "Peger på et asset via assetKey. Selve demoafspilleren på forsiden styres af en indstilling i systemet, ikke herfra.",
          required: false,
        },
      ],
      tips: [
        "Skriv til den, der skal købe: en kommunikationsmedarbejder eller en it-ansvarlig, ikke en udvikler.",
        "Undgå ord som platform, løsning og synergi. Skriv hvad man konkret kan gøre.",
        "Teksten må ikke handle om siden selv. En sætning som “Her kan du se vores services” fortæller ingenting.",
      ],
    },
    {
      id: "decisionSignals",
      label: "Signaler",
      description: "Tre til seks korte chips, der understøtter beslutningen.",
      placement: "Lige under knapperne i heroen.",
      purpose:
        "Fjern den tvivl, der ellers stopper et køb. Her hører de hårde fakta hjemme: tilgængelighed, antal sprog, hvordan man betaler.",
      count: { min: 3, max: 6, unit: "signaler" },
      fields: [
        {
          name: "label",
          what: "Overskriften på chippen.",
          guidance: "1-3 ord, fx “Tilgængelighed” eller “Offentligt indkøb”.",
          required: true,
        },
        {
          name: "value",
          what: "Selve fakta.",
          guidance:
            "Én kort sætning. Vær konkret: “EAN-faktura og databehandleraftale” slår “Nem opsætning”.",
          required: true,
        },
      ],
      tips: [
        "Brug kun ting, vi kan stå inde for. Det her er de påstande, en indkøber tjekker.",
        "Tal og lovkrav virker bedre end tillægsord.",
      ],
    },
    {
      id: "serviceCards",
      label: "Anvendelser",
      description: "To til seks kort, der viser hvor produktet bruges.",
      placement: "Midt på forsiden, under heroen.",
      purpose:
        "Lad den besøgende genkende sin egen opgave. Skriv kortene efter situation (borgerinformation, skole, HR), ikke efter funktion.",
      count: { min: 2, max: 6, unit: "kort" },
      fields: [
        {
          name: "title",
          what: "Situationen kortet handler om.",
          guidance: "1-3 ord, fx “Borgerinformation” eller “Skoler og uddannelse”.",
          required: true,
        },
        {
          name: "summary",
          what: "Hvornår det her er relevant.",
          guidance: "Én sætning, der starter med “Når...”. Beskriv opgaven, ikke produktet.",
          required: true,
        },
        {
          name: "points",
          what: "Liste med korte punkter om hvad man får.",
          guidance: "2-4 punkter på hver højst en linje. Ingen punktummer til sidst.",
          required: true,
        },
        { name: "cta", what: "Knappen nederst på kortet.", required: true },
      ],
      tips: [
        "Ét kort må gerne have en primary-knap. Resten bør være secondary, så der er én tydelig vej videre.",
      ],
    },
    {
      id: "stories",
      label: "Kundehistorier",
      description: "Referencer fra rigtige kunder. Må stå tom.",
      placement: "Under anvendelserne. Sektionen skjules helt, når listen er tom.",
      purpose:
        "Vise at andre offentlige organisationer allerede bruger det. Én rigtig historie er mere værd end tre opfundne.",
      count: { min: 0, max: 6, unit: "historier" },
      fields: [
        {
          name: "company",
          what: "Organisationens rigtige navn.",
          guidance: "Fx “Herning Kommune”. Brug kun navne, vi har fået lov til at nævne.",
          required: true,
        },
        {
          name: "impact",
          what: "Resultatet, i én linje.",
          guidance: "Vær konkret: “Fire sprog på samme borgerinformation” slår “Stor succes”.",
          required: true,
        },
        {
          name: "quote",
          what: "Citat fra personen.",
          guidance: "1-3 sætninger med personens egne ord. Skriv ikke citatet på deres vegne.",
          required: true,
        },
        { name: "person", what: "Personens navn.", required: true },
        { name: "role", what: "Personens titel.", guidance: "Fx “Kommunikationschef”.", required: true },
      ],
      tips: [
        "Lad listen stå tom, indtil I har en rigtig kunde, der har sagt ja. Sektionen forsvinder af sig selv.",
        "Opdigtede citater må ikke stå her. Offentlige indkøbere tjekker referencer, og en falsk reference koster hele salget.",
        "Få citatet skriftligt godkendt, inklusive navn og titel, før I lægger det ind.",
      ],
    },
    {
      id: "trustedBy",
      label: "Bruges af",
      description: "Liste med navne på organisationer. Må stå tom.",
      placement: "Under kundehistorierne. Skjules når listen er tom.",
      purpose: "Vise bredden hurtigt, uden en hel historie pr. kunde.",
      count: { min: 0, max: 12, unit: "navne" },
      fields: [
        {
          name: "(liste af tekster)",
          what: "Ét navn pr. element, højst 40 tegn.",
          guidance: "Kun organisationer, der har givet lov til at blive nævnt.",
          required: false,
        },
      ],
      tips: ["Samme regel som kundehistorier: kun rigtige navne, kun med tilladelse."],
    },
    {
      id: "salesCta",
      label: "Afslutning",
      description: "Den sidste opfordring nederst på siden.",
      placement: "Nederst på forsiden.",
      purpose:
        "Fange den, der har læst hele siden og er klar. Gør næste skridt så lille som muligt, og fjern den sidste bekymring.",
      fields: [
        { name: "kicker", what: "Lille linje over overskriften.", required: true },
        {
          name: "title",
          what: "Overskriften på blokken.",
          guidance: "Skriv den som en opfordring, fx “Prøv det med jeres egen video”.",
          required: true,
        },
        {
          name: "body",
          what: "Kort afsnit, der gør det trygt at gå i gang.",
          guidance:
            "Nævn hvad det koster i tid og penge. “Kræver ikke betalingskort” fjerner en reel bekymring.",
          required: true,
        },
        {
          name: "bullets",
          what: "Punkter der lukker de sidste indvendinger.",
          guidance: "2-4 punkter. Tag de spørgsmål, salg oftest får.",
          required: false,
        },
        { name: "primaryCta", what: "Den vigtigste knap.", required: true },
        { name: "secondaryCta", what: "Sekundær knap. Kan udelades med null.", required: false },
      ],
    },
  ],
  pricing: [
    {
      id: "hero",
      label: "Hero",
      description: "Intro til planvalget.",
      placement: "Øverst på prissiden, over plankortene.",
      purpose:
        "Forklar hvad prisen følger, inden tallene vises. Her betaler man for mængden af video, ikke for antal brugere.",
      fields: HERO_FIELDS,
      tips: ["Selve priserne hentes automatisk fra Stripe. Skriv dem ikke ind her."],
    },
    {
      id: "chooserPoints",
      label: "Sådan vælger I",
      description: "Punkter der hjælper med at vælge den rigtige plan.",
      placement: "Ved siden af hero-teksten.",
      purpose: "Gøre valget mellem planerne let, uden at man skal sammenligne tabeller.",
      count: { min: 2, max: 6, unit: "punkter" },
      fields: [
        {
          name: "(liste af tekster)",
          what: "Ét punkt pr. plan.",
          guidance: "Skriv efter mønsteret “Vælg X når ...”, så det er situationen der afgør valget.",
          required: true,
        },
      ],
    },
    {
      id: "decisionSignals",
      label: "Signaler",
      description: "Korte chips om køb og betaling.",
      placement: "Under hero-blokken.",
      purpose: "Svare på hvordan man betaler, inden man klikker. Særlig vigtigt for offentlige kunder.",
      count: { min: 3, max: 6, unit: "signaler" },
      fields: [
        { name: "label", what: "Overskriften på chippen.", required: true },
        { name: "value", what: "Selve fakta.", required: true },
      ],
    },
    {
      id: "advisoryCta",
      label: "Afslutning",
      description: "Blokken nederst, der leder videre til FAQ eller salg.",
      placement: "Nederst på prissiden.",
      purpose: "Fange den, der ikke kunne vælge, og give en vej til et menneske.",
      fields: [
        { name: "kicker", what: "Lille linje over overskriften.", required: true },
        { name: "title", what: "Overskrift.", required: true },
        { name: "body", what: "Kort afsnit.", required: true },
        { name: "primaryCta", what: "Den vigtigste knap.", required: true },
        { name: "secondaryCta", what: "Sekundær knap. Kan udelades med null.", required: false },
      ],
    },
  ],
  faq: [
    {
      id: "hero",
      label: "Hero",
      description: "Intro til FAQ-siden.",
      placement: "Øverst på FAQ-siden.",
      purpose: "Sætte forventningen til hvad man kan finde svar på her.",
      fields: HERO_FIELDS,
    },
    {
      id: "guidancePoints",
      label: "Vejvisning",
      description: "Punkter om hvornår man skal bruge FAQ, priser eller kontakt.",
      placement: "Under introen.",
      purpose: "Sende folk det rigtige sted hen, så de ikke læser hele FAQ'en forgæves.",
      count: { min: 2, max: 6, unit: "punkter" },
      fields: [{ name: "(liste af tekster)", what: "Ét kort råd pr. punkt.", required: true }],
    },
    {
      id: "groups",
      label: "Spørgsmål",
      description: "Grupper af spørgsmål og svar.",
      placement: "Midt på FAQ-siden.",
      purpose:
        "Besvare det, der reelt holder folk tilbage. Skriv spørgsmålene, som kunderne faktisk stiller dem.",
      count: { min: 1, max: 8, unit: "grupper" },
      fields: [
        { name: "title", what: "Gruppens overskrift.", guidance: "Fx “Kom godt i gang”.", required: true },
        { name: "intro", what: "Kort linje om hvad gruppen dækker.", required: true },
        {
          name: "items",
          what: "Selve spørgsmålene med question og answer.",
          guidance: "Skriv svaret først og kort. Uddyb bagefter, hvis det er nødvendigt.",
          required: true,
        },
      ],
      tips: [
        "Tag spørgsmålene fra rigtige mails og møder, ikke fra hvad vi gerne vil fortælle.",
        "Hvis salg bliver stillet samme spørgsmål tre gange, hører det hjemme her.",
      ],
    },
    {
      id: "closingCta",
      label: "Afslutning",
      description: "Blokken nederst, der leder videre til kontakt.",
      placement: "Nederst på FAQ-siden.",
      purpose: "Give en vej videre til dem, der ikke fandt svaret.",
      fields: [
        { name: "kicker", what: "Lille linje over overskriften.", required: true },
        { name: "title", what: "Overskrift.", required: true },
        { name: "body", what: "Kort afsnit.", required: true },
        { name: "primaryCta", what: "Den vigtigste knap.", required: true },
        { name: "secondaryCta", what: "Sekundær knap. Kan udelades med null.", required: false },
      ],
    },
  ],
  contact: [
    {
      id: "hero",
      label: "Hero",
      description: "Intro på kontaktsiden.",
      placement: "Øverst på kontaktsiden.",
      purpose: "Gøre det tydeligt, hvad man kan få hjælp til, og hvor hurtigt man hører fra os.",
      fields: HERO_FIELDS,
    },
    {
      id: "contactCards",
      label: "Kontaktkort",
      description: "Kort med email, svartid og næste skridt.",
      placement: "Ved siden af kontaktformularen.",
      purpose: "Give den information, folk leder efter, inden de skriver: hvem svarer, og hvornår.",
      count: { min: 1, max: 6, unit: "kort" },
      fields: [
        { name: "title", what: "Kortets overskrift.", required: true },
        { name: "body", what: "Selve informationen.", guidance: "Vær konkret om svartid.", required: true },
      ],
    },
    {
      id: "supportPoints",
      label: "Vi hjælper med",
      description: "Punkter om hvad vi typisk hjælper med.",
      placement: "Under kontaktkortene.",
      purpose: "Vise at spørgsmålet ikke er dumt, så flere tør skrive.",
      count: { min: 2, max: 6, unit: "punkter" },
      fields: [{ name: "(liste af tekster)", what: "Én type henvendelse pr. punkt.", required: true }],
    },
    {
      id: "primaryActions",
      label: "Knapper",
      description: "Knapper der leder videre til priser eller login.",
      placement: "Nederst på kontaktsiden.",
      purpose: "Fange dem, der egentlig bare skulle et andet sted hen.",
      count: { min: 1, max: 4, unit: "knapper" },
      fields: CTA_FIELDS,
    },
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
    // Min 0: kundehistorier og referencer skal kunne være tomme, indtil der findes
    // rigtige at vise. Opdigtede referencer må ikke være en forudsætning for at validere.
    stories: requireStoryCards(root, "stories", errors, { min: 0, max: 6 }),
    trustedBy: requireStringList(root, "trustedBy", errors, { min: 0, max: 12, itemLabel: "brandnavn", maxLength: 40 }),
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
