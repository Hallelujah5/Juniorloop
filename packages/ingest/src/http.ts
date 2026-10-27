/** Polite HTTP: explicit UA, delays between requests, circuit breaker when blocked. */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 JuniorLoop/0.1 (+personal aggregator; contact in README)'

export class SourceBlocked extends Error {
  constructor(source: string) {
    super(`Source ${source} returned 403/429 repeatedly — circuit breaker tripped, stopping this source.`)
  }
}

export function sleep(seconds: number): Promise<void> {
  return new Promise((r) => setTimeout(r, Math.max(1, seconds) * 1000))
}

/** Counts consecutive 403/429 per source; trips at 3 (respect the block, never retry through it). */
export function createFetcher(source: string) {
  let blockedCount = 0
  return async function fetchText(url: string, init?: RequestInit): Promise<string> {
    const res = await fetch(url, {
      ...init,
      headers: {
        'User-Agent': UA,
        'Accept-Language': 'vi,en;q=0.8',
        ...(init?.headers ?? {}),
      },
    })
    if (res.status === 403 || res.status === 429) {
      blockedCount += 1
      if (blockedCount >= 3) throw new SourceBlocked(source)
      throw new Error(`HTTP ${res.status} from ${source}`)
    }
    blockedCount = 0
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${source}: ${url}`)
    return res.text()
  }
}
