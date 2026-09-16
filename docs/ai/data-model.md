# Data model (MongoDB)

See `docs/adr/0002-mongodb-over-postgres.md`, `0003-native-driver-plus-zod-over-odm.md`,
and `0009-dedup-and-provenance-model.md` for the reasoning behind these
choices. This doc describes the actual collection shapes — keep it in sync
with `shared/types/` and `server/db/models/` as the schema evolves. If you
change a schema, update this file in the same change.

## Provenance shape (used throughout)

Any field whose value came from an external source, rather than being
computed by us, should use this shape where practical:

```ts
interface Provenance<T> {
  value: T
  source: string       // adapter id, e.g. 'polhus', 'bauhaus'
  sourceUrl: string
  fetchedAt: Date
}
```

Not every field needs per-field provenance (that's a lot of nesting) — at
minimum, every `saunas` document needs a top-level `source`, `sourceUrl`,
`lastFetchedAt`, `lastVerifiedAt`. Field-level provenance is reserved for
values that meaningfully differ by source or change over time: `price`
(actually lives on `offers`, see below), `dimensions`, `capacity`.

## Collections

### `sources`

Adapter registry + health tracking (source brief section 28).

```ts
{
  _id: string              // adapter id, e.g. 'polhus'
  name: string              // display name
  baseUrl: string
  enabled: boolean
  cursor: unknown            // resumable batch position, shape is adapter-specific
  stats: {
    lastRunAt: Date | null
    lastSuccessAt: Date | null
    productsFoundLastRun: number
    productsFoundAvgTrailing: number  // rolling average, for suspicious-drop detection
    consecutiveFailures: number
  }
}
```

### `ingestion_runs`

One document per pipeline execution (source brief section 27/28).

```ts
{
  _id: ObjectId
  sourceId: string
  startedAt: Date
  finishedAt: Date | null
  status: 'running' | 'succeeded' | 'failed' | 'flagged_suspicious'
  counts: {
    discovered: number
    fetched: number
    normalized: number
    validated: number
    deduped: number
    published: number
    failed: number
  }
  errors: Array<{ url?: string, message: string, stage: string }>
}
```

### `saunas` (canonical product)

```ts
{
  _id: ObjectId
  slug: string
  name: string
  brand: string | null
  manufacturer: string | null
  category: 'bastutunna' | 'bastustuga' | 'el-bastu' | 'vedeldad-bastu' | 'ovrigt'
  saunaType: string | null
  heatingType: 'ved' | 'el' | 'okand'
  dimensions: {
    width: Provenance<number> | null
    length: Provenance<number> | null
    height: Provenance<number> | null
  }
  capacity: number | null
  floorArea: number | null
  material: string | null
  images: Array<{ url: string, sourceUrl: string, alt: string }>
  // Canonical identity signals used for dedup (ADR 0009):
  identity: {
    gtin: string | null
    sku: string | null
    manufacturerProductId: string | null
    normalizedName: string        // lowercased, punctuation-stripped, for fuzzy matching
  }
  matchStatus: 'confident' | 'pending_review'  // pending_review = admin dedup queue
  source: string           // adapter id of first/primary source
  sourceUrl: string
  lastFetchedAt: Date
  lastVerifiedAt: Date
  createdAt: Date
  updatedAt: Date
}
```

### `offers` (retailer listing for a canonical sauna)

```ts
{
  _id: ObjectId
  saunaId: ObjectId          // -> saunas._id
  source: string              // adapter id, e.g. 'bauhaus'
  retailerName: string
  url: string
  currentPrice: number
  regularPrice: number | null
  currency: 'SEK'
  availability: 'in_stock' | 'out_of_stock' | 'preorder' | 'unknown'
  vatIncluded: boolean | null
  deliveryCost: number | null
  fetchedAt: Date
  active: boolean            // false once the offer disappears from the source (don't hard-delete)
}
```

### `price_history`

Separate from `offers` so it can grow unbounded without bloating the offer
document (ADR 0009).

```ts
{
  _id: ObjectId
  offerId: ObjectId
  saunaId: ObjectId
  price: number
  checkedAt: Date
}
```

### `projects` (marketplace, Phase 6)

```ts
{
  _id: ObjectId
  status: 'new' | 'active' | 'contacted' | 'closed' | 'expired'
  location: string
  saunaType: string | null
  budgetMin: number | null
  budgetMax: number | null
  foundationNeeded: boolean | null
  installationNeeded: boolean | null
  timeframe: string | null
  description: string
  contactEmail: string
  contactPhone: string | null
  emailVerified: boolean
  createdAt: Date
  expiresAt: Date
}
```

### `contractor_interests` (Phase 6)

```ts
{
  _id: ObjectId
  projectId: ObjectId
  name: string
  company: string | null
  email: string
  phone: string | null
  message: string | null
  createdAt: Date
}
```

### `email_verifications` (Phase 6)

```ts
{
  _id: ObjectId
  token: string          // random, single-use
  projectId: ObjectId
  expiresAt: Date
  usedAt: Date | null
}
```

### `outbound_clicks` (analytics, section 29)

```ts
{
  _id: ObjectId
  offerId: ObjectId
  saunaId: ObjectId
  retailerName: string
  createdAt: Date
}
```

## Indexes to create (Phase 1/2)

- `saunas`: unique on `slug`; index on `identity.gtin`, `identity.sku`,
  `identity.normalizedName` (for dedup lookups); index on `category`.
- `offers`: index on `saunaId`; index on `(source, url)` unique-ish (an
  adapter shouldn't create duplicate offers for the same URL).
- `price_history`: index on `offerId`, `checkedAt`.
- `projects`: index on `status`, `expiresAt` (for the expiration task).
- `email_verifications`: TTL index on `expiresAt` (safe to hard-delete these
  — they're single-use tokens, not user data we need history of).
