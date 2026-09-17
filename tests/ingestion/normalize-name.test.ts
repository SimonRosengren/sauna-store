import { describe, expect, it } from 'vitest'
import { normalizeName } from '../../server/ingestion/normalize-name'

describe('normalizeName', () => {
  it('lowercases and strips punctuation', () => {
    expect(normalizeName('Bastu Alvar')).toBe('bastu alvar')
    expect(normalizeName('Bastu-Tunna Edda!')).toBe('bastu tunna edda')
  })

  it('strips accents so fuzzy matches are consistent', () => {
    expect(normalizeName('Bastö Ängla')).toBe('basto angla')
  })

  it('collapses repeated whitespace', () => {
    expect(normalizeName('Bastu   Sanna')).toBe('bastu sanna')
  })
})
