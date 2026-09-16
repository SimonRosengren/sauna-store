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
