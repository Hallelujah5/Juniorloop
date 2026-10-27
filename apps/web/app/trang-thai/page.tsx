import { layLanQuet } from '@/lib/data'

export const metadata = { title: 'Trạng thái quét' }

export default async function TrangThai() {
  const lanQuet = await layLanQuet()
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Trạng thái pipeline</h1>
      <p className="mt-1 text-sm text-stone-600">
        30 lượt quét gần nhất. Nguồn API chạy trên GitHub Actions mỗi 6 tiếng; nguồn HTML
        chạy từ máy cá nhân — có thể trễ hơn, và đó là chủ ý (xem nguyên tắc dữ liệu).
      </p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-3 py-2 font-medium">Lúc</th>
              <th className="px-3 py-2 font-medium">Nguồn</th>
              <th className="px-3 py-2 font-medium">Kết quả</th>
              <th className="px-3 py-2 font-medium tabular-nums">Tin thấy</th>
              <th className="px-3 py-2 font-medium tabular-nums">Tin mới</th>
              <th className="px-3 py-2 font-medium">Lỗi</th>
            </tr>
          </thead>
          <tbody>
            {lanQuet.map((l) => (
              <tr key={l.id} className="border-t border-stone-100">
                <td className="px-3 py-2 whitespace-nowrap">{new Date(l.batDau).toLocaleString('vi-VN')}</td>
                <td className="px-3 py-2">{l.nguon}</td>
                <td className="px-3 py-2">
                  <span className={l.trangThai === 'ok' ? 'text-emerald-700' : 'text-rose-700'}>
                    {l.trangThai === 'ok' ? '✓ ok' : '✕ lỗi'}
                  </span>
                </td>
                <td className="px-3 py-2 tabular-nums">{l.soTinThay}</td>
                <td className="px-3 py-2 tabular-nums">{l.soTinMoi}</td>
                <td className="px-3 py-2 max-w-xs truncate text-stone-500" title={l.loi ?? ''}>{l.loi ?? '—'}</td>
              </tr>
            ))}
            {lanQuet.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-stone-500">Chưa có lượt quét nào — chạy <code>pnpm quet</code>.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
