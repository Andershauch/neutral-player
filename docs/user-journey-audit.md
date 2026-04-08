# User Journey Audit
## Document Version
- Created: 2026-04-08
- Scope: public, acquisition, onboarding, customer admin, internal admin

## Why this audit exists
- The product has several good local UI systems, but the total journey is not yet coherent.
- Navigation patterns change too often between public pages, auth pages, setup, customer admin and internal tools.
- Some pages feel like destinations, while others feel like isolated screens with weak return paths.

## Reviewed surfaces
- `app/page.tsx`
- `app/pricing/page.tsx`
- `app/contact/page.tsx`
- `app/faq/page.tsx`
- `components/public/HomeHeaderActions.tsx`
- `app/login/page.tsx`
- `app/register/page.tsx`
- `app/setup/workspace/page.tsx`
- `app/admin/layout.tsx`
- `components/admin/Sidebar.tsx`
- `app/admin/dashboard/page.tsx`
- `app/admin/projects/page.tsx`
- `app/admin/embed/[embedId]/page.tsx`
- `app/internal/layout.tsx`
- `app/internal/page.tsx`
- `app/internal/marketing/page.tsx`

## Core diagnosis
### 1. There is no single journey model
- Public pages have a top-header model.
- Customer admin uses a sidebar model.
- Internal uses a loose page model with no durable internal navigation shell.
- Setup and auth sit between public and admin, but behave like detached one-off screens.

### 2. The product changes navigation metaphor too abruptly
- Before login, the user sees light public navigation.
- After login, the user jumps into a heavier left-nav dashboard.
- Internal pages do not continue the same logic and instead rely on local links and "back to dashboard" actions.
- The result is that the product feels assembled from zones rather than guided by one coherent path.

### 3. "Next step" is not consistently visible
- Dashboard does some of this well via onboarding and create-project CTA.
- Pricing and contact guide plan selection, but the bridge from plan choice to signup/setup is still not explicit enough.
- Embed/editor pages are task-heavy, but often leave users with weak orientation and weak return paths.
- Internal pages support powerful actions, but the navigation does not clearly answer "where am I" and "what should I do next".

### 4. Information architecture is not fully aligned with user intent
- Public user intent is usually:
  - understand product
  - choose service
  - contact sales
  - start account
- Customer intent after login is usually:
  - see progress
  - create or manage projects
  - upload and publish
  - manage team, billing and profile
- Internal intent is usually:
  - support a customer
  - manage branding
  - manage marketing
- Today, those zones exist in code, but they are not yet expressed as one consistent product map.

## Desired target state
### Public journey
- Shared public header across Landing, Pricing, FAQ and Contact.
- Clear global routes:
  - Product
  - Pricing
  - FAQ
  - Contact
  - Log in / Dashboard
- Strong visible primary next step on each page:
  - choose plan
  - contact sales
  - create account

### Auth and setup journey
- Auth and setup should feel like a guided continuation of the public journey.
- Users should always understand:
  - what step they are on
  - why they are here
  - what happens next
  - how to go back safely
- Register -> verify/setup -> dashboard should feel like one path, not separate page families.

### Customer admin journey
- One durable admin shell for all authenticated customer surfaces.
- Clear primary nav:
  - Dashboard
  - Projects
  - Team
  - Billing
  - Settings/Profile
- Clear secondary context when inside a project/embed:
  - breadcrumb
  - back-to-projects
  - current object title
  - primary action for the current task

### Internal journey
- One durable internal shell for all `/internal` routes.
- Internal should not feel like a subpage hanging off customer admin.
- The shell should answer:
  - which internal area is active
  - which org is selected
  - whether you are editing branding, marketing or later support/governance tools

## Highest-priority problems to fix
### P1. No unified shell strategy
- Public, auth, setup, customer admin and internal all need explicit shell rules.

### P1. No standard page-header contract
- Many pages need the same page-intro model:
  - kicker
  - page title
  - short support copy
  - context actions
  - optional breadcrumb

### P1. Project/embed flow lacks clear orientation
- The editor flow is important enough to deserve stronger breadcrumbing and clearer return paths.

### P2. Internal area needs first-class navigation
- Internal tools are now powerful enough that they need their own navigation shell.

### P2. Purchase flow still needs stronger continuity
- Plan choice, signup, workspace setup and first project should read as one connected path.

## Recommended execution order
1. Define journey map and shell rules.
2. Build shared navigation primitives and page-header contract.
3. Unify public + auth + setup.
4. Unify customer admin shell and embed/editor context navigation.
5. Build internal shell.
6. Re-test full path from landing to published embed and from internal login to marketing publish.

## Done criteria
- A new user can move from landing page to first published embed without ever losing orientation.
- A returning customer can move across dashboard, projects, team, billing and settings without changing navigation metaphor.
- An internal admin can move across internal tools without relying on ad hoc back-links.
- Every important page has an obvious primary next step and a predictable return path.
