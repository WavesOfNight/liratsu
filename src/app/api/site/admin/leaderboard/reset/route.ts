import { z } from 'zod'
import type { Where } from 'payload'
import { json, readJson, requireStaff } from '@/lib/api'

/** Remise à zéro du classement : les scores sont masqués (conservés pour l'historique). */
export async function POST(req: Request) {
  const auth = await requireStaff(req, 'moderator', 'editor')
  if (auth instanceof Response) return auth
  const body = await readJson(req, z.object({ scope: z.enum(['all', 'daily']) }))
  if (!body.ok) return body.res
  const where: Where = body.data.scope === 'daily' ? { and: [{ daily: { equals: true } }, { hidden: { not_equals: true } }] } : { hidden: { not_equals: true } }
  const r = await auth.payload.update({ collection: 'scores', where, data: { hidden: true } })
  return json({ count: r.docs.length })
}
