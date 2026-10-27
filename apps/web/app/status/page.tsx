import { getCrawledTracks, getScanRuns } from '@/lib/data'

export const metadata = { title: 'Pipeline status' }

function since(iso: string | null): string {
  if (!iso) return 'never'
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3600_000)
  if (hours < 1) return 'under an hour ago'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default async function StatusPage() {
  const [runs, tracks] = await Promise.all([getScanRuns(), getCrawledTracks()])
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Pipeline status</h1>
      <p className="mt-1 text-sm text-stone-600">
        One keyword track is scanned per run, least-recently-scanned first — coverage
        grows without growing request volume. API sources run on GitHub Actions every
        6 hours; HTML sources run from a residential machine and can lag — deliberately
        (see data principles).
      </p>

      <h2 className="mt-5 text-sm font-semibold text-stone-700">Crawled tracks</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {tracks.map((t) => (
          <span key={t.track} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600">
            <span className="font-semibold text-stone-800">{t.track}</span>{' '}
            ({t.keywords.join(', ')}) · {since(t.lastScanned)}
          </span>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Track</th>
              <th className="px-3 py-2 font-medium">Result</th>
              <th className="px-3 py-2 font-medium tabular-nums">Seen</th>
              <th className="px-3 py-2 font-medium tabular-nums">New</th>
              <th className="px-3 py-2 font-medium">Error</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id} className="border-t border-stone-100">
                <td className="px-3 py-2 whitespace-nowrap">{new Date(r.startedAt).toLocaleString('en-GB')}</td>
                <td className="px-3 py-2">{r.source}</td>
                <td className="px-3 py-2">{r.track ?? '—'}</td>
                <td className="px-3 py-2">
                  <span className={r.status === 'ok' ? 'text-emerald-700' : 'text-rose-700'}>
                    {r.status === 'ok' ? '✓ ok' : '✕ error'}
                  </span>
                </td>
                <td className="px-3 py-2 tabular-nums">{r.jobsSeen}</td>
                <td className="px-3 py-2 tabular-nums">{r.jobsNew}</td>
                <td className="px-3 py-2 max-w-xs truncate text-stone-500" title={r.error ?? ''}>{r.error ?? '—'}</td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-stone-500">No scans yet — run <code>pnpm scan</code>.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
