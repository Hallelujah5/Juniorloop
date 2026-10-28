import { describe, expect, it } from 'vitest'
import { translateMaskedSalary } from '../src/salary'

// Inputs are real salary_raw values observed in the production DB (TopDev
// masks digits for anonymous viewers; other sources never star anything).
describe('translateMaskedSalary', () => {
  it('translates a two-sided masked VND range', () => {
    expect(translateMaskedSalary('1******* - 2******* VND')).toBe('~10–30M VND')
    expect(translateMaskedSalary('8****** - 1******* VND')).toBe('~8–20M VND')
    expect(translateMaskedSalary('3******* - 4******* VND')).toBe('~30–50M VND')
  })

  it('translates "Lên tới" (up to) with a single masked figure', () => {
    expect(translateMaskedSalary('Lên tới 2******* VND')).toBe('up to ~20–30M VND')
    expect(translateMaskedSalary('Lên tới 4******* VND')).toBe('up to ~40–50M VND')
  })

  it('translates "Từ" (from) with a single masked figure', () => {
    expect(translateMaskedSalary('Từ 1******* VND')).toBe('from ~10–20M VND')
  })

  it('translates masked USD ranges with thousands separators', () => {
    expect(translateMaskedSalary('1*** - 2*** USD')).toBe('~$1,000–3,000')
    expect(translateMaskedSalary('Lên tới 3*** USD')).toBe('up to ~$3,000–4,000')
  })

  it('keeps non-million-aligned bounds readable with one decimal', () => {
    // "15******" = 15,000,000–16,000,000 → clean; "2.5"-style only when needed
    expect(translateMaskedSalary('15****** - 2******* VND')).toBe('~15–30M VND')
  })

  it('returns null for everything it cannot bound honestly', () => {
    expect(translateMaskedSalary('Thoả thuận')).toBeNull() // no mask at all
    expect(translateMaskedSalary('*** VND')).toBeNull() // no leading digit
    expect(translateMaskedSalary('1*** - 2*** - 3*** VND')).toBeNull() // 3 numbers
    expect(translateMaskedSalary('9**** VND')).toBeNull() // < 1M VND
  })

  it('never fires on unmasked salaries other sources publish', () => {
    expect(translateMaskedSalary('Tới 20 triệu')).toBeNull()
    expect(translateMaskedSalary('15 - 20 triệu')).toBeNull()
  })
})
