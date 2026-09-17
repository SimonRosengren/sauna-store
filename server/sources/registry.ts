import type { ProductSourceAdapter } from './types'
import { polhusAdapter } from './polhus/adapter'

// See docs/ai/ingestion.md "Adding a new source: checklist" step 4. Adding
// a source is additive: implement the adapter, register it here, add a
// `sources` document (scripts/seed-sources.ts). No other file should need
// to change.
export const sourceRegistry: Record<string, ProductSourceAdapter> = {
  [polhusAdapter.id]: polhusAdapter
}

export function getAdapter(sourceId: string): ProductSourceAdapter {
  const adapter = sourceRegistry[sourceId]
  if (!adapter) {
    throw new Error(`Unknown source adapter: ${sourceId}`)
  }
  return adapter
}
