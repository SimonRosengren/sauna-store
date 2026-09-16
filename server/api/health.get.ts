import { getDb } from '../db/client'

// Proves Mongo connectivity end to end (Phase 1). Not meant to become a
// public-facing feature — safe to keep around as an ops sanity check, but
// don't build on top of this route; it exists purely to verify the
// serverless-safe connection singleton actually works against Atlas.
export default defineEventHandler(async (event) => {
  const startedAt = Date.now()

  try {
    const db = await getDb()
    await db.command({ ping: 1 })

    return {
      status: 'ok' as const,
      mongo: 'connected' as const,
      db: db.databaseName,
      latencyMs: Date.now() - startedAt
    }
  } catch (error) {
    setResponseStatus(event, 503)
    return {
      status: 'error' as const,
      mongo: 'disconnected' as const,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})
