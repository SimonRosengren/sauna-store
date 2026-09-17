// Lowercased, punctuation-stripped product name used for fuzzy dedup
// matching (see `identity.normalizedName`, docs/ai/data-model.md).
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents so e.g. "ö" and "o" fuzzy-match consistently
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}
