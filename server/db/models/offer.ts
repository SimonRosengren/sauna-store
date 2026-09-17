import type { ObjectId } from 'mongodb'
import type { Offer } from '#shared/types'

// The `offers` collection document shape as stored in Mongo: same fields as
// the shared `Offer` type, but `saunaId` is a real ObjectId (the shared type
// uses a stringified id at the validation boundary) and `_id` is added.
export type OfferDoc = Omit<Offer, 'saunaId'> & { _id: ObjectId, saunaId: ObjectId }

export interface PriceHistoryDoc {
  _id?: ObjectId
  offerId: ObjectId
  saunaId: ObjectId
  price: number
  checkedAt: Date
}
