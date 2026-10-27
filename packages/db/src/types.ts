import type { Generated } from 'kysely'

/** Danh mục nguồn + kill-switch: một câu UPDATE là nguồn biến mất, không cần deploy. */
export interface NguonTable {
  ma: string
  ten: string
  enabled_ingest: boolean
  enabled_hien_thi: boolean
  ghi_chu: string | null
}

export interface ViecTable {
  id: Generated<number>
  nguon: string
  /** Id bên trang nguồn — key chống trùng trong-nguồn là UNIQUE(nguon, nguon_id). */
  nguon_id: string
  url: string
  tieu_de_raw: string
  tieu_de_chuan: string
  cong_ty_raw: string
  cong_ty_chuan: string
  luong_raw: string | null
  dia_diem: string | null
  skills: string[]
  /** Gắn cờ thay vì xoá — "chỉ junior" là tính năng lọc, không phải mất dữ liệu. */
  la_senior: boolean
  trang_thai: 'mo' | 'het_han' | 'an'
  first_seen_at: Generated<Date>
  last_seen_at: Date
  /** Nhóm tin trùng cross-source (tuần 3) — không merge phá huỷ. */
  nhom_trung: number | null
}

export interface LanQuetTable {
  id: Generated<number>
  nguon: string
  started_at: Date
  finished_at: Date | null
  trang_thai: 'ok' | 'loi'
  so_tin_thay: number
  so_tin_moi: number
  loi_text: string | null
}

export interface DB {
  nguon: NguonTable
  viec: ViecTable
  lan_quet: LanQuetTable
}
