# Roadmap & product brief

This is the living status tracker for the project. **Update the "Current
status" section whenever a phase's scope changes or completes** — this file
should always reflect reality, not the plan as originally conceived.

## Product goal

Swedish, sauna-only SEO/marketplace experiment. Primary goal: maximize
useful organic traffic with as little ongoing manual work as possible.
Secondary goals: a genuinely useful sauna discovery/planning tool,
programmatic SEO experimentation, a lightweight customer↔contractor
marketplace, and affiliate/lead revenue as a possible side effect. This is a
hobby product designed to be launched and then largely left alone — not a
startup that needs operational complexity.

The critical constraint that shapes everything: **no manual product data
entry.** The catalog grows via automated ingestion from external sources,
not an admin form. See `docs/ai/architecture.md` for the core pipeline this
implies.

## Current status

**Phase 0 — done.** Repo hygiene, `AGENTS.md`, ADRs, and `docs/ai/*` are in
place.

**Phase 1 (Foundation) — done.**
- Nuxt UI + Tailwind installed; base layout (`SiteHeader`/`SiteFooter`) and
  homepage with the three primary CTAs (source brief section 24) are live.
- Stub pages exist for every route in the nav (`/bastur`, category pages,
  `/guider`, `/verktyg`, `/verktyg/bastukalkylator`, `/jobb`, `/jobb/ny`) so
  nothing 404s — each is `noindex` via centralized `routeRules` in
  `nuxt.config.ts` (not per-page) until its real phase replaces it. Each
  stub has a `TODO(Phase N)` comment pointing at the phase that will build
  it for real.
- MongoDB Atlas connection singleton (`server/db/client.ts`, serverless-safe
  caching) verified working end to end against the real Atlas cluster via
  `GET /api/health`.
- SEO infra: `@nuxtjs/sitemap`, `@nuxtjs/robots`, `nuxt-schema-org`
  installed and verified — sitemap only includes indexable routes,
  robots.txt reflects route rules, JSON-LD (WebSite/WebPage/Organization
  graph) renders on pages. A `useCanonicalUrl()` composable (called once
  globally from `app.vue`) sets canonical `<link>` tags on every route.
- Umami analytics wired via `app/plugins/analytics.ts`, conditionally
  injected only when `NUXT_PUBLIC_UMAMI_WEBSITE_ID`/`_SCRIPT_URL` are set.
  Google Search Console verification meta tag wired the same way
  (`NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION`), left unset until Phase 4.
- Vercel project already connected to the `main` branch on GitHub by the
  operator; MongoDB Atlas env vars already configured there.

**Not yet done from Phase 1's original scope**: setting
`NUXT_PUBLIC_SITE_URL` to the real production domain in Vercel (still
needs to be set there — see "Open decisions" below), and a manual
Lighthouse SEO pass against the live deployment.

Update this section as each phase below starts/completes.

## Phases

### Phase 0 — Documentation & scaffolding
- Repo hygiene: strict TS, ESLint (`@nuxt/eslint`), Vitest, CI, `.env.example`.
- `AGENTS.md`, `docs/adr/*`, `docs/ai/*` (this set of docs).

### Phase 1 — Foundation
- Tailwind + Nuxt UI installed; base layout (header/footer/nav); homepage
  skeleton (three CTAs: hitta en bastu / räkna på kostnaden / lägg upp
  projekt — source brief section 24).
- MongoDB Atlas connection singleton (`server/db/client.ts`).
- SEO infra: `@nuxtjs/sitemap`, `@nuxtjs/robots`, `nuxt-schema-org`,
  canonical URL composable.
- Umami analytics + Search Console verification.
- Vercel project + env vars + preview deploys; empty `vercel.json` cron
  scaffold.
- **Done when**: branded empty site deployed on Vercel, real
  `sitemap.xml`/`robots.txt`, Lighthouse SEO ≈100.

### Phase 2 — Automated ingestion (critical phase)
- Shared Zod types for `Sauna`/`Offer`/provenance (`shared/types/`).
- Collections: `sources`, `ingestion_runs`, `saunas`, `offers`,
  `price_history`.
