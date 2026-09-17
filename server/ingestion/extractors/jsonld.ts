import * as cheerio from 'cheerio'

// Generic, source-agnostic JSON-LD extraction (docs/ai/ingestion.md
// extraction priority #3). Adapters call into this rather than each
// reimplementing `<script type="application/ld+json">` parsing.

/** Parses every JSON-LD script block on a page into a flat array of nodes,
 * flattening `@graph` wrappers so callers don't need to special-case them. */
export function extractJsonLd(html: string): unknown[] {
  const $ = cheerio.load(html)
  const nodes: unknown[] = []

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text()
    if (!raw.trim()) return

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      // Malformed JSON-LD on the source's page — skip this block, don't
      // fail the whole extraction over one bad script tag.
      return
    }

    for (const node of Array.isArray(parsed) ? parsed : [parsed]) {
      if (node && typeof node === 'object' && '@graph' in node && Array.isArray((node as { '@graph': unknown[] })['@graph'])) {
        nodes.push(...(node as { '@graph': unknown[] })['@graph'])
      } else {
        nodes.push(node)
      }
    }
  })

  return nodes
}

function typeMatches(node: unknown, type: string): boolean {
  if (!node || typeof node !== 'object' || !('@type' in node)) return false
  const t = (node as { '@type': unknown })['@type']
  return t === type || (Array.isArray(t) && t.includes(type))
}

/** Finds the first schema.org node of a given `@type` among parsed JSON-LD nodes. */
export function findJsonLdType<T = Record<string, unknown>>(nodes: unknown[], type: string): T | null {
  return (nodes.find((n) => typeMatches(n, type)) as T | undefined) ?? null
}
