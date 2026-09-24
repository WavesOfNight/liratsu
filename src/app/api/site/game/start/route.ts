import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { dailySeed } from '@/game/ratsu/rng'
import { clientIp, error, guard, json, readJson } from '@/lib/api'
import { hashIdentifier } from '@/lib/crypto'
import { getPayloadClient } from '@/lib/payload'
import { mediaUrl } from '@/lib/site'

/** Démarre une partie : seed (défi du jour ou aléatoire) + session horodatée côté serveur. */
export async function POST(req: Request) {
  const blocked = guard(req, 'game-start', 30, 10 * 60_000)
  if (blocked) return blocked
  const body = await readJson(req, z.object({ daily: z.boolean() }))
  if (!body.ok) return body.res
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'game-settings', depth: 1 })
  const ratsu = settings.ratsu
  if (ratsu?.enabled === false) return error('Le jeu est en pause pour le moment.', 403)
  const seed = body.data.daily ? dailySeed() : `libre-${randomBytes(6).toString('hex')}`
  const session = await payload.create({
    collection: 'game-sessions',
    data: { game: 'the-ratsu', seed, daily: body.data.daily, startedAt: new Date().toISOString(), ipHash: hashIdentifier(clientIp(req)) },
    overrideAccess: true,
  })
  const sprites = Object.fromEntries((ratsu?.spriteOverrides ?? []).map((s) => [s.key, mediaUrl(s.image)]).filter(([, url]) => url))
  const music = (ratsu?.musicTracks ?? [])
    .map((m) => ({ title: m.title, url: mediaUrl(m.file), floorFrom: m.floorFrom ?? 1 }))
    .filter((m): m is { title: string; url: string; floorFrom: number } => Boolean(m.url))
  return json({
    sessionId: session.id,
    seed,
    difficulty: ratsu?.difficulty ?? 'normal',
    startHearts: ratsu?.startHearts ?? 3,
    floors: ratsu?.floors ?? 5,
    leaderboard: ratsu?.leaderboardEnabled !== false,
    sprites,
    music,
  })
}
