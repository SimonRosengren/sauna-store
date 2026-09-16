# 0005. Tailwind CSS + Nuxt UI for styling

Status: Accepted

## Context

This is a solo-operator hobby project. Design/component work needs to be
fast and consistent without becoming its own workstream, while still
producing a clean, fast, mobile-first, accessible UI (source brief section
31, technical SEO requirements).

## Decision

Use **Nuxt UI** (which ships with Tailwind CSS built in) as the component
library, styled with Tailwind utility classes for anything Nuxt UI doesn't
cover.

## Alternatives considered

- **Tailwind CSS only, fully custom components.** More design control, but
  meaningfully more time spent building/maintaining basic components
  (forms, dialogs, tables for admin) that Nuxt UI already provides
  accessibly out of the box.
- **A heavier design-system library (Vuetify, PrimeVue).** Rejected: less
  natural fit with Tailwind-based custom marketing/content pages (guides,
  product pages), and more opinionated visual defaults to override.

## Consequences

- Admin screens (Phase 7) and form-heavy flows (marketplace, calculator)
  can lean on Nuxt UI components directly.
- Marketing/SEO-critical pages (product, category, guides) can still use
  plain Tailwind markup for full control over semantic HTML structure,
  which matters for SEO.
- Keep an eye on bundle size as Nuxt UI components are added; tree-shaking
  should keep this manageable, but don't import broad UI kits into
  performance-critical, high-traffic pages without checking impact.
