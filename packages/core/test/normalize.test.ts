import { describe, expect, it } from 'vitest'
import { minYearsFromExperiences } from '../src/normalize'

describe('experience gate (0–1y audience)', () => {
  it('parses TopDev experiences_str into minimum years', () => {
    expect(minYearsFromExperiences('2 năm, 5 năm')).toBe(2)
    expect(minYearsFromExperiences('1 năm, 3 năm')).toBe(1)
    expect(minYearsFromExperiences('Chưa có kinh nghiệm')).toBe(0)
    expect(minYearsFromExperiences('')).toBeNull()
    expect(minYearsFromExperiences(null)).toBeNull()
    expect(minYearsFromExperiences(undefined)).toBeNull()
  })
})
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
  it('catches Vietnamese seniority words and the Mid/Sen shorthand', () => {
    expect(isSenior('Chuyên viên Cao cấp QA')).toBe(true)
    expect(isSenior('Chuyên Gia Kiểm Thử & Đánh Giá An Ninh (Pentest)')).toBe(true)
    expect(isSenior('Kiến trúc sư giải pháp CNTT')).toBe(true)
    expect(isSenior('Data Governance Expert')).toBe(true)
    expect(isSenior('Mid/Sen Backend Developer (Java/Spring Boot)')).toBe(true)
    expect(isSenior('Data Engineer (Sen/Lead)')).toBe(true)
    expect(isSenior('Teamlead Cloud')).toBe(true)
  })
  it('flags a demanded minimum of 2+ years, in either language', () => {
    expect(isSenior('Lập Trình Viên Fullstack-Từ 3 Năm KN - Onsite Bank')).toBe(true)
    expect(isSenior('Mobile Game Developer Fullstack 5EXP Java, C++, C#')).toBe(true)
    expect(isSenior('Backend Developer (3+ years)')).toBe(true)
    expect(isSenior('Fullstack Developer (2 năm kinh nghiệm)')).toBe(true)
    expect(isSenior('Backend Developer (2+ years)')).toBe(true)
    expect(isSenior('Java Developer (Từ 1 - 2 Năm Kinh Nghiệm)')).toBe(false) // lower bound 1 — reachable
    expect(isSenior('Fresher Developer (1-3 năm)')).toBe(false)
    expect(isSenior('DevSecOps Engineer (2025TD946)')).toBe(false)
  })
  it('trusts the source’s structured minimum years over a clean title', () => {
    expect(isSenior('AI Full Stack Engineer', 2)).toBe(true)
    expect(isSenior('AI Full Stack Engineer', 1)).toBe(false)
    expect(isSenior('AI Full Stack Engineer', 0)).toBe(false)
    expect(isSenior('AI Full Stack Engineer', null)).toBe(false)
  })
})
