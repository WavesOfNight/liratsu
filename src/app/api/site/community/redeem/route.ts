import { z } from 'zod'
import { error, guard, json, readJson } from '@/lib/api'
import { readMemberId, readUnlocks, unlockCookie } from '@/lib/community'
import { getPayloadClient } from '@/lib/payload'

const schema = z.object({ code: z.string().trim().min(3).max(40) })

/** Utilisation d'un code surprise : débloque des téléchargements (cookie signé + profil membre). */
export async function POST(req: Request) {
  const blocked = guard(req, 'redeem', 8, 10 * 60_000)
  if (blocked) return blocked
  const body = await readJson(req, schema)
  if (!body.ok) return body.res
  const payload = await getPayloadClient()
  const r = await payload.find({ collection: 'surprise-codes', where: { code: { equals: body.data.code.toUpperCase() } }, limit: 1, depth: 1 })
  const code = r.docs[0]
  if (!code || !code.active || (code.expiresAt && new Date(code.expiresAt) < new Date())) return error('Code inconnu ou expiré… 🐟', 404)

  const unlockIds = (code.unlocks ?? []).map((d) => (typeof d === 'object' ? Number(d.id) : Number(d)))
  const already = readUnlocks(req.headers.get('cookie'))
  const isNew = unlockIds.some((id) => !already.includes(id))
  if (isNew) await payload.update({ collection: 'surprise-codes', id: code.id, data: { redemptions: (code.redemptions ?? 0) + 1 } })

  const memberId = readMemberId(req.headers.get('cookie'))
  if (memberId) {
    const m = await payload.findByID({ collection: 'members', id: memberId, depth: 0 }).catch(() => null)
    if (m) {
      const ids = new Set([...(m.unlockedCodes ?? []).map((c) => (typeof c === 'object' ? c.id : c)), code.id])
      await payload.update({ collection: 'members', id: m.id, data: { unlockedCodes: [...ids] } })
    }
  }

  const titles = (code.unlocks ?? []).map((d) => (typeof d === 'object' ? d.title : '')).filter(Boolean)
  return json({ ok: true, message: code.message, unlocked: titles }, 200, { 'Set-Cookie': unlockCookie([...already, ...unlockIds]) })
}
