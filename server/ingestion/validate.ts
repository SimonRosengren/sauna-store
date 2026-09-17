import type { NormalizedProduct } from '#shared/types'
import { normalizedProductSchema } from '#shared/types'

export type ValidationResult =
  | { success: true, data: NormalizedProduct }
  | { success: false, message: string }

// docs/ai/ingestion.md "VALIDATED" stage: missing/invalid critical fields
// (name, price, a working URL) fail validation and the item is logged +
// skipped, never force-published with garbage. Non-critical fields are
// already nullable in the schema, so they pass through fine as null.
export function validateNormalizedProduct(product: NormalizedProduct): ValidationResult {
  const result = normalizedProductSchema.safeParse(product)
  if (result.success) {
    return { success: true, data: result.data as NormalizedProduct }
  }
  const message = result.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ')
  return { success: false, message }
}
