import type { Collection } from 'mongodb'
import type { SaunaDoc } from '../db/models/sauna'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Appends `-2`, `-3`, ... on collision so every `saunas.slug` stays unique
 * without ever silently overwriting an existing product's URL. */
export async function generateUniqueSlug(name: string, saunas: Collection<SaunaDoc>): Promise<string> {
  const base = slugify(name)
  let candidate = base
  let suffix = 2
  while (await saunas.findOne({ slug: candidate }, { projection: { _id: 1 } })) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }
  return candidate
}
