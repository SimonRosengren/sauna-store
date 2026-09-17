import type { DiscoveredProduct, RawProduct, NormalizedProduct } from '#shared/types'

export type { DiscoveredProduct, RawProduct, NormalizedProduct }

// See docs/ai/ingestion.md "The adapter contract" and
// docs/adr/0008-source-adapter-architecture.md. Every source lives in its
// own folder implementing this interface; the shared pipeline
// (server/ingestion/pipeline.ts) orchestrates discover -> fetch -> normalize
// -> validate -> classify -> dedupe -> publish identically for all of them.
export interface ProductSourceAdapter {
  id: string
  /** `cursor` lets discovery itself be batched across cron runs for large
   * catalogs. Small catalogs can ignore it and always return `nextCursor: null`. */
  discoverProducts: (cursor?: unknown) => Promise<{ items: DiscoveredProduct[], nextCursor: unknown | null }>
  fetchProduct: (url: string) => Promise<RawProduct>
  normalize: (raw: RawProduct) => NormalizedProduct
}
