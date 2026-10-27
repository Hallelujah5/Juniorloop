/** HTTP lịch sự: UA rõ ràng, delay giữa request, circuit breaker khi bị chặn. */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 JuniorLoop/0.1 (+aggregator ca nhan; lien he trong README)'

export class NguonBiChan extends Error {
  constructor(nguon: string) {
    super(`Nguồn ${nguon} trả 403/429 liên tiếp — circuit breaker ngắt, dừng quét nguồn này.`)
  }
}

export function cho(giay: number): Promise<void> {
  return new Promise((r) => setTimeout(r, Math.max(1, giay) * 1000))
}

/** Đếm 403/429 liên tiếp theo nguồn; ≥3 là ngắt (tôn trọng tín hiệu chặn, không retry). */
export function taoFetcher(nguon: string) {
  let soLanChan = 0
  return async function tai(url: string, init?: RequestInit): Promise<string> {
    const res = await fetch(url, {
      ...init,
      headers: {
        'User-Agent': UA,
        'Accept-Language': 'vi,en;q=0.8',
        ...(init?.headers ?? {}),
      },
    })
    if (res.status === 403 || res.status === 429) {
      soLanChan += 1
      if (soLanChan >= 3) throw new NguonBiChan(nguon)
      throw new Error(`HTTP ${res.status} từ ${nguon}`)
    }
    soLanChan = 0
    if (!res.ok) throw new Error(`HTTP ${res.status} từ ${nguon}: ${url}`)
    return res.text()
  }
}
