import { describe, expect, it } from 'vitest'
import { cityBuckets, citiesCompatible, jaccard, titlesLookSame, titleTokens } from '../src/dedupe'

describe('titleTokens', () => {
  it('maps synonyms and drops role fillers (the ROADMAP example)', () => {
    expect(titleTokens('Fullstack Developer (ReactJS/NodeJS)')).toEqual(new Set(['fullstack', 'react', 'node']))
    expect(titleTokens('Full Stack Engineer React Node')).toEqual(new Set(['fullstack', 'react', 'node']))
  })
  it('drops TopCV salary noise and Vietnamese fillers', () => {
    expect(titleTokens('Lập Trình Viên Backend NodeJS - Lương Từ 10 - 20 Triệu/Tháng'))
      .toEqual(new Set(['backend', 'node']))
  })
})

describe('jaccard', () => {
  it('computes overlap and handles empties', () => {
    expect(jaccard(new Set(['a', 'b']), new Set(['b', 'c']))).toBeCloseTo(1 / 3)
    expect(jaccard(new Set(), new Set(['a']))).toBe(0)
  })
})

describe('titlesLookSame', () => {
  it('merges the ROADMAP pair', () => {
    expect(titlesLookSame('Fullstack Developer (ReactJS/NodeJS)', 'Full Stack Engineer React Node')).toBe(true)
  })
  it('does NOT merge short near-misses (the AlphaWay pair)', () => {
    expect(titlesLookSame('Fullstack Developer Leader', 'Fullstack AI Leader')).toBe(false)
  })
  it('merges identical short titles despite salary noise', () => {
    expect(titlesLookSame('Backend Developer (Node.js)', 'Lập Trình Viên Backend NodeJS - Lương 20 Triệu')).toBe(true)
  })
  it('does not merge different roles', () => {
    expect(titlesLookSame('Unity Game Developer', 'Backend Developer Node PostgreSQL')).toBe(false)
  })
})

describe('cityBuckets', () => {
  it('buckets Vietnamese city strings and keeps unknowns compatible', () => {
    expect(cityBuckets('Hồ Chí Minh; Hà Nội')).toEqual(['hn', 'hcm'])
    expect(citiesCompatible(['hn'], ['hn', 'hcm'])).toBe(true)
    expect(citiesCompatible(['hn'], ['hcm'])).toBe(false)
    expect(citiesCompatible([], ['hcm'])).toBe(true)
  })
})
