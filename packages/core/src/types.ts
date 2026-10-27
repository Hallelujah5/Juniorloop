/** Một tin việc ở dạng tối thiểu mà cả ingest lẫn web cùng hiểu. */
export type TinViec = {
  tieuDe: string
  congTy: string
  luong?: string | null
  diaDiem?: string | null
  skills?: string[] | null
}

/** Hồ sơ chấm điểm của người dùng — lưu localStorage phía client, không có PII. */
export type HoSo = {
  /** Stack chính: trúng từ nào +3 điểm/từ. */
  stackChinh: string[]
  /** Công nghệ phụ đã từng dùng: +1 điểm/từ. */
  stackPhu: string[]
  /** Cộng điểm cho tin có tín hiệu tiếng Anh / global / remote. */
  uuTienTiengAnh: boolean
}

export const HO_SO_MAC_DINH: HoSo = {
  stackChinh: ['typescript', 'react', 'nodejs', 'nestjs', 'postgresql'],
  stackPhu: ['nextjs', 'vuejs', 'django', 'php', 'mongodb', 'redis', 'aws', 'docker'],
  uuTienTiengAnh: true,
}
