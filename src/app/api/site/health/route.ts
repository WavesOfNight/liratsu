import { getPayloadClient } from '@/lib/payload'

/** Sonde de santé (utilisée par deploy.sh après chaque mise en production). */
export async function GET() {
  try {
    const payload = await getPayloadClient()
    await payload.count({ collection: 'users' })
    return Response.json({ ok: true, time: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ ok: false }, { status: 503 })
  }
}
