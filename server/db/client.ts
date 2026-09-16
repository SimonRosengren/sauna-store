import { MongoClient, type Db } from 'mongodb'

// Serverless-safe connection caching (Vercel functions can be reused across
// invocations on the same instance; without this we'd open a new connection
// per request). See docs/adr/0002-mongodb-over-postgres.md.
//
// The cached promise is stored on `globalThis` rather than a module-level
// variable so it survives Vite/Nitro's dev-mode module reloading and any
// bundler duplication of this module across chunks.
declare global {
  var __mongoClientPromise: Promise<MongoClient> | undefined
}

function createClientPromise(): Promise<MongoClient> {
  const config = useRuntimeConfig()

  if (!config.mongodbUri) {
    throw new Error(
      'MONGODB_URI is not set. Copy .env.example to .env and fill it in — see docs/ai/data-model.md.'
    )
  }

  const client = new MongoClient(config.mongodbUri)
  return client.connect()
}

function getClientPromise(): Promise<MongoClient> {
  if (!globalThis.__mongoClientPromise) {
    globalThis.__mongoClientPromise = createClientPromise()
  }
  return globalThis.__mongoClientPromise
}

export async function getMongoClient(): Promise<MongoClient> {
  return getClientPromise()
}

export async function getDb(): Promise<Db> {
  const config = useRuntimeConfig()
  const client = await getClientPromise()
  return client.db(config.mongodbDbName)
}
