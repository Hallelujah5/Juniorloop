/**
 * Client-only PDF text extraction. This module must ONLY be reached via a
 * dynamic import() from a user gesture — static imports would evaluate pdf.js
 * on the server (DOMMatrix crash) and put ~131 KB gzip into the page bundle.
 *
 * Choices (verified against pdfjs-dist 6.4.299 docs/releases, 2026-10-28):
 * - LEGACY build: the default build targets latest-evergreen browsers only;
 *   legacy reaches Chrome 125+/Safari 18. Older engines fail at import(),
 *   which the caller catches and routes to the paste box.
 * - Worker via new URL(..., import.meta.url): webpack emits a hashed asset,
 *   version-locked to the API (a /public copy drifts on upgrade and causes
 *   the classic "API version does not match Worker version").
 * - NO cMapUrl/standardFontDataUrl: a CDN fetch mid-parse would break the
 *   product's "watch the Network tab — nothing leaves" promise. CJK PDFs that
 *   need cMaps fall into the "no text found" path instead.
 * - v6 API: destroy() lives on the loading task, not the document proxy, and
 *   the old isEvalSupported hardening flag is GONE because the eval path
 *   itself was removed — safe-by-default now.
 */
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'

const workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

/** Warm the worker asset so going offline BEFORE parsing still works. */
export function prefetchWorker(): void {
  fetch(workerSrc).catch(() => {})
}

export async function extractPdfText(data: ArrayBuffer, maxPages = 20): Promise<string> {
  const task = pdfjs.getDocument({ data })
  try {
    const doc = await task.promise
    const pages = Math.min(doc.numPages, maxPages)
    const out: string[] = []
    for (let i = 1; i <= pages; i += 1) {
      const page = await doc.getPage(i)
      const tc = await page.getTextContent()
      out.push(tc.items.map((it) => ('str' in it ? it.str : '')).join(' '))
      page.cleanup()
    }
    return out.join('\n')
  } finally {
    await task.destroy()
  }
}
