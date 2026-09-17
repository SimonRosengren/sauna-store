import { z } from 'zod'

// Mirrors docs/ai/data-model.md `sources` collection. `_id` is the adapter
// id (e.g. 'polhus'), so it's declared separately from this schema at the
// call site rather than embedded here (Mongo's `_id` isn't part of the
// Zod-validated document body).
export const sourceStatsSchema = z.object({
  lastRunAt: z.date().nullable(),
  lastSuccessAt: z.date().nullable(),
  productsFoundLastRun: z.number().int().nonnegative(),
  productsFoundAvgTrailing: z.number().nonnegative(),
  consecutiveFailures: z.number().int().nonnegative()
})
export type SourceStats = z.infer<typeof sourceStatsSchema>

export const sourceDocSchema = z.object({
  _id: z.string(),
  name: z.string(),
  baseUrl: z.string().url(),
  enabled: z.boolean(),
  cursor: z.unknown(),
  stats: sourceStatsSchema
})
export type SourceDoc = z.infer<typeof sourceDocSchema>

export const defaultSourceStats: SourceStats = {
  lastRunAt: null,
  lastSuccessAt: null,
  productsFoundLastRun: 0,
  productsFoundAvgTrailing: 0,
  consecutiveFailures: 0
}
