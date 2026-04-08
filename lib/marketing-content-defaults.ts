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
    kicker: "Serviceoplevelser til teams med mange video-flader",
    badge: "Vælg service. Tal med salg. Del historier der virker.",
    title: "Byg en SaaS-oplevelse omkring video, service og gode historier.",
    body: "NeutralPlayer hjælper teams med at samle flersprogede embeds, tydelige servicevalg og salgsnære kundehistorier i en oplevelse, der føles som et rigtigt produkt fra forside til onboarding.",
    primaryCta: {
      label: "Se planer",
      href: "/pricing",
      variant: "primary",
    },
    secondaryCta: {
      label: "Kontakt salg",
      href: "/contact",
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
    { label: "Til teams med fart på", value: "Fra marketing-side til første embed på samme dag" },
    { label: "Til teams med salg i loopet", value: "Tydelige steder at kontakte os før valg af plan" },
    { label: "Til teams med mange historier", value: "Kundecases, servicespor og CTA'er der arbejder sammen" },
  ],
  serviceCards: [
    {
      title: "Customer support video",
      summary: "Til teams der vil samle embeds, sprogversioner og supportflow i en enkel serviceoplevelse.",
      points: ["Ét projekt med flere varianter", "Hurtig onboarding", "Klar til marketing og support"],
      cta: { label: "Se planer", href: "/pricing", variant: "primary" },
    },
    {
      title: "Onboarding og rollout",
      summary: "Til teams der vil rulle videooplevelser ud på tværs af markeder, sites og interne ejere.",
      points: ["Domænestyring", "Redaktionelle roller", "Mindre dobbeltarbejde"],
      cta: { label: "Tal med salg", href: "/contact", variant: "secondary" },
    },
    {
      title: "Enterprise service design",
      summary: "Til organisationer der vil have governance, branding og et setup der kan vokse med forretningen.",
      points: ["Branded player", "Audit og godkendelser", "Custom setup og support"],
      cta: { label: "Book en intro", href: "/contact", variant: "secondary" },
    },
  ],
  stories: [
    {
      company: "Northlane Mobility",
      impact: "47% hurtigere vej fra brief til publiceret embed",
      quote: "Vi gik fra at koordinere video per marked til at styre hele serviceoplevelsen i et samlet flow. Det gjorde både marketing og support hurtigere.",
      person: "Signe Holm",
      role: "Head of Customer Programs",
    },
    {
      company: "Careline Nordic",
      impact: "Tre servicespor samlet i et setup for salg, onboarding og help content",
      quote: "Det vigtigste for os var ikke bare playeren. Det var at kunderne kunne vælge den rigtige service og altid lande det rigtige sted bagefter.",
      person: "Jonas Becker",
      role: "Director of Revenue Enablement",
    },
    {
      company: "Atlas Industrial",
      impact: "Lancering i 8 markeder uden nye one-off embeds",
      quote: "Vi fik governance, historier og servicevalg til at spille sammen. Resultatet føltes mere som et produkt og mindre som en samling sider.",
      person: "Maja Lund",
      role: "VP Commercial Operations",
    },
  ],
  trustedBy: ["Northlane", "Careline", "Atlas", "BrightLearn", "FieldOps", "Urban Retail"],
  salesCta: {
    kicker: "Kontakt salg",
    title: "Fortæl hvilken serviceoplevelse du vil bygge.",
    body: "Hvis du vil have en forside der leder kunder mod den rigtige service, hjælper vi gerne med at forme både struktur, historier og rollout.",
    primaryCta: { label: "Kontakt salg", href: "/contact", variant: "primary" },
    secondaryCta: { label: "Se planer", href: "/pricing", variant: "ghost" },
    bullets: [
      "Flere serviceveje ind på samme forside",
      "Bedre kobling mellem kundehistorier og CTA",
      "Et default-look der er let at redesigne senere",
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
