import { revalidateTag } from 'next/cache'

/** Ingest gọi endpoint này khi quét xong → cache tag 'viec' làm mới ngay, không chờ TTL. */
export async function POST(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret')
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return new Response('sai hoặc thiếu secret', { status: 401 })
  }
  revalidateTag('viec')
  return Response.json({ ok: true, luc: new Date().toISOString() })
}
