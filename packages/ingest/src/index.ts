/**
 * CLI quét tin — chạy được cả GitHub Actions (nguồn API) lẫn máy cá nhân (nguồn HTML):
 *   pnpm quet -- --nguon topdev            # trên CI
 *   pnpm quet -- --nguon itviec,topcv      # trên máy cá nhân (schtasks)
 *   pnpm quet -- --tu-khoa nodejs,reactjs --cho 2
 * Tôn trọng kill-switch: nguồn có enabled_ingest=false trong DB sẽ bị bỏ qua.
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '.env') })

import { parseArgs } from 'node:util'
import { taoDb } from '@juniorloop/db'
import { NguonBiChan } from './http'
import { quetItviec } from './nguon/itviec'
import { quetTopcv } from './nguon/topcv'
import { quetTopdev } from './nguon/topdev'
import type { HamNguon } from './nguon/types'
import { ghiTin } from './upsert'

const NGUON: Record<string, HamNguon> = {
  topdev: quetTopdev,
  itviec: quetItviec,
  topcv: quetTopcv,
}

const { values: arg } = parseArgs({
  options: {
    nguon: { type: 'string', default: Object.keys(NGUON).join(',') },
    'tu-khoa': { type: 'string', default: 'nodejs,reactjs,typescript,fullstack' },
    cho: { type: 'string', default: '1.5' },
  },
})

async function goiRevalidate() {
  const url = process.env.REVALIDATE_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!url || !secret) return
  try {
    await fetch(`${url}/api/revalidate?secret=${encodeURIComponent(secret)}`, { method: 'POST' })
    console.log('[revalidate] đã gọi web làm mới cache')
  } catch (e) {
    console.log('[revalidate] lỗi (không chặn quét):', (e as Error).message)
  }
}

async function main() {
  const db = taoDb()
  const tuKhoa = arg['tu-khoa']!.split(',').map((s) => s.trim()).filter(Boolean)
  const choGiay = Number(arg.cho) || 1.5
  const yeuCau = arg.nguon!.split(',').map((s) => s.trim()).filter(Boolean)

  const batDuoc = await db
    .selectFrom('nguon')
    .select(['ma'])
    .where('enabled_ingest', '=', true)
    .where('ma', 'in', yeuCau)
    .execute()
  const chay = batDuoc.map((r) => r.ma).filter((m) => m in NGUON)
  const biTat = yeuCau.filter((m) => !chay.includes(m))
  if (biTat.length) console.log(`[kill-switch] bỏ qua nguồn bị tắt/không có: ${biTat.join(', ')}`)

  let loi = 0
  for (const ma of chay) {
    const batDau = new Date()
    try {
      const tins = await NGUON[ma]!(tuKhoa, choGiay)
      const { thay, moi } = await ghiTin(db, ma, tins)
      await db.insertInto('lan_quet').values({
        nguon: ma, started_at: batDau, finished_at: new Date(),
        trang_thai: 'ok', so_tin_thay: thay, so_tin_moi: moi, loi_text: null,
      }).execute()
      console.log(`[${ma}] ok — ${thay} tin, ${moi} mới`)
    } catch (e) {
      loi += 1
      const msg = e instanceof NguonBiChan ? e.message : String((e as Error).message)
      await db.insertInto('lan_quet').values({
        nguon: ma, started_at: batDau, finished_at: new Date(),
        trang_thai: 'loi', so_tin_thay: 0, so_tin_moi: 0, loi_text: msg.slice(0, 500),
      }).execute()
      console.error(`[${ma}] LỖI — ${msg}`)
    }
  }

  await goiRevalidate()
  await db.destroy()
  process.exit(loi === chay.length && chay.length > 0 ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
