import type { Collection } from 'mongodb'
import { getDb } from './client'
import type { SourceDoc } from './models/source'
import type { IngestionRunDoc } from './models/ingestion-run'
import type { SaunaDoc } from './models/sauna'
import type { OfferDoc, PriceHistoryDoc } from './models/offer'

// Typed collection accessors — the only place collection names are spelled
// out as strings. Keep in sync with docs/ai/data-model.md.
export async function sourcesCollection(): Promise<Collection<SourceDoc>> {
  const db = await getDb()
  return db.collection<SourceDoc>('sources')
}

export async function ingestionRunsCollection(): Promise<Collection<IngestionRunDoc>> {
  const db = await getDb()
  return db.collection<IngestionRunDoc>('ingestion_runs')
}

export async function saunasCollection(): Promise<Collection<SaunaDoc>> {
  const db = await getDb()
  return db.collection<SaunaDoc>('saunas')
}

export async function offersCollection(): Promise<Collection<OfferDoc>> {
  const db = await getDb()
  return db.collection<OfferDoc>('offers')
}

export async function priceHistoryCollection(): Promise<Collection<PriceHistoryDoc>> {
  const db = await getDb()
  return db.collection<PriceHistoryDoc>('price_history')
}

// Idempotent — safe to call on every cold start (see server/plugins/db-indexes.ts).
// See docs/ai/data-model.md "Indexes to create".
export async function ensureIndexes(): Promise<void> {
  const db = await getDb()

  await Promise.all([
    db.collection('saunas').createIndex({ slug: 1 }, { unique: true }),
    db.collection('saunas').createIndex({ 'identity.gtin': 1 }),
    db.collection('saunas').createIndex({ 'identity.sku': 1 }),
    db.collection('saunas').createIndex({ 'identity.normalizedName': 1 }),
    db.collection('saunas').createIndex({ category: 1 }),
    db.collection('offers').createIndex({ saunaId: 1 }),
    db.collection('offers').createIndex({ source: 1, url: 1 }, { unique: true }),
    db.collection('price_history').createIndex({ offerId: 1 }),
    db.collection('price_history').createIndex({ checkedAt: 1 })
  ])
}
