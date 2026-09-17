import { z } from 'zod'

// See docs/ai/data-model.md "Provenance shape". Wraps any field-level value
// that came from an external source rather than being computed by us.
export function provenanceSchema<T extends z.ZodTypeAny>(value: T) {
  return z.object({
    value,
    source: z.string(),
    sourceUrl: z.string().url(),
    fetchedAt: z.date()
  })
}

export type Provenance<T> = {
  value: T
  source: string
  sourceUrl: string
  fetchedAt: Date
}
