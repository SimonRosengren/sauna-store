import * as cheerio from 'cheerio'
import type { ProductSourceAdapter, DiscoveredProduct, RawProduct } from '../types'
import type { NormalizedProduct } from '#shared/types'
import { extractJsonLd, findJsonLdType } from '../../ingestion/extractors/jsonld'

// See docs/adr/0010-initial-ingestion-sources.md and docs/ai/ingestion.md.
// Polhus.se: Swedish manufacturer of bastustugor/bastutunnor. Fully
// permissive robots.txt, clean JSON-LD Product+Offer on every product page.
// The catalog is 100% on-topic within these three category pages (no
// classification layer needed) — this adapter intentionally does NOT crawl
// the rest of polhus.se (which also sells badtunnor/attefallshus/etc., see
// the ADR).

const BASE_URL = 'https://www.polhus.se'
const CATEGORY_PATHS = ['/bastu', '/bastustuga', '/bastutunnor']
const SOURCE_ID = 'polhus'

const USER_AGENT = 'Bastuguiden/1.0 (+https://bastuguiden.se; ingestion bot)'

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) {
    throw new Error(`Polhus: fetch failed for ${url}: HTTP ${response.status}`)
  }
  return response.text()
}

/** Category listing pages render a `<ul class="category_products__list">`
 * of `<a class="product_card" href="...">` — see docs/ai/ingestion.md
 * checklist step 1 (verified live, ADR 0010). This is anchor-tag URL
 * enumeration for discovery, not field-level scraping (product data itself
 * comes from JSON-LD in `fetchProduct`/`normalize` below). */
function extractProductLinks(html: string): string[] {
  const $ = cheerio.load(html)
  const links = new Set<string>()

  $('ul.category_products__list a.product_card[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (href) links.add(new URL(href, BASE_URL).toString())
  })

  return [...links]
}

/** Bastutunnor (barrel saunas) are distinguishable by slug/name; everything
 * else discovered from these three category pages is a bastustuga (cabin).
 * Heating type isn't reliably present in Polhus's JSON-LD (see adapter
 * research notes in docs/adr/0010), so it's left 'okand' rather than
 * guessed — this is a deliberately narrow, source-specific rule, not a
 * shared classifier (docs/adr/0008: only generalize once >1 source needs it). */
function classifyCategory(nameOrSlug: string): 'bastutunna' | 'bastustuga' {
  return /bastutunna/i.test(nameOrSlug) ? 'bastutunna' : 'bastustuga'
}

function mapAvailability(schemaOrgAvailability: unknown): NormalizedProduct['offer']['availability'] {
  const value = typeof schemaOrgAvailability === 'string' ? schemaOrgAvailability : ''
  if (value.includes('InStock')) return 'in_stock'
  if (value.includes('OutOfStock')) return 'out_of_stock'
  if (value.includes('PreOrder') || value.includes('PreSale')) return 'preorder'
  return 'unknown'
}

interface SchemaOrgProduct {
  name?: string
  sku?: string
  mpn?: string
  image?: string | string[]
  brand?: { name?: string } | string
  offers?: {
    url?: string
    price?: number | string
    priceCurrency?: string
    availability?: string
  }
}

export const polhusAdapter: ProductSourceAdapter = {
  id: SOURCE_ID,

  async discoverProducts(): Promise<{ items: DiscoveredProduct[], nextCursor: null }> {
    const urlSets = await Promise.all(
      CATEGORY_PATHS.map(async (path) => {
        const html = await fetchHtml(`${BASE_URL}${path}`)
        return extractProductLinks(html)
      })
    )

    const uniqueUrls = new Set(urlSets.flat())
    const items: DiscoveredProduct[] = [...uniqueUrls].map((url) => ({ url, sourceId: SOURCE_ID }))

    // Small catalog (~40 products across 3 categories) — one call returns
    // everything, no cursor needed (docs/ai/ingestion.md).
    return { items, nextCursor: null }
  },

  async fetchProduct(url: string): Promise<RawProduct> {
    const html = await fetchHtml(url)
    return {
      url,
      sourceId: SOURCE_ID,
      html,
      jsonLd: extractJsonLd(html),
      fetchedAt: new Date()
    }
  },

  normalize(raw: RawProduct): NormalizedProduct {
    const product = findJsonLdType<SchemaOrgProduct>(raw.jsonLd ?? [], 'Product')
    if (!product || !product.name) {
      throw new Error(`Polhus: no JSON-LD Product found at ${raw.url}`)
    }

    const brandName = typeof product.brand === 'string' ? product.brand : product.brand?.name ?? 'Polhus'
    const images = (Array.isArray(product.image) ? product.image : product.image ? [product.image] : []).map(
      (url) => ({ url, sourceUrl: raw.url, alt: product.name! })
    )
    const price = typeof product.offers?.price === 'string' ? Number(product.offers.price) : product.offers?.price

    return {
      sauna: {
        name: product.name,
        brand: brandName,
        manufacturer: 'Polhus',
        category: classifyCategory(`${raw.url} ${product.name}`),
        saunaType: null,
        // Not reliably present in Polhus's JSON-LD — 'okand' is honest,
        // not a guess (docs/ai/ingestion.md VALIDATED stage: nullable
        // fields publish as null/unknown rather than being inferred).
        heatingType: 'okand',
        dimensions: { width: null, length: null, height: null },
        capacity: null,
        floorArea: null,
        material: null,
        images,
        identity: {
          gtin: null,
          sku: product.sku ?? null,
          manufacturerProductId: product.mpn ?? null
        }
      },
      offer: {
        retailerName: 'Polhus',
        url: product.offers?.url ?? raw.url,
        currentPrice: price ?? Number.NaN,
        regularPrice: null,
        currency: 'SEK',
        availability: mapAvailability(product.offers?.availability),
        vatIncluded: null,
        deliveryCost: null
      },
      source: SOURCE_ID,
      sourceUrl: raw.url,
      fetchedAt: raw.fetchedAt
    }
  }
}
