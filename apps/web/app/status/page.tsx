import { getScanRuns } from '@/lib/data'

export const metadata = { title: 'Pipeline status' }

export default async function StatusPage() {
  const runs = await getScanRuns()
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Pipeline status</h1>
      <p className="mt-1 text-sm text-stone-600">
        Last 30 scan runs. API sources run on GitHub Actions every 6 hours; HTML sources
        run from a residential machine — they can lag, and that is deliberate (see data
        principles).
      </p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Source</th>
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
              <tr><td colSpan={6} className="px-3 py-6 text-center text-stone-500">No scans yet — run <code>pnpm scan</code>.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
