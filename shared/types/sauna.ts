import { z } from 'zod'
import { provenanceSchema } from './provenance'

// Mirrors docs/ai/data-model.md `saunas` collection. Keep both in sync.
export const saunaCategorySchema = z.enum([
  'bastutunna',
  'bastustuga',
  'el-bastu',
  'vedeldad-bastu',
  'ovrigt'
])
export type SaunaCategory = z.infer<typeof saunaCategorySchema>

export const heatingTypeSchema = z.enum(['ved', 'el', 'okand'])
export type HeatingType = z.infer<typeof heatingTypeSchema>

export const matchStatusSchema = z.enum(['confident', 'pending_review'])
export type MatchStatus = z.infer<typeof matchStatusSchema>

export const saunaImageSchema = z.object({
  url: z.string().url(),
  sourceUrl: z.string().url(),
  alt: z.string()
})
export type SaunaImage = z.infer<typeof saunaImageSchema>

export const saunaIdentitySchema = z.object({
  gtin: z.string().nullable(),
  sku: z.string().nullable(),
  manufacturerProductId: z.string().nullable(),
  // Lowercased, punctuation-stripped, for fuzzy dedup matching.
  normalizedName: z.string()
})
export type SaunaIdentity = z.infer<typeof saunaIdentitySchema>

export const saunaDimensionsSchema = z.object({
  width: provenanceSchema(z.number()).nullable(),
  length: provenanceSchema(z.number()).nullable(),
  height: provenanceSchema(z.number()).nullable()
})
export type SaunaDimensions = z.infer<typeof saunaDimensionsSchema>

// The full canonical `saunas` document shape (as stored in Mongo).
export const saunaSchema = z.object({
  slug: z.string(),
  name: z.string().min(1),
  brand: z.string().nullable(),
  manufacturer: z.string().nullable(),
  category: saunaCategorySchema,
  saunaType: z.string().nullable(),
  heatingType: heatingTypeSchema,
  dimensions: saunaDimensionsSchema,
  capacity: z.number().nullable(),
  floorArea: z.number().nullable(),
  material: z.string().nullable(),
  images: z.array(saunaImageSchema),
  identity: saunaIdentitySchema,
  matchStatus: matchStatusSchema,
  source: z.string(),
  sourceUrl: z.string().url(),
  lastFetchedAt: z.date(),
  lastVerifiedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date()
})
export type Sauna = z.infer<typeof saunaSchema>
