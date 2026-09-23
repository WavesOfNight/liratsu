import { z } from 'zod'
import { clientIp, error, guard, json, readJson } from '@/lib/api'
import { hashIdentifier } from '@/lib/crypto'
import { getPayloadClient } from '@/lib/payload'
import { getSection } from '@/lib/site'

const schema = z.object({
  name: z.string().trim().min(2, 'Pseudo trop court.').max(40, 'Pseudo trop long.'),
  message: z.string().trim().min(3, 'Message trop court.').max(600, 'Message trop long (600 caractères max).'),
  mood: z.enum(['star', 'heart', 'fish', 'bubble', 'music']).default('star'),
  consent: z.literal(true, { error: 'Merci d’accepter les conditions.' }),
  website: z.string().max(0).optional().or(z.literal('')).or(z.null()),
})

/** Livre d'or : message enregistré « en attente » (modération a priori). */
export async function POST(req: Request) {
  const blocked = guard(req, 'guestbook', 3, 10 * 60_000)
  if (blocked) return blocked
  if ((await getSection('community')).status !== 'on') return error('Espace communauté fermé.', 403)
  const body = await readJson(req, schema)
  if (!body.ok) return body.res
  const payload = await getPayloadClient()
  await payload.create({
    collection: 'guestbook',
    data: { name: body.data.name, message: body.data.message, mood: body.data.mood, status: 'pending', ipHash: hashIdentifier(clientIp(req)) },
  })
  return json({ ok: true })
}
