import type { HoSo, TinViec } from './types'
import { boDau } from './chuanhoa'

/** Các cụm đồng nghĩa: khai hồ sơ 1 từ, khớp được mọi cách viết trong tin. */
const DONG_NGHIA: Record<string, string[]> = {
  typescript: ['typescript', ' ts '],
  react: ['react', 'reactjs', 'react.js'],
  nodejs: ['nodejs', 'node.js', ' node '],
  nestjs: ['nestjs', 'nest.js'],
  postgresql: ['postgresql', 'postgres'],
  nextjs: ['nextjs', 'next.js'],
  vuejs: ['vuejs', 'vue.js', ' vue '],
  django: ['django'],
  php: ['php', 'laravel'],
  mongodb: ['mongodb', 'mongo'],
  redis: ['redis'],
  aws: ['aws', 'amazon web services', 'lambda', 'dynamodb'],
  docker: ['docker'],
}

const TIN_HIEU_JUNIOR = ['junior', 'fresher', 'graduate', 'intern', '0-1', '0 - 1']
const TIN_HIEU_TIENG_ANH = ['english', 'tieng anh', 'global', 'remote', 'australia', 'singapore', 'europe', 'chau au', ' uk ', ' us ']
const TIN_HIEU_NANG = ['5+ years', '4+ years', '3+ years', '5 nam kinh nghiem', '4 nam kinh nghiem', '3 nam kinh nghiem']

function khop(text: string, tu: string): boolean {
  const bienThe = DONG_NGHIA[tu] ?? [tu]
  return bienThe.some((b) => text.includes(b.trim().length < b.length ? b : b.trim()))
}

/**
 * Chấm điểm độ hợp của một tin với hồ sơ. Thuần, chạy được cả server lẫn client.
 * +3/từ stack chính, +1/từ công nghệ phụ, +2 tín hiệu junior, +2 tín hiệu tiếng Anh
 * (nếu hồ sơ bật), −3 tín hiệu đòi nhiều năm kinh nghiệm.
 */
export function chamDiem(tin: TinViec, hoSo: HoSo): number {
  const text = ' ' + boDau([tin.tieuDe, tin.congTy, tin.luong ?? '', tin.diaDiem ?? '', (tin.skills ?? []).join(' ')].join(' ')) + ' '
  let diem = 0
  for (const tu of hoSo.stackChinh) if (khop(text, boDau(tu))) diem += 3
  for (const tu of hoSo.stackPhu) if (khop(text, boDau(tu))) diem += 1
  if (TIN_HIEU_JUNIOR.some((t) => text.includes(t))) diem += 2
  if (hoSo.uuTienTiengAnh && TIN_HIEU_TIENG_ANH.some((t) => text.includes(t))) diem += 2
  if (TIN_HIEU_NANG.some((t) => text.includes(t))) diem -= 3
  return diem
}
