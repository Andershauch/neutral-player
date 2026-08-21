import {
  MARKETING_CONTENT_SCHEMA_VERSION,
  type ContactMarketingContent,
  type FaqMarketingContent,
  type HomeMarketingContent,
  type MarketingPageContent,
  type PricingMarketingContent,
} from "@/lib/marketing-content-schema";
import { type MarketingPageKey } from "@/lib/marketing-pages";

const HOME_DEFAULT: HomeMarketingContent = {
  schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
  hero: {
    kicker: "Video til kommuner, skoler og offentlige institutioner",
    badge: "Ét link. Alle sprog. Undertekster med i prisen.",
    title: "Én video. Alle jeres sprog. Samme link.",
    body: "Læg jeres video op én gang, tilføj de sprogversioner I har brug for, og indsæt ét enkelt link på hjemmesiden. Seeren vælger selv sprog, og underteksterne følger med — så I lever op til WCAG 2.1 AA uden ekstra arbejde.",
    primaryCta: {
      label: "Prøv gratis i 10 dage",
      href: "/register",
      variant: "primary",
    },
    secondaryCta: {
      label: "Se priser",
      href: "/pricing",
      variant: "ghost",
    },
    media: {
      kind: "video",
      primaryAsset: {
        assetKey: "marketing/home-hero-video",
        alt: "NeutralPlayer produktdemo med projekter, embeds og varianter",
      },
      posterAsset: {
        assetKey: "marketing/home-hero-poster",
        alt: "Poster for NeutralPlayer produktdemo",
      },
    },
  },
  decisionSignals: [
    { label: "Tilgængelighed", value: "Undertekster og tastaturnavigation, klar til WCAG 2.1 AA" },
    { label: "18 sprog", value: "Samme video, samme link — seeren vælger selv" },
    { label: "Offentligt indkøb", value: "EAN-faktura, databehandleraftale og data i EU" },
  ],
  serviceCards: [
    {
      title: "Borgerinformation",
      summary: "Når en video skal forstås af alle borgere, uanset hvilket sprog de taler derhjemme.",
      points: [
        "Samme information på alle sprog",
        "Undertekster som standard",
        "Ét link at vedligeholde",
      ],
      cta: { label: "Prøv gratis", href: "/register", variant: "primary" },
    },
    {
      title: "Skoler og uddannelse",
      summary: "Når undervisningsmateriale skal kunne bruges af elever og forældre med forskellig sproglig baggrund.",
      points: [
        "Del med klasser og forældre",
        "Ingen reklamer eller sporing af elever",
        "Fungerer på skolens eget site",
      ],
      cta: { label: "Se priser", href: "/pricing", variant: "secondary" },
    },
    {
      title: "Forvaltning og HR",
      summary: "Når introduktion, onboarding og intern information skal ud til hele organisationen.",
      points: [
        "Styr hvem der må redigere",
        "Adgangslog på ændringer",
        "Egen branding på afspilleren",
      ],
      cta: { label: "Tal med os", href: "/contact", variant: "secondary" },
    },
  ],
  // Tomme indtil der findes rigtige kunder at citere. Opdigtede referencer
  // hører ikke hjemme på en side, offentlige indkøbere træffer beslutninger ud fra.
  stories: [],
  trustedBy: [],
  salesCta: {
    kicker: "Kom i gang",
    title: "Prøv det med jeres egen video.",
    body: "Opret et workspace, læg en video op og se den spille på jeres eget site. Prøveperioden varer 10 dage og kræver ikke betalingskort.",
    primaryCta: { label: "Prøv gratis i 10 dage", href: "/register", variant: "primary" },
    secondaryCta: { label: "Book en gennemgang", href: "/contact", variant: "ghost" },
    bullets: [
      "Undertekster på 12 sprog, genereret automatisk",
      "EAN-faktura og databehandleraftale til offentlige kunder",
      "Ingen reklamer og ingen sporing af seerne",
    ],
  },
};

const PRICING_DEFAULT: PricingMarketingContent = {
  schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
  hero: {
    kicker: "Planer og servicevalg",
    badge: null,
    title: "Vælg den løsning der passer til jeres service og salg.",
    body: "Pricing-siden skal gøre det let at vælge mellem selvbetjening og rådgivning, uden at brugeren mister retning i flowet.",
    primaryCta: { label: "Kontakt salg", href: "/contact", variant: "primary" },
    secondaryCta: { label: "Læs FAQ", href: "/faq", variant: "ghost" },
  },
  chooserPoints: [
    "Vælg Starter hvis du vil hurtigt i gang uden salgsdialog.",
    "Vælg Pro hvis flere teams skal arbejde i samme flow.",
    "Vælg Enterprise hvis branding, governance eller rollout kræver sparring.",
  ],
  decisionSignals: [
    { label: "Selvbetjening", value: "Gå direkte fra planvalg til checkout." },
    { label: "Sales-led", value: "Book en intro hvis du vil forme setup og rollout sammen med os." },
    { label: "Klar til næste skridt", value: "Alle planer peger videre mod onboarding, support og publicering." },
  ],
  advisoryCta: {
    kicker: "Når du er i tvivl",
    title: "Brug pricing som beslutningshjælp, ikke bare som prisliste.",
    body: "Vores bedste marketing-sider hjælper brugeren med både at vælge plan og forstå hvornår det er bedre at tale med salg først.",
    primaryCta: { label: "Kontakt salg", href: "/contact", variant: "primary" },
    secondaryCta: { label: "Læs FAQ", href: "/faq", variant: "ghost" },
  },
};

