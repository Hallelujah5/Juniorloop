'use client'

import { useRef, useState } from 'react'
import { extractProfile, type ExtractedProfile } from '@juniorloop/core'

const MAX_FILE_MB = 15

/**
 * CV → draft profile, entirely in this tab. Two paths, one funnel:
 * - PDF file: lazy pdf.js (imported only on interaction; worker prefetched on
 *   hover so offline parsing genuinely works). Every failure mode routes to…
 * - Paste box: the universal fallback (DOCX users, scanned PDFs, old
 *   browsers). UNCONTROLLED textarea — a controlled one re-renders per
 *   keystroke of a 2 MB paste.
 * Nothing here is uploaded or stored; the parent form saves only the 3-field
 * profile the user confirms.
 */
export function CvUpload({ onDraft }: { onDraft: (p: ExtractedProfile) => void }) {
  const textRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const prefetched = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function prefetchPdf() {
    if (prefetched.current) return
    prefetched.current = true
    import('@/lib/pdf-text')
      .then((m) => m.prefetchWorker())
      .catch(() => { prefetched.current = false })
  }

  function buildFromText(text: string) {
    if (text.trim().length < 40) {
      setError('Paste a bit more of your CV first — a few lines at least.')
      return
    }
    setError('')
    onDraft(extractProfile(text))
  }

  async function onFile(file: File) {
    setError('')
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError("That doesn't look like a PDF — paste your CV text below instead.")
      return
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File is over ${MAX_FILE_MB} MB — paste your CV text below instead.`)
      return
    }
    setBusy(true)
    try {
      let mod: typeof import('@/lib/pdf-text')
      try {
        mod = await import('@/lib/pdf-text')
      } catch {
        setError("Your browser can't run the PDF reader — paste your CV text below instead.")
        return
      }
      const text = await mod.extractPdfText(await file.arrayBuffer())
      if (text.replace(/\s+/g, ' ').trim().length < 120) {
        setError('No readable text found — looks like a scanned/photo PDF. Paste your CV text below instead.')
        return
      }
      onDraft(extractProfile(text))
    } catch (e) {
      const name = String((e as Error)?.name ?? e)
      setError(/password/i.test(name)
        ? 'This PDF is password-protected — remove the password, or paste your CV text below.'
        : 'Could not read that PDF — paste your CV text below instead.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4">
      <h2 className="text-sm font-semibold">Build your profile from your CV</h2>
      <p className="mt-1 text-xs text-stone-500">
        Your CV is read by code running in this tab — the file is never uploaded. Don't
        take our word for it: open DevTools → Network while it parses, or go offline
        first; parsing still works. We keep only the skill list you save, in your
        browser's localStorage.
      </p>

      <label
        onPointerEnter={prefetchPdf}
        onFocus={prefetchPdf}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files?.[0]
          if (f && !busy) void onFile(f)
        }}
        className={`mt-3 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-sm ${
          busy ? 'border-stone-200 text-stone-400' : 'border-stone-300 text-stone-600 hover:border-stone-500'
        }`}
      >
        <input
          ref={fileRef}
          id="cv-file"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onFile(f)
          }}
        />
        {busy ? 'Reading your CV…' : 'Drop your CV PDF here, or click to choose a file'}
      </label>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-stone-500">…or paste your CV text</summary>
        <textarea
          ref={textRef}
          id="cv-paste"
          rows={6}
          placeholder={'Paste your CV text here…\n(Word/DOCX users: open the file, Ctrl+A, Ctrl+C, paste.)'}
          className="mt-2 w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => buildFromText(textRef.current?.value ?? '')}
          className="mt-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Build my profile
        </button>
      </details>

      {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
    </section>
  )
}
