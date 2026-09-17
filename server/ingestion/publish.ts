import { ObjectId } from 'mongodb'
import type { NormalizedProduct } from '#shared/types'
import type { SaunaDoc } from '../db/models/sauna'
import { saunasCollection, offersCollection, priceHistoryCollection } from '../db/collections'
import { normalizeName } from './normalize-name'
import { generateUniqueSlug } from './slug'

export type PublishOutcome =
  | { kind: 'updated_existing_offer', saunaId: ObjectId, offerId: ObjectId, priceChanged: boolean }
  | { kind: 'attached_new_offer', saunaId: ObjectId, offerId: ObjectId, matchedOn: 'gtin' | 'brand_name' }
  | { kind: 'created_new_sauna', saunaId: ObjectId, offerId: ObjectId }

// See docs/adr/0009-dedup-and-provenance-model.md. This is the *only* write
// path into `saunas`/`offers` from ingestion — there is no direct "insert
// new sauna" path outside this function (ADR 0009 consequence).
export async function publishNormalizedProduct(normalized: NormalizedProduct): Promise<PublishOutcome> {
  const saunas = await saunasCollection()
  const offers = await offersCollection()
  const priceHistory = await priceHistoryCollection()
  const now = new Date()

  // 1. Same-source fast path: has this exact (source, url) offer been seen
  // before? If so, the dedup decision was already made on a previous run —
  // just refresh price/availability, never re-decide the match.
  const existingOffer = await offers.findOne({ source: normalized.source, url: normalized.offer.url })
  if (existingOffer) {
    const priceChanged = existingOffer.currentPrice !== normalized.offer.currentPrice

    await offers.updateOne(
      { _id: existingOffer._id },
      {
        $set: {
          currentPrice: normalized.offer.currentPrice,
          regularPrice: normalized.offer.regularPrice,
          availability: normalized.offer.availability,
          vatIncluded: normalized.offer.vatIncluded,
          deliveryCost: normalized.offer.deliveryCost,
          fetchedAt: normalized.fetchedAt,
          active: true
        }
      }
    )
    await saunas.updateOne({ _id: existingOffer.saunaId }, { $set: { lastFetchedAt: normalized.fetchedAt, lastVerifiedAt: now, updatedAt: now } })

    if (priceChanged) {
      await priceHistory.insertOne({
        offerId: existingOffer._id,
        saunaId: existingOffer.saunaId,
        price: normalized.offer.currentPrice,
        checkedAt: normalized.fetchedAt
      })
    }

    return { kind: 'updated_existing_offer', saunaId: existingOffer.saunaId, offerId: existingOffer._id, priceChanged }
  }

  const normalizedName = normalizeName(normalized.sauna.name)

  // 2. Strong signal: GTIN match against any source's canonical record.
  let match: SaunaDoc | null = null
  let matchedOn: 'gtin' | 'brand_name' | null = null
  if (normalized.sauna.identity.gtin) {
    match = await saunas.findOne({ 'identity.gtin': normalized.sauna.identity.gtin })
    if (match) matchedOn = 'gtin'
  }

  // 3. Fallback: same brand + normalized model name. Never merge on name
  // alone (ADR 0009) — brand must also match.
  if (!match && normalized.sauna.brand) {
    match = await saunas.findOne({ brand: normalized.sauna.brand, 'identity.normalizedName': normalizedName })
    if (match) matchedOn = 'brand_name'
  }

  if (match && matchedOn) {
    // New retailer offer for an existing canonical product. Conservative
    // merge: only backfill fields that were previously unknown (null) —
    // never overwrite data another source already established (ADR 0009
    // "never overwrite blindly").
    const fill: Partial<SaunaDoc> = {}
    if (!match.dimensions.width && normalized.sauna.dimensions.width) fill.dimensions = { ...match.dimensions, width: normalized.sauna.dimensions.width }
    if (!match.capacity && normalized.sauna.capacity) fill.capacity = normalized.sauna.capacity
    if (!match.floorArea && normalized.sauna.floorArea) fill.floorArea = normalized.sauna.floorArea
    if (!match.material && normalized.sauna.material) fill.material = normalized.sauna.material
    if (match.images.length === 0 && normalized.sauna.images.length > 0) fill.images = normalized.sauna.images

    await saunas.updateOne(
      { _id: match._id },
      { $set: { ...fill, lastFetchedAt: normalized.fetchedAt, lastVerifiedAt: now, updatedAt: now } }
    )

    const offerResult = await offers.insertOne({
      _id: new ObjectId(),
      saunaId: match._id,
      source: normalized.source,
      retailerName: normalized.offer.retailerName,
      url: normalized.offer.url,
      currentPrice: normalized.offer.currentPrice,
      regularPrice: normalized.offer.regularPrice,
      currency: normalized.offer.currency,
      availability: normalized.offer.availability,
      vatIncluded: normalized.offer.vatIncluded,
      deliveryCost: normalized.offer.deliveryCost,
      fetchedAt: normalized.fetchedAt,
      active: true
    })
    await priceHistory.insertOne({
      offerId: offerResult.insertedId,
      saunaId: match._id,
      price: normalized.offer.currentPrice,
      checkedAt: normalized.fetchedAt
    })

    return { kind: 'attached_new_offer', saunaId: match._id, offerId: offerResult.insertedId, matchedOn }
  }

  // 4. No match anywhere — brand-new canonical product.
  const slug = await generateUniqueSlug(normalized.sauna.name, saunas)
  const saunaDoc: SaunaDoc = {
    _id: new ObjectId(),
    slug,
    name: normalized.sauna.name,
    brand: normalized.sauna.brand,
    manufacturer: normalized.sauna.manufacturer,
    category: normalized.sauna.category,
    saunaType: normalized.sauna.saunaType,
    heatingType: normalized.sauna.heatingType,
    dimensions: normalized.sauna.dimensions,
    capacity: normalized.sauna.capacity,
    floorArea: normalized.sauna.floorArea,
    material: normalized.sauna.material,
    images: normalized.sauna.images,
    identity: { ...normalized.sauna.identity, normalizedName },
    matchStatus: 'confident',
    source: normalized.source,
    sourceUrl: normalized.sourceUrl,
    lastFetchedAt: normalized.fetchedAt,
    lastVerifiedAt: now,
    createdAt: now,
    updatedAt: now
  }
  await saunas.insertOne(saunaDoc)

  const offerResult = await offers.insertOne({
    _id: new ObjectId(),
    saunaId: saunaDoc._id,
    source: normalized.source,
    retailerName: normalized.offer.retailerName,
    url: normalized.offer.url,
    currentPrice: normalized.offer.currentPrice,
    regularPrice: normalized.offer.regularPrice,
    currency: normalized.offer.currency,
    availability: normalized.offer.availability,
    vatIncluded: normalized.offer.vatIncluded,
    deliveryCost: normalized.offer.deliveryCost,
    fetchedAt: normalized.fetchedAt,
    active: true
  })
  await priceHistory.insertOne({
    offerId: offerResult.insertedId,
    saunaId: saunaDoc._id,
    price: normalized.offer.currentPrice,
    checkedAt: normalized.fetchedAt
  })

  return { kind: 'created_new_sauna', saunaId: saunaDoc._id, offerId: offerResult.insertedId }
}
