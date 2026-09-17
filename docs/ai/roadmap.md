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

**Not yet done from Phase 1's original scope**: a manual Lighthouse SEO
pass against the live deployment. (`NUXT_PUBLIC_SITE_URL` is now set in
Vercel — confirmed via `/robots.txt?mockProductionEnv` pointing at the real
sitemap URL.)

**Phase 2 (Automated ingestion) — Polhus done end-to-end; Bauhaus blocked
on a decision (see below).**
- Shared Zod types (`shared/types/`), Mongo collection accessors + indexes
  (`server/db/collections.ts`), and the `ProductSourceAdapter` interface +
  registry (`server/sources/`) are all built and are source-agnostic —
  adding the next source shouldn't require touching any of this.
- JSON-LD and OpenGraph extractors (`server/ingestion/extractors/`).
- **Polhus adapter** (`server/sources/polhus/adapter.ts`) is real and
  proven: manually run twice against the live site via
  `GET /api/cron/ingest?sourceId=polhus` (dev + a full production build/
  preview). First run published 42 real `saunas`/`offers`/`price_history`
  documents to Atlas (37 bastustugor, 5 bastutunnor) with zero errors;
  second run proved idempotency (same 42/42/42 counts, no duplicates, no
  spurious price_history growth). `sources.polhus` is `enabled: true`.
- Full pipeline (`server/ingestion/pipeline.ts`): discover → fetch →
  normalize → validate → dedupe → publish, chunked via a
  `sources.cursor.pendingUrls` carry-over, suspicious-run detection (trailing
  average drop), `ingestion_runs` logging. Dedup/publish
  (`server/ingestion/publish.ts`) implements ADR 0009's full priority order
  (same-source fast path → GTIN → brand+normalized-name → new canonical
  product), though only the "new canonical product" and "same-source
  update" paths have been exercised for real so far (Polhus alone has
  nothing to cross-source-dedupe against yet).
- Cron wiring: `vercel.json` (daily, 03:00 UTC) → `server/api/cron/ingest.get.ts`
  (GET — Vercel Cron always sends GET, not POST; this corrects a wrong
  assumption in an earlier draft of `docs/ai/architecture.md`) → Nitro task
  `server/tasks/ingest.ts` → `runIngestion()`.
- Minimal read-only admin view (`/admin/ingestion`, noindexed,
  password-gated via `ADMIN_PASSWORD` — not full session auth, that's
  Phase 7) showing recent `ingestion_runs` and `sources` health stats.
- Unit tests for the pure logic (`normalizeName`, `validateNormalizedProduct`).
- **Not done**: the Bauhaus adapter. Live verification found Bauhaus's
  sauna section sells only heaters/doors/panels/accessories, never complete
  cabins/barrels — a schema/scope mismatch with ADR 0010's assumption that
  needs a decision before writing code. See "Open decisions" below and
  `docs/ai/ingestion.md` "Open question: Bauhaus doesn't fit the `saunas`
  schema as-is."
- **Not done**: source health *alerting* (dashboard exists in minimal read
  form; alerting on repeated failures is Phase 7 scope).

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

- **Bauhaus, Phase 2 (blocking the second adapter)**: Bauhaus only sells
  sauna heaters/doors/panels/accessories, not complete cabins/barrels — it
  doesn't fit the `saunas` schema (see `docs/ai/ingestion.md`). Options:
  (a) extend the data model with a distinct accessory/part concept,
  (b) replace Bauhaus with a different second source that sells complete
  units (re-evaluate Narvi/Jula/Trademax per ADR 0010's rejection reasons,
  or research new candidates), (c) defer Bauhaus to a later phase as an
  enrichment-only source (e.g. surfacing compatible heaters/accessories on
  a Polhus product page) rather than a Phase 2 dedup-model source. Needs a
  decision with the operator before more code gets written for it.
- Cloudflare Turnstile on marketplace forms — decide during Phase 6.
- Whether Vercel Hobby tier's daily-cron limit remains sufficient, or
  Vercel Pro is needed — revisit if Phase 2/7 shows ingestion needs more
  frequent runs.

## Action items for the operator (not code changes)

- Set `CRON_SECRET` in the Vercel project's env vars (a random string,
  16+ chars) so `vercel.json`'s daily cron job can authenticate against
  `server/api/cron/ingest.get.ts` in production — it's currently only set
  to a dev-only value in the local `.env`.
- Set `ADMIN_PASSWORD` in the Vercel project's env vars to something real
  if you want to use `/admin/ingestion` in production — it's currently
  only set to a dev-only placeholder locally.
