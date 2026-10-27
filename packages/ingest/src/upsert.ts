import { chuanHoaCongTy, chuanHoaTieuDe, laSenior } from '@juniorloop/core'
import type { Db } from '@juniorloop/db'
import type { TinThu } from './nguon/types'

/** Upsert theo (nguon, nguon_id); tin thấy lại thì cập nhật last_seen và MỞ lại. */
export async function ghiTin(
  db: Db,
  nguon: string,
  tins: TinThu[],
): Promise<{ thay: number; moi: number }> {
  if (tins.length === 0) return { thay: 0, moi: 0 }

  const daCo = new Set(
    (
      await db
        .selectFrom('viec')
        .select('nguon_id')
        .where('nguon', '=', nguon)
        .where('nguon_id', 'in', tins.map((t) => t.nguonId))
        .execute()
    ).map((r) => r.nguon_id),
  )

  const gio = new Date()
  for (const t of tins) {
    if (!t.tieuDe) continue
    const hang = {
      nguon,
      nguon_id: t.nguonId,
      url: t.url,
      tieu_de_raw: t.tieuDe,
      tieu_de_chuan: chuanHoaTieuDe(t.tieuDe),
      cong_ty_raw: t.congTy,
      cong_ty_chuan: chuanHoaCongTy(t.congTy),
      luong_raw: t.luong,
      dia_diem: t.diaDiem,
      skills: t.skills,
      la_senior: laSenior(t.tieuDe),
      trang_thai: 'mo' as const,
      last_seen_at: gio,
    }
    await db
      .insertInto('viec')
      .values(hang)
      .onConflict((oc) =>
        oc.columns(['nguon', 'nguon_id']).doUpdateSet({
          url: hang.url,
          tieu_de_raw: hang.tieu_de_raw,
          tieu_de_chuan: hang.tieu_de_chuan,
          cong_ty_raw: hang.cong_ty_raw,
          cong_ty_chuan: hang.cong_ty_chuan,
          luong_raw: hang.luong_raw,
          dia_diem: hang.dia_diem,
          skills: hang.skills,
          la_senior: hang.la_senior,
          trang_thai: 'mo', // thấy lại → mở lại, giữ first_seen_at
          last_seen_at: gio,
        }),
      )
      .execute()
  }
  return { thay: tins.length, moi: tins.filter((t) => !daCo.has(t.nguonId)).length }
}
