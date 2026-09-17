# Ingestion

Read `docs/adr/0008-source-adapter-architecture.md`,
`0009-dedup-and-provenance-model.md`, and `0010-initial-ingestion-sources.md`
first for the reasoning. This doc is the practical "how to add/modify a
source" reference.

## The adapter contract

```ts
// server/sources/types.ts
interface DiscoveredProduct {
  url: string
  sourceId: string
}

interface RawProduct {
  url: string
  sourceId: string
  html?: string           // if HTML extraction was needed
  jsonLd?: unknown[]        // parsed <script type="application/ld+json"> blocks
  microdata?: unknown       // parsed schema.org microdata
  fetchedAt: Date
}

interface NormalizedProduct {
  // shape matches the ingestion-facing subset of `saunas` + one `offers` entry
  // see docs/ai/data-model.md
}

interface ProductSourceAdapter {
  id: string
  discoverProducts(cursor?: unknown): Promise<{ items: DiscoveredProduct[], nextCursor: unknown | null }>
  fetchProduct(url: string): Promise<RawProduct>
  normalize(raw: RawProduct): NormalizedProduct
}
```

`discoverProducts` takes/returns a cursor so discovery itself can be
batched across cron runs for large catalogs (ADR 0004) — for small catalogs
(e.g. Polhus) it's fine for one call to return everything and `nextCursor`
to be `null`.

## Extraction priority (source brief section 4)

Try, in order, and use whichever succeeds first:

1. Official API/product feed
2. Affiliate/product feed
3. JSON-LD (`server/ingestion/extractors/jsonld.ts`)
4. Embedded structured JSON (site-specific, e.g. a Next.js `__NEXT_DATA__`
   blob) — write as a source-specific extractor if needed, don't generalize
   prematurely
5. schema.org microdata (`server/ingestion/extractors/microdata.ts`)
6. OpenGraph/metadata (`server/ingestion/extractors/opengraph.ts`)
7. Raw HTML/CSS-selector extraction — last resort, avoid if at all possible

Extractors are generic (source-agnostic) and live in
`server/ingestion/extractors/`. An adapter's `fetchProduct`/`normalize`
calls into these rather than reimplementing parsing.

## Pipeline stages (`server/ingestion/pipeline.ts`)

```
DISCOVERED → FETCHED → PARSED → NORMALIZED → VALIDATED → CLASSIFIED → DEDUPLICATED → PUBLISHED
```

- **VALIDATED**: Zod-parse the `NormalizedProduct`. Missing non-critical
  fields (e.g. floor area) are fine — publish with nulls. Missing critical
  fields (name, price, a working URL) fail validation; the item is logged
  in `ingestion_runs.errors` and skipped, not force-published with garbage.
- **CLASSIFIED**: deterministic rules first (name/category keyword
  matching — see source brief section 12 examples). Only reach for an LLM
  call later, for genuinely ambiguous cases, and never per-item by default
  (cost). Polhus doesn't need this (100% on-topic catalog); Bauhaus does.
- **DEDUPLICATED**: see ADR 0009. Strong-signal match (GTIN/SKU) merges
  into the existing `saunas` doc as an additional/updated `offers` entry.
  Weak/no match creates a new canonical `saunas` doc. Conflicting signals
  (e.g. same name, different dimensions) get `matchStatus: 'pending_review'`
  rather than a silent guess.
- **PUBLISHED**: upsert into `saunas`/`offers`, write a `price_history`
  entry if the price changed, update the `sources` doc's cursor/stats.

## Suspicious-run protection (source brief sections 10, 28)

Before publishing, compare this run's counts against
`sources.stats.productsFoundAvgTrailing`. If discovered/fetched count drops
sharply (e.g. below ~50% of trailing average) or hits zero where the source
normally has products, mark the run `flagged_suspicious` and **do not**
apply deletions/deactivations from this run — log it for admin review
instead. A source's products should only ever be marked inactive by a
*successful* run that legitimately no longer finds them, never by a run
that looks like it failed to load the source properly.

## Implementation notes (Polhus, first adapter built)

