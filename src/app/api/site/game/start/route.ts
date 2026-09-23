import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { dailySeed } from '@/game/saac/rng'
import { clientIp, error, guard, json, readJson } from '@/lib/api'
import { hashIdentifier } from '@/lib/crypto'
import { getPayloadClient } from '@/lib/payload'

/** Démarre une partie : seed (défi du jour ou aléatoire) + session horodatée côté serveur. */
export async function POST(req: Request) {
  const blocked = guard(req, 'game-start', 30, 10 * 60_000)
  if (blocked) return blocked
  const body = await readJson(req, z.object({ daily: z.boolean() }))
  if (!body.ok) return body.res
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'game-settings', depth: 0 })
  if (settings.saac?.enabled === false) return error('Le jeu est en pause pour le moment.', 403)
  const seed = body.data.daily ? dailySeed() : `libre-${randomBytes(6).toString('hex')}`
  const session = await payload.create({
    collection: 'game-sessions',
    data: { game: 'the-saac', seed, daily: body.data.daily, startedAt: new Date().toISOString(), ipHash: hashIdentifier(clientIp(req)) },
    overrideAccess: true,
  })
  return json({
    sessionId: session.id,
    seed,
    difficulty: settings.saac?.difficulty ?? 'normal',
    startHearts: settings.saac?.startHearts ?? 3,
    floors: settings.saac?.floors ?? 5,
    leaderboard: settings.saac?.leaderboardEnabled !== false,
  })
}
