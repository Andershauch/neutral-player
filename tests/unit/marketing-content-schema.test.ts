import { describe, expect, it } from "vitest";
import {
  MARKETING_CONTENT_SCHEMA_VERSION,
  MARKETING_EDITOR_SECTIONS,
  validateContactMarketingContent,
  validateFaqMarketingContent,
  validateHomeMarketingContent,
  validateMarketingPageContent,
} from "@/lib/marketing-content-schema";
import { getDefaultMarketingContent } from "@/lib/marketing-content-defaults";

const hero = {
  kicker: "Serviceoplevelser",
  badge: "Mest valgt",
  title: "Byg en tydelig SaaS-forside",
  body: "NeutralPlayer hjælper teams med at koble servicevalg, historier og salg tættere sammen.",
  primaryCta: {
    label: "Se planer",
    href: "/pricing",
    variant: "primary" as const,
  },
  secondaryCta: {
    label: "Kontakt salg",
    href: "/contact",
    variant: "ghost" as const,
  },
};

describe("marketing content schema", () => {
  it("accepts valid home marketing content", () => {
    const result = validateHomeMarketingContent({
      schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
      hero: {
        ...hero,
        media: {
          kind: "image",
          primaryAsset: {
            assetKey: "marketing/home-hero",
            alt: "Produktdemo i browser",
          },
        },
      },
      decisionSignals: [
        { label: "Til teams med fart på", value: "Fra forside til første embed samme dag" },
        { label: "Til sales-led flows", value: "Kontakt salg bliver en naturlig del af rejsen" },
        { label: "Til teams med mange historier", value: "Cases og CTA'er arbejder sammen" },
      ],
      serviceCards: [
        {
          title: "Customer support video",
          summary: "Til teams der vil samle embeds og sprogversioner i én serviceflade.",
          points: ["Ét projekt med flere varianter", "Hurtig onboarding"],
          cta: { label: "Se planer", href: "/pricing", variant: "primary" as const },
        },
        {
          title: "Onboarding og rollout",
          summary: "Til teams der vil have rådgivning før planvalg.",
          points: ["Domænestyring", "Redaktionelle roller"],
          cta: { label: "Tal med salg", href: "/contact", variant: "secondary" as const },
        },
      ],
      stories: [
        {
          company: "Northlane",
          impact: "47% hurtigere vej til publiceret embed",
          quote: "Vi samlede historier, servicevalg og onboarding i samme oplevelse.",
          person: "Signe Holm",
          role: "Head of Customer Programs",
        },
      ],
      trustedBy: ["Northlane", "Careline", "Atlas"],
      salesCta: {
        kicker: "Kontakt salg",
        title: "Fortæl hvilken serviceoplevelse du vil bygge",
        body: "Vi hjælper med at forme struktur, historier og rollout.",
        primaryCta: { label: "Kontakt salg", href: "/contact", variant: "primary" as const },
        secondaryCta: { label: "Se planer", href: "/pricing", variant: "ghost" as const },
        bullets: ["Flere serviceveje på samme forside", "Bedre kobling mellem cases og CTA"],
      },
    });

    expect(result.ok).toBe(true);
    expect(result.value?.hero.media?.primaryAsset.assetKey).toBe("marketing/home-hero");
  });

  it("accepts valid pricing, faq and contact payloads through the shared dispatcher", () => {
    const pricing = validateMarketingPageContent("pricing", {
      schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
      hero,
      chooserPoints: ["Vælg Starter hvis du vil hurtigt i gang.", "Vælg Enterprise hvis branding kræver sparring."],
      decisionSignals: [
        { label: "Selvbetjening", value: "Gå direkte til checkout." },
        { label: "Sales-led", value: "Book en intro hvis I vil forme setup sammen med os." },
      ],
      advisoryCta: {
        kicker: "Når du er i tvivl",
        title: "Brug pricing som beslutningshjælp",
        body: "Vi hjælper brugeren med både planvalg og hvornår det giver mening at tale med salg.",
        primaryCta: { label: "Kontakt salg", href: "/contact", variant: "primary" as const },
        secondaryCta: { label: "Læs FAQ", href: "/faq", variant: "ghost" as const },
      },
    });
    const faq = validateFaqMarketingContent({
      schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
      hero,
      guidancePoints: ["Brug pricing hvis du er tæt på et valg.", "Brug contact hvis du har brug for rådgivning."],
      groups: [
        {
          title: "Kom godt i gang",
          intro: "De vigtigste spørgsmål før første embed.",
          items: [
            { question: "Hvad gør NeutralPlayer?", answer: "Det gør det muligt at vise flere varianter via ét embed." },
          ],
        },
      ],
      closingCta: {
        kicker: "Har du stadig spørgsmål?",
        title: "Tal med os hvis dit setup kræver mere end standard-svar",
        body: "Vi hjælper med planvalg og setup.",
        primaryCta: { label: "Kontakt salg", href: "/contact", variant: "primary" as const },
        secondaryCta: { label: "Se planer", href: "/pricing", variant: "ghost" as const },
      },
    });
    const contact = validateContactMarketingContent({
      schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
      hero,
      contactCards: [
        {
          label: "Email",
          title: "hello@neutralplayer.dk",
          body: "Vi svarer normalt inden for 1 arbejdsdag.",
          meta: "Typisk næste skridt er intro eller planvalg.",
        },
      ],
      supportPoints: [
        "At vælge den rigtige servicevej mellem selvbetjening og salg.",
        "At forme forsider og CTA'er så historier og planvalg arbejder sammen.",
      ],
      primaryActions: [
        { label: "Vælg plan", href: "/pricing", variant: "primary" as const },
        { label: "Log ind", href: "/login", variant: "ghost" as const },
      ],
    });

    expect(pricing.ok).toBe(true);
    expect(pricing.value?.schemaVersion).toBe(MARKETING_CONTENT_SCHEMA_VERSION);
    expect(faq.ok).toBe(true);
    expect(contact.ok).toBe(true);
  });

  it("rejects unexpected fields and unsafe href values", () => {
    const result = validateHomeMarketingContent({
      schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
      hero: {
        ...hero,
        extraField: "nej tak",
        primaryCta: {
          label: "Klik",
          href: "javascript:alert(1)",
          variant: "primary",
        },
      },
      decisionSignals: [
        { label: "A", value: "B" },
        { label: "C", value: "D" },
        { label: "E", value: "F" },
      ],
      serviceCards: [
        {
          title: "Service",
          summary: "Summary",
          points: ["Punkt"],
          cta: { label: "Se", href: "/pricing", variant: "primary" },
        },
        {
          title: "Service 2",
          summary: "Summary 2",
          points: ["Punkt 2"],
          cta: { label: "Kontakt", href: "/contact", variant: "secondary" },
        },
      ],
      stories: [
        {
          company: "Atlas",
          impact: "Impact",
          quote: "Quote",
          person: "Maja",
          role: "VP",
        },
      ],
      trustedBy: ["Atlas"],
      salesCta: {
        kicker: "Kontakt",
        title: "Titel",
        body: "Body",
        primaryCta: { label: "Kontakt", href: "/contact", variant: "primary" },
      },
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("hero.extraField er ikke et tilladt felt.");
    expect(result.errors).toContain("hero.primaryCta.href skal starte med / eller https://.");
  });

  it("documents the editable sections per supported page", () => {
    expect(MARKETING_EDITOR_SECTIONS.home.map((section) => section.id)).toEqual([
      "hero",
      "decisionSignals",
      "serviceCards",
      "stories",
      "trustedBy",
      "salesCta",
    ]);
    expect(MARKETING_EDITOR_SECTIONS.contact.map((section) => section.id)).toEqual([
      "hero",
      "contactCards",
      "supportPoints",
      "primaryActions",
    ]);
  });

  it("accepts the shipped default marketing content for every supported page", () => {
    for (const pageKey of ["home", "pricing", "faq", "contact"] as const) {
      const result = validateMarketingPageContent(pageKey, getDefaultMarketingContent(pageKey));
      expect(result.ok).toBe(true);
    }
  });
});
