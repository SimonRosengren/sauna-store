import * as cheerio from 'cheerio'

// Generic OpenGraph/meta-tag extraction (docs/ai/ingestion.md extraction
// priority #6 — last-resort fallback before raw HTML scraping). Not used by
// the Polhus adapter (JSON-LD covers everything needed), but kept generic
// and available for a future source that only exposes OpenGraph tags.
export interface OpenGraphData {
  title: string | null
  description: string | null
  image: string | null
  priceAmount: number | null
  priceCurrency: string | null
}

export function extractOpenGraph(html: string): OpenGraphData {
  const $ = cheerio.load(html)
  const meta = (property: string) => $(`meta[property="${property}"]`).attr('content') ?? null

  const priceAmountRaw = meta('product:price:amount') ?? meta('og:price:amount')
  const priceAmount = priceAmountRaw ? Number(priceAmountRaw) : null

  return {
    title: meta('og:title'),
    description: meta('og:description'),
    image: meta('og:image'),
    priceAmount: priceAmount !== null && Number.isFinite(priceAmount) ? priceAmount : null,
    priceCurrency: meta('product:price:currency') ?? meta('og:price:currency')
  }
}
