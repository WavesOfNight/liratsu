import { z } from 'zod'
import { error, guard, json, readJson } from '@/lib/api'
import { readMemberId } from '@/lib/community'
import { getPayloadClient } from '@/lib/payload'

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(''))

const schema = z.object({
  email: z.email('Email invalide.').max(200).optional().or(z.literal('')),
  address: z.object({
    firstName: optionalText(60),
    lastName: optionalText(60),
    line1: optionalText(120),
    line2: optionalText(120),
    postalCode: optionalText(12),
    city: optionalText(80),
    country: optionalText(2),
    phone: optionalText(30),
  }),
})

/** Modification du profil (email + adresse enregistrée) par le membre connecté lui-même. */
export async function POST(req: Request) {
  const blocked = guard(req, 'member-profile', 10, 10 * 60_000)
  if (blocked) return blocked
  const memberId = readMemberId(req.headers.get('cookie'))
  if (!memberId) return error('Non connecté.', 401)
  const body = await readJson(req, schema)
  if (!body.ok) return body.res

  const payload = await getPayloadClient()
  await payload.update({
    collection: 'members',
    id: memberId,
    data: { email: body.data.email || null, savedAddress: body.data.address },
    overrideAccess: true,
  })
  return json({ ok: true })
}
