import { z } from 'zod'

// Mirrors docs/ai/data-model.md `offers` collection.
export const availabilitySchema = z.enum([
  'in_stock',
  'out_of_stock',
  'preorder',
  'unknown'
])
export type Availability = z.infer<typeof availabilitySchema>

export const offerSchema = z.object({
  saunaId: z.string(), // ObjectId, stringified at the boundary
  source: z.string(),
  retailerName: z.string(),
  url: z.string().url(),
  currentPrice: z.number().positive(),
  regularPrice: z.number().positive().nullable(),
  currency: z.literal('SEK'),
  availability: availabilitySchema,
  vatIncluded: z.boolean().nullable(),
  deliveryCost: z.number().nullable(),
  fetchedAt: z.date(),
  active: z.boolean()
})
export type Offer = z.infer<typeof offerSchema>
