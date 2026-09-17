import { ensureIndexes } from '../db/collections'

// Runs once per server instance cold start. `createIndex` is idempotent, so
// this is safe to call repeatedly (dev restarts, multiple serverless
// instances) rather than requiring a separate migration step.
export default defineNitroPlugin(() => {
  ensureIndexes().catch((error) => {
    console.error('[db-indexes] Failed to ensure Mongo indexes:', error)
  })
})