- **Discovery** (`server/sources/polhus/adapter.ts`) fetches exactly three
  category pages (`/bastu`, `/bastustuga`, `/bastutunnor`) and collects
  product URLs from `<a class="product_card">` inside
  `<ul class="category_products__list">`. This is deliberately scoped to
  those three pages — polhus.se also sells badtunnor (hot tubs),
  attefallshus, friggebodar, carports etc., and is explicitly **not**
  100% on-topic as a whole site (ADR 0010's "100% on-topic" claim refers
  to these three category listings specifically, verified live). Anchor-tag
  URL enumeration for discovery is a lighter-weight thing than field-level
  HTML scraping (which is avoided — see extraction priority above); product
  data itself always comes from JSON-LD.
- Polhus's JSON-LD `Product`+`Offer` gives name/sku/mpn/brand/price/
  availability/image reliably, but **not** GTIN, dimensions, capacity, or
  heating type (ved/el) — those exist only as marketing copy in the page
  body, not structured data. Rather than scrape fragile HTML text for them,
  the Polhus adapter leaves those fields `null`/`'okand'`. This is honest
  per the VALIDATED stage rule (nulls are fine), not a bug — don't "fix" it
  by adding brittle text scraping without a specific reason to.
- Sub-category (`bastutunna` vs `bastustuga`) is decided by a simple
  keyword check on the URL/name inside the Polhus adapter itself, not a
  shared classifier — see ADR 0008's "generalize once >1 source needs it."
- The pipeline (`server/ingestion/pipeline.ts`) chunks via
  `sources.cursor.pendingUrls`: if a run doesn't finish processing every
  discovered URL within `maxItems`, the rest are carried into next run's
  cursor instead of being re-discovered. Polhus's catalog (~40 products)
  fits in one run today, so this path is exercised but not load-bearing yet
  — it will matter once a source has a catalog too large for one
  invocation (ADR 0004).
- Vercel Cron always sends a **GET** request (not POST — this was wrong in
  an earlier draft of `docs/ai/architecture.md`), so
  `server/api/cron/ingest.get.ts` is a GET route. It also auto-attaches
  `Authorization: Bearer <CRON_SECRET>`.

## Open question: Bauhaus doesn't fit the `saunas` schema as-is

ADR 0010 picked Bauhaus as the second source based on it selling "sauna
heaters/doors/panels." Live verification while building the Polhus adapter
confirmed this more precisely: Bauhaus's entire `/varme-kyla/bastu/*`
section is **only** heaters, doors, panels, lighting, and accessories — it
does not sell complete sauna cabins/barrels at all. A standalone heater
doesn't fit the `saunas` collection shape (designed for a complete physical
unit with dimensions/capacity/heatingType) and, contrary to ADR 0010's
assumption, wouldn't actually cross-source-dedupe against a Polhus cabin
(a heater and the cabin it goes inside are different physical products).

This needs a decision before writing the Bauhaus adapter — options
discussed: (a) add a distinct "accessory/part" concept to the data model
instead of forcing heaters into `saunas`, (b) pick a different second
source that actually sells complete units, (c) deliberately scope Bauhaus
to enrichment-only use later (e.g. matching a heater brand/model mentioned
in a Polhus product to show "compatible accessories"), which is a Phase 3+
feature, not Phase 2's dedup model. Not yet resolved — see
`docs/ai/roadmap.md` "Open decisions."

## Adding a new source: checklist

1. Verify (don't assume) the source's robots.txt allows the paths you need,
   and that it has some form of structured data — see ADR 0010 for the
   research process used for Polhus/Bauhaus as a template.
2. Add `server/sources/<name>/adapter.ts` implementing `ProductSourceAdapter`.
3. Reuse existing extractors where possible; only add a new one if the
   source needs a genuinely new strategy (e.g. a new embedded-JSON shape).
4. Register the adapter in `server/sources/registry.ts`.
5. Add a `sources` document (id, name, baseUrl, enabled: false initially).
6. Run the pipeline against it manually/in a dev script before enabling the
   cron job — verify classification and dedup behave correctly against the
   existing catalog before flipping `enabled: true`.
7. Add or update an ADR if this source involved a non-obvious decision
   (e.g. a new extraction strategy, an enrichment-only source with no
   offers).
