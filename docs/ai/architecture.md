# Architecture

Read this for the big-picture system design. For specific areas, see the
sibling docs listed in `AGENTS.md`'s documentation map.

## The core pipeline

Everything in this product flows from one pipeline. If a proposed change
doesn't fit somewhere on this diagram, question whether it belongs.

```
External sources (retailers, manufacturers)
        │
        ▼
Source adapters (server/sources/<name>/)
        │  discoverProducts() → fetchProduct() → normalize()
        ▼
Ingestion pipeline (server/ingestion/pipeline.ts)
        │  validate → classify → dedupe → publish
        ▼
MongoDB (saunas, offers, price_history)
        │
        ├──────────────┬──────────────┐
        ▼              ▼              ▼
  Product/category  Cost calculator  Comparisons
  pages (SEO)        (/verktyg)       across retailers
        │              │
        └──────┬───────┘
               ▼
         Organic traffic
               │
        ┌──────┴───────┐
        ▼              ▼
     Products       Projects (/jobb)
        │              │
    Retailers      Contractors
```

The data ingestion system is the foundation. The catalog grows automatically
from it; SEO pages grow automatically from the catalog; the calculator reads
the catalog; the marketplace receives traffic from the catalog/calculator.
Manual work should only ever be needed for: writing guides (Nuxt Content),
resolving ambiguous product matches (admin review queue), and moderating
marketplace spam.

## Request-time architecture (Nuxt/Nitro)

- **Pages** (`app/pages/`) are rendered SSR for anything SEO-relevant
  (catalog, guides, homepage). They fetch data via Nitro API routes or
  direct server-side composables (`useAsyncData` calling `$fetch('/api/...')`).
- **API routes** (`server/api/`) are the only place that talks to MongoDB
  directly. Pages never import `server/db` code into client-executed code
  paths.
- **Cron-triggered routes** (`server/api/cron/*.get.ts` — Vercel Cron always
  sends a GET request, not POST) are protected by comparing the
  `Authorization: Bearer <token>` header Vercel auto-attaches against
  `CRON_SECRET`. They're invoked by Vercel Cron (`vercel.json`) and
  internally call **Nitro tasks** (`server/tasks/`, requires
  `nitro.experimental.tasks: true`) that do the actual batch work. See
  `docs/adr/0004-vercel-hosting-and-cron-strategy.md` for why this is
  chunked/resumable rather than one big job.

## Why this shape

- **No separate backend** (ADR 0001): one deploy, one process model.
- **MongoDB, not Postgres** (ADR 0002): document shape fits provenance and
  evolving per-source normalization; tradeoffs acknowledged in the ADR.
- **Cursor-based batch ingestion** (ADR 0004): required by serverless
  execution limits, and it's the correct default anyway — ingestion should
  never require an always-on process to function.
- **Adapters own source-specific quirks, the pipeline owns everything
  generic** (ADR 0008): adding a new source should never require touching
  the pipeline, the data model, or the SEO page templates.

## What "done" looks like for the whole system

The ideal end state (source brief, section 33/Phase 7): adding a new
retailer/source adapter causes new, useful product records/pages to appear
without any manual product creation, and the system can run for weeks
without database intervention — only admin review of genuinely ambiguous
cases (dedup conflicts, classification edge cases, marketplace spam).
