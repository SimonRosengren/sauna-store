# 0009. Canonical product / offer dedup + field-level provenance

Status: Accepted

## Context

The same physical sauna can be listed by multiple retailers (source brief
section 8), and every imported field must be traceable to where it came from
(section 6) so the site can distinguish official product data from our own
estimates/calculations.

## Decision

**Two-collection model:**

- `saunas` — canonical product record (one per physical product), holding
  normalized specs and, where practical, field-level provenance:
  ```ts
  price: { value: number, source: string, sourceUrl: string, fetchedAt: Date }
  ```
- `offers` — one document per (sauna, retailer) pair: `saunaId`, retailer,
  url, currentPrice, regularPrice, currency, availability, `fetchedAt`.
  Price history lives in a separate `price_history` collection
  (saunaId/offerId, price, checkedAt) rather than an embedded array, so it
  can grow unbounded without bloating the canonical document.

**Dedup matching**, in priority order: GTIN/EAN or manufacturer SKU exact
match (when both sources expose it) → brand + normalized model name + close
dimension match → manual review queue if ambiguous (never silently merge on
weak signals, and never silently create a duplicate canonical product when
a strong signal is missing — ambiguous matches are logged for the admin
inspection view from Phase 7, not auto-resolved).

**Never overwrite blindly**: an ingestion run updates fields but always logs
the diff; a source returning zero products, or a large unexplained drop, is
treated as a *failed run* (flagged for review), never as "products were
deleted" (source brief section 10, and ADR 0004's suspicious-run handling).

## Alternatives considered

- **One flat "listing" collection, no canonical product concept** (i.e. each
  retailer listing is its own SEO page). Explicitly rejected — this is the
  exact anti-pattern the source brief warns against in section 8 (three
  near-identical SEO pages instead of one comparison page).
- **Fuzzy-match-only dedup (name similarity alone).** Rejected as the
  primary mechanism: too easy to wrongly merge or wrongly split similar-but-
  different models (e.g. a 2-person vs 4-person variant of the same product
  line). Fuzzy matching is a secondary signal, not sufficient alone.

## Consequences

- Every write to `saunas`/`offers` from ingestion must go through the
  dedup step — there is no direct "insert new sauna" path outside the
  pipeline.
- Ambiguous-match products need a lightweight "pending review" state
  visible in the admin ingestion views (Phase 7), not full manual entry —
  the human is resolving matches, not typing product data.
- UI must always be able to render "Pris senast kontrollerat: <date>" from
  `offers.fetchedAt` and must never present a scraped/estimated value as if
  it were verified today.
