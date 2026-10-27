import { describe, expect, it } from 'vitest'
import { chamDiem } from '../src/chamdiem'
import { HO_SO_MAC_DINH } from '../src/types'

const tinKhop = {
  tieuDe: 'Junior Fullstack Developer (ReactJS, NestJS, PostgreSQL)',
  congTy: 'SETA International',
  luong: '15-20 triệu',
  diaDiem: 'Hà Nội',
  skills: ['ReactJS', 'NestJS', 'PostgreSQL', 'English'],
}

const tinLech = {
  tieuDe: 'Embedded Engineer (C/C++) 5+ years',
  congTy: 'ABC Corp',
  luong: null,
  diaDiem: 'Hà Nội',
  skills: ['C++', 'RTOS'],
}

describe('chamDiem', () => {
  it('tin khớp stack + junior + tiếng Anh được điểm cao', () => {
    expect(chamDiem(tinKhop, HO_SO_MAC_DINH)).toBeGreaterThanOrEqual(10)
  })
  it('tin lệch stack và đòi 5+ năm bị điểm thấp', () => {
    expect(chamDiem(tinLech, HO_SO_MAC_DINH)).toBeLessThan(3)
  })
  it('tắt ưu tiên tiếng Anh thì điểm giảm đúng 2', () => {
    const co = chamDiem(tinKhop, HO_SO_MAC_DINH)
    const khong = chamDiem(tinKhop, { ...HO_SO_MAC_DINH, uuTienTiengAnh: false })
    expect(co - khong).toBe(2)
  })
  it('đồng nghĩa: hồ sơ ghi react vẫn khớp tin ghi ReactJS', () => {
    const hoSo = { stackChinh: ['react'], stackPhu: [], uuTienTiengAnh: false }
    expect(chamDiem({ tieuDe: 'ReactJS Developer', congTy: 'X' }, hoSo)).toBeGreaterThanOrEqual(3)
  })
})
