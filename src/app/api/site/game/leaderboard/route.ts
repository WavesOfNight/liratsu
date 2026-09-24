import type { Where } from 'payload'
import { dailySeed } from '@/game/ratsu/rng'
import { guard, json } from '@/lib/api'
import { getPayloadClient } from '@/lib/payload'

/** Top 20 du classement (général ou défi du jour). */
export async function GET(req: Request) {
  const blocked = guard(req, 'leaderboard', 60, 60_000)
  if (blocked) return blocked
  const daily = new URL(req.url).searchParams.get('daily') === '1'
  const payload = await getPayloadClient()
  const where: Where = { and: [{ game: { equals: 'the-ratsu' } }, { hidden: { not_equals: true } }, ...(daily ? [{ seed: { equals: dailySeed() } }] : [])] }
  const r = await payload.find({ collection: 'scores', where, sort: '-score', limit: 20, depth: 0, overrideAccess: false })
  return json(
    r.docs.map((s) => ({ nickname: s.nickname, score: s.score, floor: s.floor, won: s.won, seed: s.seed, date: s.createdAt })),
    200,
    { 'Cache-Control': 'public, max-age=15' },
  )
}
