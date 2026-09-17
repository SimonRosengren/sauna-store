// One-off/idempotent seed for the `sources` collection (docs/ai/ingestion.md
// "Adding a new source: checklist" step 5). Run with:
//   pnpm tsx scripts/seed-sources.ts
//
// New sources are seeded with `enabled: false` — flip to `true` only after
// manually running the pipeline against them and verifying the results
// (checklist step 6).
import 'dotenv/config'
import { MongoClient } from 'mongodb'
import { defaultSourceStats } from '../server/db/models/source'

const sourcesToSeed = [
  { _id: 'polhus', name: 'Polhus', baseUrl: 'https://www.polhus.se', enabled: false }
]

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set — copy .env.example to .env first.')
  const dbName = process.env.MONGODB_DB_NAME || 'sauna_store'

  const client = new MongoClient(uri)
  await client.connect()
  try {
    const db = client.db(dbName)
    const sources = db.collection('sources')

    for (const source of sourcesToSeed) {
      const existing = await sources.findOne({ _id: source._id })
      if (existing) {
        console.log(`[seed-sources] '${source._id}' already exists, skipping.`)
        continue
      }
      await sources.insertOne({ ...source, cursor: null, stats: defaultSourceStats })
      console.log(`[seed-sources] inserted '${source._id}' (enabled: ${source.enabled}).`)
    }
  } finally {
    await client.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
