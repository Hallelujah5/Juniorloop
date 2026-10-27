import { describe, expect, it } from 'vitest'
import { dedupeHash, isSenior, normalizeCompany, normalizeTitle, removeDiacritics } from '../src/normalize'

describe('removeDiacritics', () => {
  it('strips Vietnamese diacritics and lowercases', () => {
    expect(removeDiacritics('Lập Trình Viên Đà Nẵng')).toBe('lap trinh vien da nang')
  })
})

describe('normalizeTitle', () => {
  it('drops bracketed text and odd characters', () => {
    expect(normalizeTitle('Fullstack Developer (ReactJS/NodeJS) — Lương 20tr!')).toBe('fullstack developer luong 20tr')
  })
})

describe('normalizeCompany', () => {
  it('strips legal-entity suffixes for dedupe blocking', () => {
    expect(normalizeCompany('Công ty TNHH SETA International Việt Nam')).toBe('seta')
    expect(normalizeCompany('NashTech Global JSC')).toBe('nashtech')
  })
  it('two spellings of one company normalize identically', () => {
    expect(normalizeCompany('Toshiba Software Development Viet Nam Co., Ltd'))
      .toBe(normalizeCompany('Công ty Toshiba Software Development Việt Nam'))
  })
})

describe('dedupeHash', () => {
  it('is stable across diacritics/bracket variants', () => {
    expect(dedupeHash('Fullstack Developer (React)', 'Công ty ABC')).toBe(
      dedupeHash('Fullstack Developer', 'ABC JSC'),
    )
  })
})

describe('isSenior', () => {
  it('catches senior/lead titles, Vietnamese included', () => {
    expect(isSenior('Senior Fullstack Engineer')).toBe(true)
    expect(isSenior('Trưởng nhóm phát triển phần mềm')).toBe(true)
    expect(isSenior('Fullstack Developer Leader')).toBe(true)
    expect(isSenior('Junior Fullstack Developer')).toBe(false)
  })
  it('sees senior markers inside brackets (normalizeTitle would strip them)', () => {
    expect(isSenior('Database Administrator (Senior)')).toBe(true)
  })
  it('does not match substrings inside other words', () => {
    expect(isSenior('Thực tập sinh Leadgen Marketing')).toBe(false)
  })
})
