# Default Layout Audit
## Document Version
- Created: 2026-04-08
- Scope: marketing pages, auth pages, setup/default flows

## Reviewed surfaces
- `app/page.tsx`
- `app/pricing/page.tsx`
- `app/faq/page.tsx`
- `app/contact/page.tsx`
- `app/login/page.tsx`
- `app/register/page.tsx`
- `app/setup/workspace/page.tsx`
- `components/public/PricingPlans.tsx`
- `components/public/ContactForm.tsx`
- `components/public/WorkspaceSetupCard.tsx`
- `app/globals.css`

## Summary
- The product already has a credible baseline for cards, buttons and type through `np-card`, `np-btn-primary`, `np-btn-ghost` and `np-kicker`.
- The main issue is not missing styling primitives. The issue is that marketing, auth and setup flows do not use the same shell, spacing rhythm or CTA hierarchy consistently.
- The landing page currently feels most intentional. Pricing, FAQ, Contact, Login, Register and Setup feel like adjacent screens rather than one shared public/default system.

## Highest-priority gaps
### 1. Shared shell and page rhythm are inconsistent
- Landing uses `np-card` sections, layered hero media and clearer vertical rhythm.
- Pricing, FAQ and Contact use simpler single-panel shells with different header behavior and looser relationship to the landing page.
- Login, Register and Setup use standalone centered cards that feel product-safe but visually detached from the public marketing flow.
- Priority: high
- Why it matters: the product loses continuity exactly at the point where a visitor moves from marketing intent to account creation and onboarding.

### 2. CTA hierarchy is not standardized
- Landing uses a strong primary CTA plus a ghost CTA and tertiary links.
- Pricing cards define CTA styles inline instead of using the shared button primitives.
- Contact and auth pages use locally styled buttons with slightly different radius, shadow and emphasis rules.
- Priority: high
- Why it matters: repeated small CTA differences make the product feel assembled page by page instead of designed as one system.

### 3. Public headers and navigation patterns vary too much
- Landing has a lightweight top bar with account-aware actions.
- FAQ and Contact duplicate a different page header pattern.
- Pricing has no matching top navigation shell and drops straight into the content block.
- Priority: medium-high
- Why it matters: public pages do not build a strong family resemblance, and return paths between pages are less obvious than they should be.

### 4. Card language is close, but not systematized
- Some pages use `np-card`, others use raw `bg-white rounded-[2rem] border border-gray-100 shadow-sm` or `rounded-[2.5rem]`.
- Form shells, marketing panels and info tiles are visually related but not tokenized through a small set of approved variants.
- Priority: medium-high
- Why it matters: the visual system is already partially there, but duplicate one-off card styling will keep drifting without a tighter default layer.

### 5. Typography hierarchy is strong on landing, flatter elsewhere
- Landing has a clear kicker -> headline -> support copy structure.
- Pricing, FAQ and Contact use strong headings but weaker subhead patterns.
- Login, Register and Setup rely heavily on uppercase labels and headings, but lack the same narrative pacing as marketing pages.
- Priority: medium
- Why it matters: the brand voice feels sharper on the landing page than in conversion and onboarding flows.

### 6. Some copy/text rendering still looks noisy
- Several reviewed files contain mojibake-like text in source output, especially around Danish characters.
- Even when runtime rendering is acceptable, this creates maintenance friction and raises the risk of visual trust issues on public-facing pages.
- Priority: medium
- Why it matters: these pages are first-impression surfaces, and text quality is part of perceived polish.

## Recommended baseline for TASK-8.2
- Create one shared public/default page shell for marketing and non-themed pages.
- Standardize three reusable section types:
  - hero section
  - content section
  - compact form/system section
- Standardize CTA tiers:
  - primary action
  - secondary ghost action
  - quiet tertiary text link
- Standardize one card family:
  - large feature card
  - standard content card
  - compact form card
- Standardize one heading pattern:
  - kicker
  - uppercase headline
  - restrained support copy
- Keep the default public look token-driven:
  - public/default shell variables should live in one wrapper layer such as `np-default-theme`
  - pages should depend on shared section/card/button classes, not one-off color and shadow values
  - future marketing redesigns should mostly mean swapping tokens and a few section compositions, not rewriting page structure

## Suggested execution order
1. Build the shared public/default shell and CTA rules.
2. Migrate Pricing, FAQ and Contact to the shared shell.
3. Migrate Login, Register and Setup to the same default family.
4. Do a final copy/encoding sweep on all public/default pages.

## Done criteria for TASK-8.1
- There is a documented, prioritized list of layout and visual-design gaps.
- The next implementation task can focus on a small shared baseline instead of page-by-page restyling.
