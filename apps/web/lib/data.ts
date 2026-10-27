import { unstable_cache } from 'next/cache'
import { db } from './db'

export type TinHienThi = {
  id: number
  nguon: string
  nguonTen: string
  url: string
  tieuDe: string
  congTy: string
  luong: string | null
  diaDiem: string | null
  skills: string[]
  laSenior: boolean
  lastSeen: string
}

/**
 * Một cache entry duy nhất cho toàn bộ tin đang mở (≤1000 dòng) — lọc theo filter
 * làm in-memory ở server component. DB chỉ bị đánh thức khi ingest gọi revalidate
 * hoặc hết hạn 30 phút → nằm xa trần compute của Neon free.
 */
export const layViec = unstable_cache(
  async (): Promise<TinHienThi[]> => {
    const rows = await db
      .selectFrom('viec')
      .innerJoin('nguon', 'nguon.ma', 'viec.nguon')
      .select([
        'viec.id', 'viec.nguon', 'nguon.ten as nguon_ten', 'viec.url',
        'viec.tieu_de_raw', 'viec.cong_ty_raw', 'viec.luong_raw',
        'viec.dia_diem', 'viec.skills', 'viec.la_senior', 'viec.last_seen_at',
      ])
      .where('viec.trang_thai', '=', 'mo')
      .where('nguon.enabled_hien_thi', '=', true)
      .orderBy('viec.last_seen_at', 'desc')
      .limit(1000)
      .execute()
    return rows.map((r) => ({
      id: r.id,
      nguon: r.nguon,
      nguonTen: r.nguon_ten,
      url: r.url,
      tieuDe: r.tieu_de_raw,
      congTy: r.cong_ty_raw,
      luong: r.luong_raw,
      diaDiem: r.dia_diem,
      skills: r.skills,
      laSenior: r.la_senior,
      lastSeen: r.last_seen_at.toISOString(),
    }))
  },
  ['viec-mo'],
  { tags: ['viec'], revalidate: 1800 },
)

export type LanQuetHienThi = {
  id: number
  nguon: string
  batDau: string
  trangThai: string
  soTinThay: number
  soTinMoi: number
  loi: string | null
}

export const layLanQuet = unstable_cache(
  async (): Promise<LanQuetHienThi[]> => {
    const rows = await db
      .selectFrom('lan_quet')
      .selectAll()
      .orderBy('started_at', 'desc')
      .limit(30)
      .execute()
    return rows.map((r) => ({
      id: r.id,
      nguon: r.nguon,
      batDau: r.started_at.toISOString(),
      trangThai: r.trang_thai,
      soTinThay: r.so_tin_thay,
      soTinMoi: r.so_tin_moi,
      loi: r.loi_text,
    }))
  },
  ['lan-quet'],
  { tags: ['viec'], revalidate: 1800 },
)
