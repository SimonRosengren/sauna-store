import { sourcesCollection } from '../../db/collections'

// Triggered by Vercel Cron (vercel.json) hitting this route on a daily
// schedule. Vercel Cron always sends a GET request and auto-attaches
// `Authorization: Bearer <CRON_SECRET>` when that env var is set — see
// https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs.
// Runs one bounded batch (server/tasks/ingest.ts ->
// server/ingestion/pipeline.ts) per enabled source.
//
// Manual/dev testing: pass `?sourceId=polhus` to run a single source
// directly regardless of its `enabled` flag (docs/ai/ingestion.md checklist
// step 6 — verify a new source manually before flipping it on for cron).
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authHeader = getHeader(event, 'authorization')

  if (!config.cronSecret || authHeader !== `Bearer ${config.cronSecret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const query = getQuery(event)
  const requestedSourceId = typeof query.sourceId === 'string' ? query.sourceId : null

  const sourceIds: string[] = requestedSourceId
    ? [requestedSourceId]
    : await (async () => {
        const sources = await sourcesCollection()
        const enabled = await sources.find({ enabled: true }, { projection: { _id: 1 } }).toArray()
        return enabled.map((s) => s._id)
      })()

  const results = await Promise.all(
    sourceIds.map(async (sourceId) => {
      try {
        const { result } = await runTask('ingest', { payload: { sourceId } })
        return { sourceId, ok: true, run: result }
      } catch (error) {
        return { sourceId, ok: false, error: error instanceof Error ? error.message : String(error) }
      }
    })
  )

  return { sources: sourceIds, results }
})
