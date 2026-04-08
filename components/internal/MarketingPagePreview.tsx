"use client";

import {
  type ContactMarketingContent,
  type FaqMarketingContent,
  type HomeMarketingContent,
  type MarketingPageContent,
  type PricingMarketingContent,
} from "@/lib/marketing-content-schema";
import { type MarketingPageKey } from "@/lib/marketing-pages";

export default function MarketingPagePreview({
  pageKey,
  content,
}: {
  pageKey: MarketingPageKey;
  content: MarketingPageContent;
}) {
  if (pageKey === "home") {
    const page = content as HomeMarketingContent;
    return (
      <div className="space-y-4">
        <PreviewHero
          title={page.hero.title}
          body={page.hero.body}
          primary={page.hero.primaryCta.label}
          secondary={page.hero.secondaryCta?.label || null}
        />
        <PreviewSection title="Service cards">
          {page.serviceCards.map((card) => (
            <PreviewCard key={card.title} title={card.title} body={card.summary} meta={card.cta.label} />
          ))}
        </PreviewSection>
        <PreviewSection title="Stories">
          {page.stories.map((story) => (
            <PreviewCard key={story.company} title={story.company} body={story.impact} meta={story.person} />
          ))}
        </PreviewSection>
      </div>
    );
  }

  if (pageKey === "pricing") {
    const page = content as PricingMarketingContent;
    return (
      <div className="space-y-4">
        <PreviewHero
          title={page.hero.title}
          body={page.hero.body}
          primary={page.hero.primaryCta.label}
          secondary={page.hero.secondaryCta?.label || null}
        />
        <PreviewSection title="Chooser points">
          {page.chooserPoints.map((point) => (
            <PreviewCard key={point} title={point} />
          ))}
        </PreviewSection>
        <PreviewCard title={page.advisoryCta.title} body={page.advisoryCta.body} meta={page.advisoryCta.primaryCta.label} />
      </div>
    );
  }

  if (pageKey === "faq") {
    const page = content as FaqMarketingContent;
    return (
      <div className="space-y-4">
        <PreviewHero
          title={page.hero.title}
          body={page.hero.body}
          primary={page.hero.primaryCta.label}
          secondary={page.hero.secondaryCta?.label || null}
        />
        <PreviewSection title="FAQ groups">
          {page.groups.map((group) => (
            <PreviewCard key={group.title} title={group.title} body={group.intro} meta={`${group.items.length} spørgsmål`} />
          ))}
        </PreviewSection>
        <PreviewCard title={page.closingCta.title} body={page.closingCta.body} meta={page.closingCta.primaryCta.label} />
      </div>
    );
  }

  const page = content as ContactMarketingContent;
  return (
    <div className="space-y-4">
      <PreviewHero
        title={page.hero.title}
        body={page.hero.body}
        primary={page.hero.primaryCta.label}
        secondary={page.hero.secondaryCta?.label || null}
      />
      <PreviewSection title="Contact cards">
        {page.contactCards.map((card) => (
          <PreviewCard key={card.label} title={card.title} body={card.body} meta={card.label} />
        ))}
      </PreviewSection>
      <PreviewSection title="Primary actions">
        {page.primaryActions.map((action) => (
          <PreviewCard key={action.label} title={action.label} body={action.href} meta={action.variant} />
        ))}
      </PreviewSection>
    </div>
  );
}

function PreviewHero({
  title,
  body,
  primary,
  secondary,
}: {
  title: string;
  body: string;
  primary: string;
  secondary: string | null;
}) {
  return (
    <div className="rounded-[1.75rem] border border-gray-200 bg-gradient-to-br from-white via-white to-blue-50/60 px-5 py-5">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Hero</p>
      <h4 className="mt-3 text-2xl font-black uppercase tracking-tight text-gray-900">{title}</h4>
      <p className="mt-3 text-sm leading-6 text-gray-600">{body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="np-pill-badge">{primary}</span>
        {secondary ? <span className="np-pill-badge">{secondary}</span> : null}
      </div>
    </div>
  );
}

function PreviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function PreviewCard({
  title,
  body,
  meta,
}: {
  title: string;
  body?: string;
  meta?: string | null;
}) {
  return (
    <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50/80 px-4 py-4">
      <p className="text-sm font-black uppercase tracking-tight text-gray-900">{title}</p>
      {body ? <p className="mt-2 text-sm leading-6 text-gray-600">{body}</p> : null}
      {meta ? <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{meta}</p> : null}
    </div>
  );
}
