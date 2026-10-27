/** Bỏ dấu tiếng Việt + lowercase: "Lập Trình Viên" -> "lap trinh vien". */
export function boDau(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
}

/** Chuẩn hoá tiêu đề để so sánh: bỏ dấu, bỏ nội dung trong ngoặc, bỏ ký tự lạ. */
export function chuanHoaTieuDe(s: string): string {
  return boDau(s)
    .replace(/[([{].*?[)\]}]/g, ' ')
    .replace(/[^a-z0-9+#. ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const HAU_TO_CONG_TY = [
  'cong ty co phan', 'cong ty tnhh', 'cong ty', 'cty',
  'joint stock company', 'jsc', 'co., ltd', 'co.,ltd', 'co ltd', 'ltd',
  'company limited', 'company', 'corporation', 'corp', 'inc',
  'viet nam', 'vietnam', 'vn', 'global', 'international', 'software', 'technology', 'tech',
]

/** Chuẩn hoá tên công ty để blocking khi dedupe: bỏ dấu + bỏ hậu tố pháp nhân. */
export function chuanHoaCongTy(s: string): string {
  let t = ' ' + boDau(s).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim() + ' '
  let doi = true
  while (doi) {
    doi = false
    for (const h of HAU_TO_CONG_TY) {
      if (t.startsWith(' ' + h + ' ')) { t = ' ' + t.slice(h.length + 2); doi = true }
      if (t.endsWith(' ' + h + ' ')) { t = t.slice(0, -(h.length + 1)); doi = true }
    }
  }
  return t.trim()
}

/** FNV-1a 32-bit — không cần mật mã học, chỉ cần ổn định và chạy được cả client. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/** Hash để nhận diện tin trùng thô (cùng nguồn khác id, hoặc tiền xử lý cross-source). */
export function hashTrung(tieuDe: string, congTy: string): string {
  const khoa = chuanHoaTieuDe(tieuDe) + '|' + chuanHoaCongTy(congTy)
  const nguoc = [...khoa].reverse().join('')
  return fnv1a(khoa).toString(16).padStart(8, '0') + fnv1a(nguoc).toString(16).padStart(8, '0')
}

const TU_SENIOR = [
  'senior', 'sr.', 'sr ', 'lead', 'principal', 'architect', 'head of', 'director',
  'manager', 'cto', 'truong phong', 'truong nhom', 'quan ly',
]

/** Tin dành cho người nhiều kinh nghiệm? Gắn cờ (KHÔNG xoá) — mặc định ẩn ở query. */
export function laSenior(tieuDe: string): boolean {
  const t = ' ' + chuanHoaTieuDe(tieuDe) + ' '
  return TU_SENIOR.some((tu) => t.includes(tu.endsWith(' ') || tu.endsWith('.') ? ' ' + tu : ' ' + tu + ' '))
}
