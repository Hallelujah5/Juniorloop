import { describe, expect, it } from 'vitest'
import { boDau, chuanHoaCongTy, chuanHoaTieuDe, hashTrung, laSenior } from '../src/chuanhoa'

describe('boDau', () => {
  it('bỏ dấu tiếng Việt và lowercase', () => {
    expect(boDau('Lập Trình Viên Đà Nẵng')).toBe('lap trinh vien da nang')
  })
})

describe('chuanHoaTieuDe', () => {
  it('bỏ ngoặc và ký tự lạ', () => {
    expect(chuanHoaTieuDe('Fullstack Developer (ReactJS/NodeJS) — Lương 20tr!')).toBe('fullstack developer luong 20tr')
  })
})

describe('chuanHoaCongTy', () => {
  it('bỏ hậu tố pháp nhân để blocking dedupe', () => {
    expect(chuanHoaCongTy('Công ty TNHH SETA International Việt Nam')).toBe('seta')
    expect(chuanHoaCongTy('NashTech Global JSC')).toBe('nashtech')
  })
  it('hai cách viết cùng một công ty cho cùng kết quả', () => {
    expect(chuanHoaCongTy('Toshiba Software Development Viet Nam Co., Ltd'))
      .toBe(chuanHoaCongTy('Công ty Toshiba Software Development Việt Nam'))
  })
})

describe('hashTrung', () => {
  it('ổn định với biến thể dấu/ngoặc', () => {
    expect(hashTrung('Fullstack Developer (React)', 'Công ty ABC')).toBe(
      hashTrung('Fullstack Developer', 'ABC JSC'),
    )
  })
})

describe('laSenior', () => {
  it('bắt đúng tin senior/lead', () => {
    expect(laSenior('Senior Fullstack Engineer')).toBe(true)
    expect(laSenior('Trưởng nhóm phát triển phần mềm')).toBe(true)
    expect(laSenior('Junior Fullstack Developer')).toBe(false)
  })
  it('không nhầm từ chứa chuỗi con', () => {
    expect(laSenior('Thực tập sinh Leadgen Marketing')).toBe(false)
  })
})