- `ProductSourceAdapter` interface + registry (`server/sources/`).
- Extractors: JSON-LD, microdata, OpenGraph (`server/ingestion/extractors/`).
- **Polhus adapter** first, end to end. **Bauhaus adapter** second
  (exercises classification since it's a mixed-category retailer).
- Dedup logic (GTIN/SKU → brand+name+dimensions fallback → pending review).
- Chunked/resumable pipeline wired to Vercel Cron via a secret-protected
  API route + Nitro task.
- Source health tracking + suspicious-run detection.
- Minimal read-only admin page to inspect ingestion runs.
- **Done when**: a real run populates genuine Sauna+Offer documents from
  both sources in Atlas, dedup and provenance are visible, run log exists.
- See `docs/ai/ingestion.md` and ADRs 0008–0010.

### Phase 3 — Catalog
- `/bastur/[slug]` product pages with provenance UI ("Pris senast
  kontrollerat: …", "Finns hos N återförsäljare").
- Category pages driven by Mongo aggregations, not hardcoded lists.
- Filtering/sorting, basic Mongo text search.
- `/go/[offerId]` outbound click redirect + logging.
- Auto-generated SEO metadata + Product/Offer/BreadcrumbList structured data.
- **Done when**: pages validate in Google Rich Results Test; category pages
  update automatically as ingestion adds/removes products.

### Phase 4 — SEO knowledge base
- Nuxt Content wired up for `/guider/[...slug]` (ADR 0007).
- Initial guide set per source brief section 15 topics (ongoing editorial
  work, not automatable).
- Internal-linking components (`RelatedGuides`, `RelatedProducts`,
  `CalculatorCta`).
- FAQ structured data where relevant; Search Console property + sitemap
  submission.
- **Done when**: no orphan pages, Search Console shows crawl activity.
- Ongoing after this phase: the Search Console feedback loop
  (`docs/ai/seo.md`) drives further guide content indefinitely.

### Phase 5 — Calculator
- `/verktyg/bastukalkylator`: cost model as a pure, unit-tested function;
  base rates in a small config collection (editable without redeploy).
- Integration with catalog (pick a real sauna → prefill) and marketplace
  (CTA seeds a new `/jobb/ny` draft).
- Event tracking for the calculator funnel.
- **Done when**: end-to-end itemized estimate with clear "uppskattning"
  labeling; CTA correctly hands off to project creation.

### Phase 6 — Marketplace
- Collections: `projects`, `contractor_interests`, `email_verifications`.
- `/jobb`, `/jobb/ny`, `/jobb/[id]` (noindex); email verification via
  Resend; rate limiting + deterministic spam filter; scheduled
  auto-expiration.
- Decision point: confirm whether to add Cloudflare Turnstile.
- **Done when**: full loop works — create → verify → list → contractor
  interest → notification email → auto-expire.
- See `docs/ai/marketplace.md`.

### Phase 7 — Admin & automation hardening
- Full admin (ingestion run history/errors, discovered-product review,
  price-change review, missing-data products, disable/hide product, project
  moderation, editorial notes).
- Source health dashboard with alerting on repeated failures/suspicious
  drops.
- Test-coverage pass on classification/dedup/normalization.
- Runbook: how to add a new source adapter, what to do when one breaks.
- **Done when**: the system runs unattended for 1–2 weeks with no manual DB
  intervention needed.

### Phase 8 — Explicitly deferred, not initial scope
More sources beyond Polhus/Bauhaus, affiliate monetization, better search
(Atlas Search/Algolia), contractor accounts, sponsored placements, GA4/
advanced analytics. Only build these if actual usage proves they're needed
— this is the source brief's own stated philosophy (sections 21, 29, 34) and
should not be second-guessed without real evidence from the live site.

## Decisions already made (see `docs/adr/` for full reasoning)

Hosting: Vercel. Database: MongoDB Atlas via native driver + Zod (not an
ODM). Styling: Tailwind + Nuxt UI. Email: Resend. Guides: Nuxt Content
(file-based, not DB-backed). Analytics: Umami + Google Search Console.
Admin auth: single-operator session auth, no multi-user system. Rate
limiting/spam: Mongo-backed counters + deterministic filters, no Redis.
Product images: fetched and cached into Vercel Blob, not hotlinked. First
ingestion sources: Polhus (primary), Bauhaus (secondary); Narvi
(enrichment-only, later); Jula/Trademax deprioritized; Harvia/Tylo excluded
(see ADR 0010 for why).

## Open decisions to revisit at the relevant phase

- Cloudflare Turnstile on marketplace forms — decide during Phase 6.
- Whether Vercel Hobby tier's daily-cron limit remains sufficient, or
  Vercel Pro is needed — revisit if Phase 2/7 shows ingestion needs more
  frequent runs.

## Action items for the operator (not code changes)

- Set `NUXT_PUBLIC_SITE_URL` in the Vercel project's env vars to the real
  production domain (currently only set locally to the `localhost`
  placeholder from `.env.example`) — needed for correct canonical URLs,
  sitemap entries, and robots.txt in production.
