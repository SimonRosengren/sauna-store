import type { NormalizedProduct } from '#shared/types'
import { getAdapter } from '../sources/registry'
import { sourcesCollection, ingestionRunsCollection, offersCollection } from '../db/collections'
import { emptyCounts, type IngestionRunDoc, type IngestionRunStatus } from '../db/models/ingestion-run'
import { validateNormalizedProduct } from './validate'
import { publishNormalizedProduct } from './publish'

// See docs/ai/ingestion.md "Pipeline stages" and
// docs/adr/0004-vercel-hosting-and-cron-strategy.md (chunked/resumable
// batches). Orchestrates discover -> fetch -> normalize -> validate ->
// dedupe -> publish identically for any registered adapter — no
// source-specific branches here (docs/adr/0008).

export const DEFAULT_MAX_ITEMS_PER_RUN = 50

interface SourceCursor {
  /** URLs discovered but not yet processed in a previous, chunked run. */
  pendingUrls?: string[]
  adapterCursor?: unknown
}

export async function runIngestion(sourceId: string, options: { maxItems?: number } = {}): Promise<IngestionRunDoc> {
  const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS_PER_RUN
  const adapter = getAdapter(sourceId)
  const sources = await sourcesCollection()
  const runs = await ingestionRunsCollection()

  const sourceDoc = await sources.findOne({ _id: sourceId })
  if (!sourceDoc) {
    throw new Error(`No 'sources' document for '${sourceId}' — seed it first (scripts/seed-sources.ts).`)
  }
  // Note: `enabled` is intentionally NOT checked here — it gates which
  // sources the cron route (server/api/cron/ingest.post.ts) processes
  // automatically, not whether this function can be called directly. This
  // is what lets docs/ai/ingestion.md's checklist step 6 work: run the
  // pipeline manually against a newly-added, still-disabled source before
  // ever flipping it on for the cron job.

  const counts = emptyCounts()
  const errors: IngestionRunDoc['errors'] = []
  const startedAt = new Date()
  const insertResult = await runs.insertOne({
    sourceId,
    startedAt,
    finishedAt: null,
    status: 'running',
    counts,
    errors
  })
  const runId = insertResult.insertedId

  const cursor = (sourceDoc.cursor as SourceCursor | null) ?? {}
  let discoveredUrls: string[]
  let nextAdapterCursor: unknown = cursor.adapterCursor ?? null

  try {
    if (cursor.pendingUrls && cursor.pendingUrls.length > 0) {
      // Continue draining the previous run's leftover queue instead of
      // re-discovering (avoids redundant category-page fetches mid-batch).
      discoveredUrls = cursor.pendingUrls
    } else {
      const { items, nextCursor } = await adapter.discoverProducts(cursor.adapterCursor)
      discoveredUrls = items.map((item) => item.url)
      nextAdapterCursor = nextCursor
    }
  } catch (error) {
    const finishedAt = new Date()
    const message = error instanceof Error ? error.message : String(error)
    errors.push({ stage: 'discover', message })
    await runs.updateOne({ _id: runId }, { $set: { finishedAt, status: 'failed' satisfies IngestionRunStatus, errors } })
    await sources.updateOne(
      { _id: sourceId },
      { $set: { 'stats.lastRunAt': finishedAt, 'stats.consecutiveFailures': sourceDoc.stats.consecutiveFailures + 1 } }
    )
    throw error
  }

  counts.discovered = discoveredUrls.length

  // Suspicious-run protection (docs/ai/ingestion.md, source brief 10/28):
  // a big unexplained drop vs. the trailing average means the source
  // probably failed to load properly, not that products vanished.
  const trailingAvg = sourceDoc.stats.productsFoundAvgTrailing
  const isSuspiciousDrop = trailingAvg > 0 && discoveredUrls.length < trailingAvg * 0.5

  const batch = discoveredUrls.slice(0, maxItems)
  const remaining = discoveredUrls.slice(maxItems)

  for (const url of batch) {
    try {
      const raw = await adapter.fetchProduct(url)
      counts.fetched += 1

      let normalized: NormalizedProduct
      try {
        normalized = adapter.normalize(raw)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        counts.failed += 1
        errors.push({ url, stage: 'normalize', message })
        continue
      }
      counts.normalized += 1

      const validation = validateNormalizedProduct(normalized)
      if (!validation.success) {
        counts.failed += 1
        errors.push({ url, stage: 'validate', message: validation.message })
        continue
      }
      counts.validated += 1

      await publishNormalizedProduct(validation.data)
      counts.deduped += 1
      counts.published += 1
    } catch (error) {
      counts.failed += 1
      const message = error instanceof Error ? error.message : String(error)
      errors.push({ url, stage: 'fetch', message })
    }
  }

  // Only deactivate offers that vanished from the source once a run has
  // fully drained the discovered set without being flagged suspicious
  // (docs/ai/ingestion.md — never deactivate on a partial/failed-looking run).
  if (!isSuspiciousDrop && remaining.length === 0) {
    const offers = await offersCollection()
    await offers.updateMany(
      { source: sourceId, url: { $nin: discoveredUrls }, active: true },
      { $set: { active: false } }
    )
  }

  const finishedAt = new Date()
  const status: IngestionRunStatus = isSuspiciousDrop
    ? 'flagged_suspicious'
    : batch.length > 0 && counts.published === 0
      ? 'failed'
      : 'succeeded'

  await runs.updateOne({ _id: runId }, { $set: { finishedAt, status, counts, errors } })

  const newAvgTrailing = trailingAvg === 0
    ? discoveredUrls.length
    : Math.round(trailingAvg * 0.7 + discoveredUrls.length * 0.3)

  await sources.updateOne(
    { _id: sourceId },
    {
      $set: {
        cursor: { pendingUrls: remaining, adapterCursor: nextAdapterCursor } satisfies SourceCursor,
        'stats.lastRunAt': finishedAt,
        ...(status !== 'failed' ? { 'stats.lastSuccessAt': finishedAt } : {}),
        'stats.productsFoundLastRun': discoveredUrls.length,
        'stats.productsFoundAvgTrailing': newAvgTrailing,
        'stats.consecutiveFailures': status === 'failed' ? sourceDoc.stats.consecutiveFailures + 1 : 0
      }
    }
  )

  return { _id: runId, sourceId, startedAt, finishedAt, status, counts, errors }
}
