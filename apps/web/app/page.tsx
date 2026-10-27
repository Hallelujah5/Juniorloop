import { layViec } from '@/lib/data'
import { DanhSach } from '@/components/DanhSach'

type SP = Promise<Record<string, string | undefined>>

export default async function TrangChu({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const q = (sp.q ?? '').toLowerCase().trim()
  const nguon = sp.nguon ?? ''
  const hienSenior = sp.senior === '1'

  const tatCa = await layViec()
  const tins = tatCa.filter((t) => {
    if (!hienSenior && t.laSenior) return false
    if (nguon && t.nguon !== nguon) return false
    if (q) {
      const text = `${t.tieuDe} ${t.congTy} ${t.skills.join(' ')}`.toLowerCase()
      if (!q.split(/\s+/).every((tu) => text.includes(tu))) return false
    }
    return true
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: tins.slice(0, 20).map((t, i) => ({
      '@type': 'ListItem', position: i + 1, name: `${t.tieuDe} — ${t.congTy}`, url: t.url,
    })),
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="text-2xl font-bold tracking-tight">
        Việc IT cho junior — gom 3 trang, cập nhật mỗi 6 tiếng
      </h1>
      <p className="mt-1 text-sm text-stone-600">
        {tins.length} tin đang mở{!hienSenior && ' (đã ẩn tin senior/lead)'}. Khai{' '}
        <a href="/ho-so" className="underline">hồ sơ</a> để chấm điểm độ hợp ngay trên máy bạn.
      </p>

      <form method="GET" className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <input
          type="search" name="q" defaultValue={sp.q ?? ''} placeholder="từ khoá: react, nestjs, tên công ty…"
          className="w-64 rounded-lg border border-stone-300 bg-white px-3 py-2"
        />
        <select name="nguon" defaultValue={nguon} className="rounded-lg border border-stone-300 bg-white px-2 py-2">
          <option value="">Mọi nguồn</option>
          <option value="topdev">TopDev</option>
          <option value="itviec">ITviec</option>
          <option value="topcv">TopCV</option>
        </select>
        <label className="flex items-center gap-1.5 text-stone-600">
          <input type="checkbox" name="senior" value="1" defaultChecked={hienSenior} />
          hiện cả tin senior
        </label>
        <button className="rounded-lg bg-stone-900 px-4 py-2 font-medium text-white">Lọc</button>
      </form>

      <DanhSach tins={tins} />
    </div>
  )
}
