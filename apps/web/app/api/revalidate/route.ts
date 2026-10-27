import { revalidateTag } from 'next/cache'

/** Ingest calls this when a scan finishes → the 'jobs' cache tag refreshes immediately, no TTL wait. */
export async function POST(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret')
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return new Response('missing or wrong secret', { status: 401 })
  }
  revalidateTag('jobs')
  return Response.json({ ok: true, at: new Date().toISOString() })
}
