import type { JobInput } from './types'
import { removeDiacritics } from './normalize'

/**
 * Crawl keywords are broad on purpose ("qa", "game", "cloud"), and the source
 * sites match them against every industry: factory QC, construction QA/QC,
 * game streamers, ad buyers, truck dispatch. A site called "IT jobs for juniors"
 * must not list those. This is a display filter like is_senior — flagged, never
 * deleted; a wrong flag costs one hidden job, a missing one costs trust.
 *
 * Title and skill tags only, never the company: a food company hiring an AI
 * engineer is a real IT job. Vietnamese tokens are deliberate — the postings
 * are written in Vietnamese; the English gloss sits beside each group.
 */
const OFFTOPIC_TOKENS = [
  // Manufacturing / lab / construction quality control (not software QA)
  'iqc', 'oqc', 'pqa', 'ipc', 'phong lab', 'hoa hoc', 'nha may', 'gia cong', 'san xuat',
  'thi cong', 'xay dung', 'co dien tu', 'tu dong hoa', 'tieu chuan', 'iso',
  'kiem soat chat luong', 'kiem soat khoi luong', 'chat luong san pham', 'sua chua',
  'production supervisor', 'lao dong pho thong', 'hvac',
  // Sales / marketing / customer service ("kinh doanh" = business/sales,
  // "tu van" = consultant-salesperson, "cham soc khach hang" = customer care)
  'kinh doanh', 'sale', 'sales', 'ban hang', 'tu van', 'cham soc khach hang', 'telesale',
  'marketing', 'quang cao', 'user acquisition', 'creative strategist', 'monetization',
  'presale', 'presales', 'business development', 'booking', 'market research',
  // Streaming / video / content production
  'streamer', 'livestream', 'live stream', 'content creator', 'video editor',
  'editor video', 'edit video', 'quay phim', 'dao cu', 'lego', 'khu vui choi',
  // Game operations and community (not game development)
  'game master', 'van hanh game', 'game operator', 'game operations', 'game operation',
  'liveops', 'live ops', 'van hanh content', 'van hanh the', 'cong dong', 'tieng trung',
  // Art and animation ("hoa si" = artist, "dien hoat" = animation)
  '2d artist', '3d artist', 'game artist', 'animator', 'hoa si', 'modeler',
  'sound designer', 'vfx artist', 'concept artist', 'dien hoat', 'graphic design',
  'thiet ke do hoa',
  // Logistics, language, finance, admin ("dinh phi" = actuarial pricing,
  // "phien dich"/"thong dich" = interpreter, "nhap lieu" = data entry)
  'logistics', 'trucking', 'transportation', 'van tai', 'supply chain', 'supplychain',
  'interpreter', 'phien dich', 'thong dich', 'comtor', 'dinh phi', 'ke toan',
  'nhan su', 'tuyen dung', 'hanh chinh', 'nhap lieu',
]

const REGEX_CACHE = new Map<string, RegExp>()
function hasToken(text: string, phrase: string): boolean {
  let re = REGEX_CACHE.get(phrase)
  if (!re) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    re = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`)
    REGEX_CACHE.set(phrase, re)
  }
  return re.test(text)
}

/** Does this posting belong to a non-IT role that a broad crawl keyword dragged in? */
export function isOffTopic(job: Pick<JobInput, 'title' | 'skills'>): boolean {
  const text = removeDiacritics(
    [job.title, ...(job.skills ?? [])].join(' '),
  ).replace(/[^a-z0-9+#. ]/g, ' ').replace(/\s+/g, ' ')
  return OFFTOPIC_TOKENS.some((tok) => hasToken(text, tok))
}
