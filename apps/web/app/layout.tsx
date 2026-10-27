import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'JuniorLoop — việc IT cho junior, gom một chỗ', template: '%s · JuniorLoop' },
  description:
    'Gom tin tuyển dụng IT từ TopDev, ITviec, TopCV mỗi 6 tiếng, lọc tin junior thật sự và chấm điểm độ hợp theo hồ sơ của bạn. Miễn phí, không quảng cáo.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <header className="border-b border-stone-200 bg-white">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Junior<span className="text-emerald-600">Loop</span>
            </Link>
            <div className="flex gap-4 text-sm text-stone-600">
              <Link href="/" className="hover:text-stone-900">Việc mới</Link>
              <Link href="/ho-so" className="hover:text-stone-900">Hồ sơ chấm điểm</Link>
              <Link href="/trang-thai" className="hover:text-stone-900">Trạng thái quét</Link>
              <Link href="/nguyen-tac" className="hover:text-stone-900">Nguyên tắc dữ liệu</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-stone-500">
          <p>
            Dữ liệu gom từ trang tìm kiếm công khai của TopDev, ITviec, TopCV — mỗi tin đều dẫn
            về trang gốc để ứng tuyển. Dự án phi thương mại, không quảng cáo.
          </p>
          <p className="mt-1">
            Bạn là chủ trang nguồn và muốn gỡ dữ liệu? Xem <Link href="/nguyen-tac" className="underline">nguyên tắc dữ liệu</Link> — chúng tôi tắt nguồn ngay khi được yêu cầu.
          </p>
        </footer>
      </body>
    </html>
  )
}
