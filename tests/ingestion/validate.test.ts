import { describe, expect, it } from 'vitest'
import type { NormalizedProduct } from '#shared/types'
import { validateNormalizedProduct } from '../../server/ingestion/validate'

function baseProduct(): NormalizedProduct {
  return {
    sauna: {
      name: 'Bastu Alvar',
      brand: 'Polhus',
      manufacturer: 'Polhus',
      category: 'bastustuga',
      saunaType: null,
      heatingType: 'okand',
      dimensions: { width: null, length: null, height: null },
      capacity: null,
      floorArea: null,
      material: null,
      images: [],
      identity: { gtin: null, sku: 'S2616-ALVAR', manufacturerProductId: 'S2616-ALVAR' }
    },
    offer: {
      retailerName: 'Polhus',
      url: 'https://www.polhus.se/bastu-alvar-p-6062',
      currentPrice: 84990,
      regularPrice: null,
      currency: 'SEK',
      availability: 'in_stock',
      vatIncluded: null,
      deliveryCost: null
    },
    source: 'polhus',
    sourceUrl: 'https://www.polhus.se/bastu-alvar-p-6062',
    fetchedAt: new Date()
  }
}

describe('validateNormalizedProduct', () => {
  it('accepts a well-formed product', () => {
    const result = validateNormalizedProduct(baseProduct())
    expect(result.success).toBe(true)
  })

  it('accepts null non-critical fields (dimensions, capacity, etc.)', () => {
    // baseProduct() already has these null — this documents that it's a
    // valid, publishable state (docs/ai/ingestion.md VALIDATED stage).
    const result = validateNormalizedProduct(baseProduct())
    expect(result.success).toBe(true)
  })

  it('rejects a missing/empty name (critical field)', () => {
    const product = baseProduct()
    product.sauna.name = ''
    const result = validateNormalizedProduct(product)
    expect(result.success).toBe(false)
  })

  it('rejects a non-positive price (critical field)', () => {
    const product = baseProduct()
    product.offer.currentPrice = Number.NaN
    const result = validateNormalizedProduct(product)
    expect(result.success).toBe(false)
  })

  it('rejects a malformed offer URL (critical field)', () => {
    const product = baseProduct()
    product.offer.url = 'not-a-url'
    const result = validateNormalizedProduct(product)
    expect(result.success).toBe(false)
  })
})
