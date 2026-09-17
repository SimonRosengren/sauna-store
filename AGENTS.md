# Bastuguiden — Sauna SEO + Marketplace

A Swedish, sauna-only SEO/product experiment built on Nuxt 4. Goal: maximize
organic traffic with minimal ongoing manual work, by making the product
catalog grow through **automated ingestion** from retailers/manufacturers
rather than manual data entry. See `docs/ai/roadmap.md` for the full product
brief and phase plan if you need the complete picture.

## Commands

```bash
nvm use              # this repo pins Node via .nvmrc (currently 24)
pnpm install
pnpm dev              # http://localhost:3000
pnpm build
pnpm lint             # eslint . (flat config via @nuxt/eslint)
pnpm lint:fix
pnpm typecheck        # nuxt typecheck (vue-tsc)
pnpm test             # vitest run
pnpm test:watch
pnpm seed:sources     # idempotent: seed the `sources` collection for new adapters
```

Always run `pnpm lint`, `pnpm typecheck`, and `pnpm test` before considering a
change done — CI (`.github/workflows/ci.yml`) runs all three on every push/PR.

## Architecture in one paragraph

Nuxt 4 owns the entire application — no separate backend. Nitro server
routes (`server/api/`) handle everything server-side: the public API,
scheduled ingestion jobs (triggered by Vercel Cron hitting a secret-protected
endpoint), and SSR page data. MongoDB Atlas is the only datastore. The core
domain idea: external retailer/manufacturer sources are periodically
discovered and fetched by **source adapters**, normalized into a canonical
`Sauna` + `Offer` model with field-level provenance, deduplicated across
retailers, and published to Mongo — from which SEO pages, the cost
calculator, and the marketplace are all derived. See `docs/ai/architecture.md`
for the full pipeline diagram.

## Folder map

```
app/                  Nuxt 4 app dir (pages, components, layouts, composables)
content/              Nuxt Content markdown for /guider (hand-written, not ingested)
server/
  api/                Nitro API routes (public + /api/cron/* + /api/admin/*)
  sources/            One folder per source adapter (e.g. sources/polhus/)
  ingestion/          Shared pipeline: classify, dedupe, validate, extractors
  db/                 Mongo connection singleton + typed collection accessors
  email/              Resend integration
shared/               Types/Zod schemas shared between app and server
docs/
  adr/                Architecture Decision Records — WHY decisions were made
  ai/                 Deeper reference docs — read the relevant one for your task
tests/                Vitest tests
```

## Documentation map — read on demand, not all at once

Don't preload all of these. Read the one relevant to what you're working on:

- Working on ingestion (adapters, extractors, dedup, classification, cron)?
  Read `docs/ai/ingestion.md` and `docs/adr/0008-source-adapter-architecture.md`,
  `docs/adr/0009-dedup-and-provenance-model.md`, `docs/adr/0010-initial-ingestion-sources.md`.
- Working on the database/schema (Mongo collections, provenance shape)?
  Read `docs/ai/data-model.md` and `docs/adr/0002-mongodb-over-postgres.md`,
  `docs/adr/0003-native-driver-plus-zod-over-odm.md`.
- Working on pages/routing/metadata/structured data?
  Read `docs/ai/seo.md`.
- Working on the marketplace (`/jobb`)?
  Read `docs/ai/marketplace.md`.
- Working on hosting/cron/deployment?
  Read `docs/adr/0004-vercel-hosting-and-cron-strategy.md`.
- Unsure about folder layout, naming, or lint/TS conventions?
  Read `docs/ai/conventions.md`.
- Want the full product brief, phase plan, and current status?
  Read `docs/ai/roadmap.md`.
- Want to know why any non-obvious decision was made?
  Check `docs/adr/README.md` for the full ADR index.

## Core principles (don't violate these without raising it explicitly)

1. **No manual product data entry.** Products come from source adapters, not
   an admin "add product" form. If you're about to build a form for entering
   sauna products, stop — that contradicts the whole point of this project.
2. **Every ingested field is traceable to a source** (`source`, `sourceUrl`,
   `fetchedAt` at minimum). Never let a scraped/estimated value look like it
   came from nowhere.
3. **Never silently overwrite or delete on suspicious ingestion results.** A
   source returning zero/way-fewer products than usual is a bug to flag, not
   a signal to empty the catalog.
4. **Don't generate thin/near-duplicate SEO pages.** Every indexable page
   needs genuinely distinct, useful content backed by real data.
5. **Keep the marketplace simple.** No accounts, chat, dashboards, or
   payments unless actual usage proves they're needed.
6. **Update the docs as you go.** If you make an architecturally significant
   decision, add an ADR. If you change how a system works, update the
   relevant `docs/ai/*.md`. This file and `docs/` are meant to stay accurate,
   not become stale — a future session (or subagent) should be able to read
   them instead of re-deriving context from git history or chat logs.
