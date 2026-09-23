import { guard, json } from '@/lib/api'
import { getLiveStatus } from '@/lib/twitch'

/** Statut live Twitch (cache serveur 60 s). */
export async function GET(req: Request) {
  const blocked = guard(req, 'live', 30, 60_000)
  if (blocked) return blocked
  const live = await getLiveStatus().catch(() => ({ configured: false, channel: 'liratsu', isLive: false }))
  return json(live, 200, { 'Cache-Control': 'public, max-age=30' })
}
