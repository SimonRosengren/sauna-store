import { runIngestion, DEFAULT_MAX_ITEMS_PER_RUN } from '../ingestion/pipeline'

// The actual batch-processing work for one source, invoked by
// server/api/cron/ingest.post.ts. See docs/adr/0004 for why this is a
// separate Nitro task from the route: the route only handles
// auth/dispatch, the task does the (potentially slow) real work.
export default defineTask({
  meta: {
    name: 'ingest',
    description: 'Runs one bounded batch of the ingestion pipeline for a single source.'
  },
  async run({ payload }) {
    const sourceId = payload.sourceId as string
    const maxItems = typeof payload.maxItems === 'number' ? payload.maxItems : DEFAULT_MAX_ITEMS_PER_RUN
    const run = await runIngestion(sourceId, { maxItems })
    return { result: run }
  }
})
