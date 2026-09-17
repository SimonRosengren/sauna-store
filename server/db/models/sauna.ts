import type { ObjectId } from 'mongodb'
import type { Sauna } from '#shared/types'

// The `saunas` collection document shape as stored in Mongo: the shared
// `Sauna` type plus the Mongo-assigned `_id`.
export type SaunaDoc = Sauna & { _id: ObjectId }
