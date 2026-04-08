# Navigation Shell Strategy
## Document Version
- Created: 2026-04-08

## Goal
- Give the product a small number of stable navigation metaphors.
- Make shell changes feel intentional instead of abrupt.

## Shells
### 1. Public shell
- Used for:
  - landing
  - pricing
  - faq
  - contact
- Navigation model:
  - top header
  - lightweight global routes
  - clear conversion CTA

### 2. Guided system shell
- Used for:
  - login
  - register
  - verify-email
  - setup/workspace
  - invite
  - unauthorized
- Navigation model:
  - no heavy app navigation
  - guided page intro
  - clear next step
  - safe return path to public or dashboard context

### 3. Customer admin shell
- Used for:
  - dashboard
  - projects
  - team
  - profile
  - billing
  - audit
  - branding
  - embed editor
- Navigation model:
  - durable left navigation
  - consistent page headers
  - breadcrumb on deeper pages

### 4. Internal shell
- Used for:
  - internal home
  - internal marketing
  - later support/governance tools
- Navigation model:
  - durable internal navigation in the internal workspace
  - customer admin remains reachable as an exit path

## Page header contract
- Shared page headers should answer:
  - where am I
  - what is this page for
  - what is the next likely action
- Default structure:
  - optional breadcrumb
  - kicker
  - title
  - short support copy
  - context actions

## Breadcrumb rules
- Use breadcrumb on:
  - deep admin pages
  - project/embed editor pages
  - internal tool pages when the tool is one level below internal home
- Avoid breadcrumb on:
  - top-level public pages
  - top-level dashboard pages
  - simple auth pages

## CTA rules
- Every important page should expose one primary next step.
- Secondary actions should support orientation, not compete with the primary action.
- "Back" should point to the relevant parent area, not default to dashboard unless dashboard is truly the parent.
