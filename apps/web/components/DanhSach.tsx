'use client'

import { useEffect, useState } from 'react'
import { chamDiem, HO_SO_MAC_DINH, type HoSo } from '@juniorloop/core'
import type { TinHienThi } from '@/lib/data'

const TEN_NGUON: Record<string, string> = { topdev: 'TopDev', itviec: 'ITviec', topcv: 'TopCV' }

function docHoSo(): HoSo {
  try {
    const raw = localStorage.getItem('hoso')
    if (raw) return { ...HO_SO_MAC_DINH, ...JSON.parse(raw) }
  } catch { /* private mode / data bị chặn — dùng mặc định */ }
  return HO_SO_MAC_DINH
}

function baoLau(iso: string): string {
  const gio = Math.floor((Date.now() - new Date(iso).getTime()) / 3600_000)
  if (gio < 1) return 'vừa cập nhật'
  if (gio < 24) return `${gio} giờ trước`
  return `${Math.floor(gio / 24)} ngày trước`
}

/** Chấm điểm sau mount (hồ sơ nằm ở localStorage) — server render thứ tự mới nhất. */
export function DanhSach({ tins }: { tins: TinHienThi[] }) {
  const [hoSo, setHoSo] = useState<HoSo | null>(null)
  const [sapXep, setSapXep] = useState<'moi' | 'diem'>('moi')
  useEffect(() => setHoSo(docHoSo()), [])

  const coDiem = hoSo
    ? tins.map((t) => ({
        ...t,
        diem: chamDiem(
          { tieuDe: t.tieuDe, congTy: t.congTy, luong: t.luong, diaDiem: t.diaDiem, skills: t.skills },
          hoSo,
        ),
      }))
    : tins.map((t) => ({ ...t, diem: null as number | null }))

  const hienThi = sapXep === 'diem' && hoSo
    ? [...coDiem].sort((a, b) => (b.diem ?? 0) - (a.diem ?? 0))
    : coDiem

  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center gap-2 text-sm">
        <span className="text-stone-500">Sắp xếp:</span>
        <button
          onClick={() => setSapXep('moi')}
          className={`rounded-full px-3 py-1 ${sapXep === 'moi' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-300'}`}
        >
          Mới nhất
        </button>
        <button
          onClick={() => setSapXep('diem')}
          disabled={!hoSo}
          className={`rounded-full px-3 py-1 ${sapXep === 'diem' ? 'bg-emerald-600 text-white' : 'bg-white border border-stone-300'}`}
        >
          Hợp hồ sơ nhất
        </button>
      </div>

      {hienThi.length === 0 && (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">
          Chưa có tin nào khớp bộ lọc. Thử bỏ bớt từ khoá, hoặc chờ lượt quét kế tiếp.
        </p>
      )}

      <ul className="space-y-2.5">
        {hienThi.map((t) => (
          <li key={`${t.nguon}-${t.id}`} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <a href={t.url} target="_blank" rel="nofollow noopener" className="font-semibold hover:underline">
                  {t.tieuDe} <span aria-hidden>↗</span>
                </a>
                <p className="mt-0.5 text-sm text-stone-600">{t.congTy}</p>
              </div>
              {t.diem !== null && (
                <span
                  title="Điểm hợp hồ sơ của bạn — tính ngay trên máy, không gửi đi đâu"
                  className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums ${
                    t.diem >= 8 ? 'bg-emerald-100 text-emerald-800'
                    : t.diem >= 4 ? 'bg-amber-100 text-amber-800'
                    : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {t.diem} đ
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
              <span className="rounded bg-stone-100 px-1.5 py-0.5 font-medium">{TEN_NGUON[t.nguon] ?? t.nguon}</span>
              {t.luong && <span className="text-emerald-700 font-medium">{t.luong}</span>}
              {t.diaDiem && <span>{t.diaDiem}</span>}
              <span>{baoLau(t.lastSeen)}</span>
              {t.laSenior && <span className="rounded bg-rose-50 px-1.5 py-0.5 text-rose-700">senior</span>}
            </div>
            {t.skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {t.skills.slice(0, 8).map((s) => (
                  <span key={s} className="rounded-full border border-stone-200 px-2 py-0.5 text-xs text-stone-600">{s}</span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
