import { z } from 'zod'
import { cleanNickname, validateScore } from '@/game/saac/validate'
import { error, guard, json, readJson } from '@/lib/api'
import { getPayloadClient } from '@/lib/payload'

const schema = z.object({
  sessionId: z.number().int().positive(),
  nickname: z.string().max(40),
  score: z.number().int().min(0).max(1_000_000),
  floor: z.number().int().min(1).max(50),
  won: z.boolean(),
  durationMs: z.number().int().min(0).max(4 * 3600_000),
  kills: z.number().int().min(0).max(10_000),
  rooms: z.number().int().min(0).max(1_000),
})

/**
 * Enregistre un score après validation anti-triche (session unique, durée mesurée par le
 * serveur, score plausible, limite de débit), puis renvoie les éventuels déblocages.
 */
export async function POST(req: Request) {
  const blocked = guard(req, 'game-score', 6, 10 * 60_000)
  if (blocked) return blocked
  const body = await readJson(req, schema)
  if (!body.ok) return body.res
  const d = body.data
  const payload = await getPayloadClient()
  const settings = (await payload.findGlobal({ slug: 'game-settings', depth: 1 })).saac
  const session = await payload.findByID({ collection: 'game-sessions', id: d.sessionId, depth: 0 }).catch(() => null)
  if (!session || session.used) return error('Partie inconnue ou déjà enregistrée.', 409)
  const elapsed = Date.now() - new Date(session.startedAt).getTime()
  if (elapsed > 6 * 3600_000) return error('Partie expirée.', 410)

  // La session est consommée quoi qu'il arrive (un seul envoi par partie).
  await payload.update({ collection: 'game-sessions', id: session.id, data: { used: true }, overrideAccess: true })

  const check = validateScore(d, elapsed, { maxFloors: settings?.floors ?? 5, maxScorePerSecond: settings?.maxScorePerSecond ?? 60 })
  if (!check.ok) return error(`Score refusé (${check.reason}).`, 422)

  // Déblocages (indépendants du classement)
  const rewards: { code: string; message: string }[] = []
  for (const u of settings?.unlocks ?? []) {
    const reward = typeof u.reward === 'object' ? u.reward : null
    if (!reward?.active) continue
    const t = u.threshold ?? 1
    const met = (u.condition === 'floor' && d.floor >= t) || (u.condition === 'score' && d.score >= t) || (u.condition === 'win' && d.won) || (u.condition === 'daily' && session.daily && (d.won || d.floor >= t))
    if (met) rewards.push({ code: reward.code, message: u.message || reward.message || 'Surprise débloquée !' })
  }

  let saved = false
  if (settings?.leaderboardEnabled !== false) {
    const nickname = cleanNickname(d.nickname)
    if (!nickname) return json({ saved: false, rewards, error: 'Pseudo refusé (2 à 20 caractères, sans propos déplacé).' })
    await payload.create({
      collection: 'scores',
      data: { game: 'the-saac', nickname, score: d.score, floor: d.floor, won: d.won, durationMs: Math.min(d.durationMs, elapsed), seed: session.seed, daily: Boolean(session.daily) },
      overrideAccess: true,
    })
    saved = true
  }
  return json({ saved, rewards })
}
