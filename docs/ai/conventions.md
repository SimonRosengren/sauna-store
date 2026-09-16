# Conventions

## Folder layout

```
app/                     Nuxt 4 app dir
  assets/
  components/
    catalog/              product/category page components
    calculator/
    marketplace/
    ui/                   generic building blocks beyond what Nuxt UI provides
  composables/
  layouts/
  pages/                  file-based routing, see docs/ai/seo.md for the route list
content/
  guider/                 Markdown guides (Nuxt Content), see ADR 0007
server/
  api/                    Nitro API routes
    cron/                 secret-protected, invoked by Vercel Cron only
    admin/                admin-only routes (Phase 7 auth)
  tasks/                  Nitro tasks doing the actual batch work for cron routes
  sources/                one folder per source adapter, see docs/ai/ingestion.md
  ingestion/
    extractors/           generic jsonld/microdata/opengraph parsers
    pipeline.ts
    classify.ts
    dedupe.ts
    validate.ts
  db/
    client.ts             Mongo connection singleton (serverless-safe caching)
    models/                Zod schemas per collection
  email/                  Resend integration
shared/
  types/                  types/Zod schemas shared between app and server
docs/
  adr/                    why decisions were made
  ai/                     how the system works (this directory)
tests/                    Vitest tests (co-located tests under server/ are also fine
                          as *.test.ts once there's real logic to test)
```

## TypeScript / lint

- Strict TypeScript (`nuxt.config.ts` sets `typescript.strict: true`).
- ESLint via `@nuxt/eslint` flat config (`eslint.config.mjs`) — run
  `pnpm lint` / `pnpm lint:fix`. Don't hand-roll a separate Prettier config;
  `@nuxt/eslint`'s formatting rules are the source of truth.
- `pnpm typecheck` runs `nuxt typecheck` (vue-tsc) — this is separate from
  `nuxt dev`/`nuxt build`, which don't type-check by default. Run it before
  considering a change done.
- Zod schemas in `shared/types/` are the source of truth for domain types —
  derive TS types with `z.infer<>` rather than hand-writing parallel
  interfaces (ADR 0003).

## Naming

- Mongo collections: snake_case, plural (`ingestion_runs`, `price_history`).
- Adapter ids: lowercase, matches the folder name (`polhus`, `bauhaus`).
- Routes/slugs: Swedish, kebab-case (`/bastutunnor`, `/vedeldade-bastur`),
  matching the source brief's route list.

## Testing

- Vitest (`pnpm test` / `pnpm test:watch`), config in `vitest.config.ts`
  using `@nuxt/test-utils/config`.
- Priority order for test coverage as the codebase grows: ingestion pipeline
  logic (classification, dedupe, normalization, validation) first — this
  runs unattended and mistakes there directly corrupt the catalog — then
  the calculator's cost model (pure function, easy and valuable to test),
  then API route handlers, then UI components as needed.

## Environment variables

- Documented in `.env.example` — copy to `.env` for local dev, never commit
  `.env`.
- Consumed via Nuxt's `runtimeConfig` (`nuxt.config.ts`), not raw
  `process.env` scattered through the codebase, so server-only vs.
  public (`NUXT_PUBLIC_*`) is explicit and enforced.

## Git / commits

- `main` is the only long-lived branch for now (hobby project, solo
  operator) — feature branches optional, direct commits to `main` are fine
  once CI is green.
- Commit messages: short imperative summary line, matching whatever style
  emerges from the first real commits (this project has no history yet to
  match against as of Phase 0 — set a good example with the initial
  commits).
