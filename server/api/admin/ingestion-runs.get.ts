import { ingestionRunsCollection, sourcesCollection } from '../../db/collections'

// Minimal read-only ingestion inspection view (docs/ai/roadmap.md Phase 2
// scope: "Minimal read-only admin page to inspect ingestion runs"). This is
// intentionally NOT the full admin system (session auth, moderation, dedup
// review queue) — that's Phase 7. Gated by a single shared password rather
// than a session, since there's exactly one operator right now.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const password = getHeader(event, 'x-admin-password') ?? getQuery(event).password

  if (!config.adminPassword || password !== config.adminPassword) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const runs = await ingestionRunsCollection()
  const sources = await sourcesCollection()

  const [recentRuns, allSources] = await Promise.all([
    runs.find({}).sort({ startedAt: -1 }).limit(50).toArray(),
    sources.find({}).toArray()
  ])

  return { runs: recentRuns, sources: allSources }
})
