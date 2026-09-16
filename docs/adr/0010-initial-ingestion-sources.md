# 0010. Initial ingestion sources: Polhus, Bauhaus

Status: Accepted

## Context

Phase 2 needs 1–2 real Swedish sources to prove the ingestion pipeline works
end to end (source brief: "prove I can point the system at a retailer and
automatically produce useful sauna records"). Candidates were evaluated live
(fetching robots.txt, category pages, and product-page HTML) rather than
assumed, per the source brief's instruction to prefer structured data over
guesswork and to respect robots.txt/ToS.

## Decision

Build adapters in this order:

1. **Polhus.se** (primary/first adapter). Swedish manufacturer of
   bastustugor/bastutunnor/badtunnor. Product pages expose clean JSON-LD
   `Product`+`Offer` (price, sku, mpn, brand, availability). robots.txt is
   fully permissive. Category pages (`/bastu`, `/bastustuga`,
   `/bastutunnor`) list products cleanly, and the catalog is 100% on-topic
   (no classification layer needed for this source).
2. **Bauhaus.se** (second adapter). Large DIY retailer selling sauna
   heaters/doors/panels (Harvia-branded among others) using schema.org
   **microdata** (not JSON-LD) with `sku`, `gtin`, `price`, `availability`,
   `brand`. robots.txt only blocks raw Magento catalog-view URLs, not the
   friendly product URLs real links use. Because Bauhaus sells far more than
   saunas, this source exercises the classification layer (sauna vs.
   accessory) and provides GTINs useful for cross-source dedup matching.

## Alternatives considered and rejected (with reasons, so they aren't
re-investigated without cause)

- **Narvi.fi** — good specs/category structure, Swedish-language subsite,
  but no direct-to-consumer pricing (dealer distribution model; their
  webshop is Cloudflare-protected). Usable later as an **enrichment-only**
  source (specs/images) once the pipeline supports sources that don't
  provide offers, not as a first adapter.
- **Jula.se** — could not verify real sauna product URLs; the site is a
  heavy client-rendered SPA and guessed URLs 404. Would require either
  headless-browser rendering or crawling their sitemap index to find real
  product URLs. Deprioritized until that investment is justified.
- **Trademax.se** — sells spa/hot tub products, not sauna cabins/barrels;
  off-topic for this catalog.
- **Harvia.com** — brochure/dealer-locator site, no online prices, **and**
  its robots.txt explicitly disallows a long list of AI/scraping bots.
  Avoid entirely per the source brief's instruction to respect robots.txt
  and not build an aggressive/unwelcome crawler.
- **Tylo/TylöHelo** — B2B/dealer model, no transactional pages to ingest.

## Consequences

- The JSON-LD extractor is built and proven against Polhus first; the
  microdata extractor against Bauhaus second. Both extractors live in
  `server/ingestion/extractors/` as source-agnostic utilities (ADR 0008),
  so a future JSON-LD source doesn't need new extraction code.
- Classification rules (ADR 0008) are only strictly necessary starting with
  the Bauhaus adapter — don't over-build this before it's needed for
  Polhus alone.
- Re-evaluate Jula/Trademax/Narvi as real candidates only after Polhus +
  Bauhaus are proven and there's appetite to invest in headless
  rendering or enrichment-only source support.
