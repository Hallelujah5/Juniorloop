/** Một tin thô vừa quét về, trước khi chuẩn hoá/ghi DB. */
export type TinThu = {
  nguonId: string
  url: string
  tieuDe: string
  congTy: string
  luong: string | null
  diaDiem: string | null
  skills: string[]
}

export type HamNguon = (tuKhoa: string[], choGiay: number) => Promise<TinThu[]>