const FAQ_DEFAULT: FaqMarketingContent = {
  schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
  hero: {
    kicker: "FAQ",
    badge: null,
    title: "Ofte stillede spørgsmål",
    body: "Her er de vigtigste svar om onboarding, embeds, team, abonnement og hvornår det giver mening at tale med os.",
    primaryCta: { label: "Kontakt salg", href: "/contact", variant: "primary" },
    secondaryCta: { label: "Se planer", href: "/pricing", variant: "ghost" },
  },
  guidancePoints: [
    "Brug pricing hvis du er tæt på et valg.",
    "Brug contact hvis du har brug for et mere rådgivende forløb.",
    "Brug FAQ hvis du vil afklare de typiske spørgsmål først.",
  ],
  groups: [
    {
      title: "Kom godt i gang",
      intro: "Det her er de spørgsmål de fleste stiller før de vælger plan eller går i gang med første embed.",
      items: [
        {
          question: "Hvad gør Neutral Player?",
          answer: "Neutral Player gør det muligt at vise videoer i forskellige sprogvarianter via ét samlet embed.",
        },
        {
          question: "Skal jeg lave ét embed per sprog?",
          answer: "Nej. Du vedligeholder flere varianter i samme projekt, og kunderne ser den rigtige version via samme embed.",
        },
        {
          question: "Hvordan fungerer betaling?",
          answer: "Betaling håndteres sikkert via Stripe, og du kan opgradere eller ændre abonnement i Billing.",
        },
      ],
    },
    {
      title: "Drift og samarbejde",
      intro: "Når først platformen er valgt, handler de næste spørgsmål typisk om team, domæner og support.",
      items: [
        {
          question: "Kan jeg invitere mit team?",
          answer: "Ja, du kan invitere medlemmer med forskellige roller som admin, editor og viewer.",
        },
        {
          question: "Kan jeg bruge mit eget domæne?",
          answer: "Ja. Du kan opsætte domæne og DNS, så løsningen passer til dit brand og setup.",
        },
        {
          question: "Hvad hvis jeg har brug for hjælp?",
          answer: "Du kan kontakte os via kontaktsiden, så hjælper vi dig hurtigt videre med både planvalg og setup.",
        },
      ],
    },
  ],
  closingCta: {
    kicker: "Har du stadig spørgsmål?",
    title: "Tal med os hvis dit setup kræver mere end standard-svar.",
    body: "Vi hjælper med både planvalg og setup, når standardsvar ikke er nok.",
    primaryCta: { label: "Kontakt salg", href: "/contact", variant: "primary" },
    secondaryCta: { label: "Se planer", href: "/pricing", variant: "ghost" },
  },
};

const CONTACT_DEFAULT: ContactMarketingContent = {
  schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
  hero: {
    kicker: "Kontakt salg",
    badge: null,
    title: "Lad os forme den rigtige serviceoplevelse sammen.",
    body: "Har du spørgsmål om onboarding, integration, planvalg eller hvordan jeres historier skal kobles til salg? Skriv til os, så hjælper vi jer videre.",
    primaryCta: { label: "Vælg plan", href: "/pricing", variant: "primary" },
    secondaryCta: { label: "Log ind", href: "/login", variant: "ghost" },
  },
  contactCards: [
    {
      label: "Email",
      title: "hello@neutralplayer.dk",
      body: "Vi svarer normalt inden for 1 arbejdsdag.",
      meta: "Typisk næste skridt er intro eller planvalg.",
    },
    {
      label: "Typisk næste skridt",
      title: "Book intro eller start med planvalg",
      body: "Vi kan hjælpe med setup, domæne og første projekt.",
      meta: "Især relevant ved større rollout eller sales-led flows.",
    },
    {
      label: "Velegnet når",
      title: "Du vil have sparring før I vælger løsning",
      body: "Tag fat i os hvis jeres forside, servicevalg eller rollout kræver mere end standardsvar.",
      meta: null,
    },
  ],
  supportPoints: [
    "At vælge den rigtige servicevej mellem selvbetjening og salg.",
    "At forme forsider og CTA'er så historier og planvalg arbejder sammen.",
    "At planlægge onboarding, domæner, embeds og første publicering.",
  ],
  primaryActions: [
    { label: "Vælg plan", href: "/pricing", variant: "primary" },
    { label: "Log ind", href: "/login", variant: "ghost" },
  ],
};

const DEFAULT_CONTENT: Record<MarketingPageKey, MarketingPageContent> = {
  home: HOME_DEFAULT,
  pricing: PRICING_DEFAULT,
  faq: FAQ_DEFAULT,
  contact: CONTACT_DEFAULT,
};

export function getDefaultMarketingContent(pageKey: MarketingPageKey): MarketingPageContent {
  return structuredClone(DEFAULT_CONTENT[pageKey]);
}
