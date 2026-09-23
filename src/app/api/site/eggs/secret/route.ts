import { guard, json } from '@/lib/api'
import { getPayloadClient } from '@/lib/payload'

/** Easter egg secret : révèle le code surprise choisi dans l'admin (si actif). */
export async function POST(req: Request) {
  const blocked = guard(req, 'egg-secret', 5, 10 * 60_000)
  if (blocked) return blocked
  const payload = await getPayloadClient()
  const eggs = await payload.findGlobal({ slug: 'easter-eggs', depth: 1 })
  const reward = eggs.secretReward
  if (!eggs.secretCode || !reward || typeof reward !== 'object' || !reward.active) {
    return json({ message: 'Tu as trouvé le secret… mais la surprise n’est pas encore prête. Reviens bientôt !' })
  }
  if (reward.expiresAt && new Date(reward.expiresAt) < new Date()) return json({ message: 'Tu as trouvé le secret, mais cette surprise a expiré… 🐟' })
  return json({ code: reward.code, message: reward.message ?? 'Bravo, tu as trouvé l’easter egg secret !' })
}
