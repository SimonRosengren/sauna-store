# 0008. Source adapter architecture for ingestion

Status: Accepted

## Context

The entire product depends on growing the catalog without manual data entry
(source brief sections 3–5). Sources differ wildly in how they expose data
(JSON-LD, schema.org microdata, OpenGraph, raw HTML) and in structure
(category pages vs. no listing at all). The core system must not need to
change every time a new source is added.

## Decision

Define a generic adapter interface in `server/sources/types.ts`:

```ts
interface ProductSourceAdapter {
  id: string // e.g. 'polhus', 'bauhaus'
  discoverProducts(): Promise<DiscoveredProduct[]>
  fetchProduct(url: string): Promise<RawProduct>
  normalize(raw: RawProduct): NormalizedProduct
}
```

Each source lives in its own folder (`server/sources/polhus/`,
`server/sources/bauhaus/`) implementing this interface, registered in
`server/sources/registry.ts`. Extraction logic (JSON-LD parsing, microdata
parsing, OpenGraph fallback) is shared, generic, and lives in
`server/ingestion/extractors/` — adapters call into it rather than each
reimplementing parsing.

The shared pipeline (`server/ingestion/pipeline.ts`) orchestrates
discover → fetch → normalize → validate → classify → dedupe → publish for
*any* adapter, so the core system has zero source-specific branches.

Extraction is attempted in this priority order (source brief section 4):
official API/feed → affiliate/product feed → JSON-LD → embedded structured
JSON → OpenGraph/metadata → raw HTML as a last resort. Adapters declare
which strategy they use; see `docs/ai/ingestion.md` for the concrete
contract and how to add a new source.

## Alternatives considered

- **One big scraper script per source with ad hoc parsing.** Rejected:
  exactly what section 5 of the brief warns against — it would couple the
  core system to each source's quirks and make adding a new source require
  touching shared code.
- **Fully generic/heuristic scraper with no per-source code.** Rejected as
  a starting point: sources differ enough (structured data availability,
  discovery mechanism, classification needs) that a thin per-source adapter
  is more reliable than one "smart" universal scraper, at least until
  there's a large enough number of sources to justify the investment in a
  fully generic approach.

## Consequences

- Adding a new source is additive: a new folder + a registry entry. No
  changes to `saunas`/`offers` schemas, pipeline orchestration, or SEO
  pages should ever be required just to add a source.
- Respecting robots.txt/ToS/rate limits (section 4) is each adapter's
  responsibility at fetch time; the shared pipeline should still enforce a
  global rate limit as a safety net.
- Classification (sauna vs. accessory, ADR-adjacent, see
  `docs/ai/ingestion.md`) is shared logic, not per-adapter, so rules improve
  for all mixed-catalog sources at once.
