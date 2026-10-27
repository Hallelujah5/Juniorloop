'use client'

import { useEffect, useState } from 'react'
import { HO_SO_MAC_DINH, type HoSo } from '@juniorloop/core'

export default function TrangHoSo() {
  const [chinh, setChinh] = useState('')
  const [phu, setPhu] = useState('')
  const [tiengAnh, setTiengAnh] = useState(true)
  const [daLuu, setDaLuu] = useState(false)

  useEffect(() => {
    let hs: HoSo = HO_SO_MAC_DINH
    try {
      const raw = localStorage.getItem('hoso')
      if (raw) hs = { ...HO_SO_MAC_DINH, ...JSON.parse(raw) }
    } catch { /* dùng mặc định */ }
    setChinh(hs.stackChinh.join(', '))
    setPhu(hs.stackPhu.join(', '))
    setTiengAnh(hs.uuTienTiengAnh)
  }, [])

  function luu(e: React.FormEvent) {
    e.preventDefault()
    const hs: HoSo = {
      stackChinh: chinh.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
      stackPhu: phu.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
      uuTienTiengAnh: tiengAnh,
    }
    try {
      localStorage.setItem('hoso', JSON.stringify(hs))
      setDaLuu(true)
      setTimeout(() => setDaLuu(false), 2500)
    } catch {
      // localStorage bị chặn (private mode) — hồ sơ chỉ sống trong phiên này
      setDaLuu(true)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Hồ sơ chấm điểm</h1>
      <p className="mt-2 text-sm text-stone-600">
        Hồ sơ này <strong>chỉ nằm trong trình duyệt của bạn</strong> (localStorage) — không
        có tài khoản, không gửi lên server. Điểm của mỗi tin được tính ngay trên máy:
        +3/kỹ năng chính, +1/kỹ năng phụ, +2 nếu tin nhắc junior/fresher, +2 nếu tin có
        tín hiệu tiếng Anh/global/remote (khi bạn bật ưu tiên), −3 nếu tin đòi 3+ năm
        kinh nghiệm.
      </p>

      <form onSubmit={luu} className="mt-6 space-y-5">
        <label className="block">
          <span className="text-sm font-medium">Kỹ năng chính (phân tách bằng dấu phẩy) — +3đ/kỹ năng</span>
          <input
            value={chinh} onChange={(e) => setChinh(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
            placeholder="typescript, react, nodejs"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Công nghệ phụ đã từng dùng — +1đ/kỹ năng</span>
          <input
            value={phu} onChange={(e) => setPhu(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
            placeholder="vuejs, django, aws"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={tiengAnh} onChange={(e) => setTiengAnh(e.target.checked)} />
          Ưu tiên môi trường tiếng Anh / global / remote (+2đ)
        </label>
        <div className="flex items-center gap-3">
          <button className="rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white">Lưu hồ sơ</button>
          {daLuu && <span className="text-sm text-emerald-700">Đã lưu — quay lại trang Việc mới để xem điểm.</span>}
        </div>
      </form>
    </div>
  )
}
