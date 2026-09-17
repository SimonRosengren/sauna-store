import { z } from 'zod'
import { provenanceSchema } from './provenance'
import { saunaCategorySchema, heatingTypeSchema, saunaImageSchema } from './sauna'
import { availabilitySchema } from './offer'

// See docs/ai/ingestion.md "The adapter contract" — these are the plain
// TS interfaces adapters/extractors work with. `NormalizedProduct` gets
// Zod-validated at the VALIDATED pipeline stage (server/ingestion/validate.ts)
// via `normalizedProductSchema` below, so the two must stay in sync.

export interface DiscoveredProduct {
  url: string
  sourceId: string
}

export interface RawProduct {
  url: string
  sourceId: string
  html?: string
  jsonLd?: unknown[]
  microdata?: unknown
  fetchedAt: Date
}

// The ingestion-facing subset of a `saunas` document (no _id/slug/matchStatus/
// timestamps yet — those are assigned during dedupe/publish) plus one `offers`
// entry for the retailer this normalization came from.
export interface NormalizedProduct {
  sauna: {
    name: string
    brand: string | null
    manufacturer: string | null
    category: z.infer<typeof saunaCategorySchema>
    saunaType: string | null
    heatingType: z.infer<typeof heatingTypeSchema>
    dimensions: {
      width: { value: number, source: string, sourceUrl: string, fetchedAt: Date } | null
      length: { value: number, source: string, sourceUrl: string, fetchedAt: Date } | null
      height: { value: number, source: string, sourceUrl: string, fetchedAt: Date } | null
    }
    capacity: number | null
    floorArea: number | null
    material: string | null
    images: Array<{ url: string, sourceUrl: string, alt: string }>
    identity: {
      gtin: string | null
      sku: string | null
      manufacturerProductId: string | null
    }
  }
  offer: {
    retailerName: string
    url: string
    currentPrice: number
    regularPrice: number | null
    currency: 'SEK'
    availability: z.infer<typeof availabilitySchema>
    vatIncluded: boolean | null
    deliveryCost: number | null
  }
  source: string
  sourceUrl: string
  fetchedAt: Date
}

// Critical fields fail validation (item is skipped, logged in
// ingestion_runs.errors); everything else is nullable and fine to publish
// with nulls (docs/ai/ingestion.md "VALIDATED" stage).
export const normalizedProductSchema = z.object({
  sauna: z.object({
    name: z.string().min(1),
    brand: z.string().nullable(),
    manufacturer: z.string().nullable(),
    category: saunaCategorySchema,
    saunaType: z.string().nullable(),
    heatingType: heatingTypeSchema,
    dimensions: z.object({
      width: provenanceSchema(z.number()).nullable(),
      length: provenanceSchema(z.number()).nullable(),
      height: provenanceSchema(z.number()).nullable()
    }),
    capacity: z.number().nullable(),
    floorArea: z.number().nullable(),
    material: z.string().nullable(),
    images: z.array(saunaImageSchema),
    identity: z.object({
      gtin: z.string().nullable(),
      sku: z.string().nullable(),
      manufacturerProductId: z.string().nullable()
    })
  }),
  offer: z.object({
    retailerName: z.string().min(1),
    url: z.string().url(),
    currentPrice: z.number().positive(),
    regularPrice: z.number().positive().nullable(),
    currency: z.literal('SEK'),
    availability: availabilitySchema,
    vatIncluded: z.boolean().nullable(),
    deliveryCost: z.number().nullable()
  }),
  source: z.string(),
  sourceUrl: z.string().url(),
  fetchedAt: z.date()
})
