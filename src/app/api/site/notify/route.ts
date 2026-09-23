import { z } from 'zod'
import { SECTION_KEYS } from '@/globals/SiteSettings'
import { error, guard, json, readJson } from '@/lib/api'
import { getPayloadClient } from '@/lib/payload'

const schema = z.object({
  email: z.email('Email invalide.').max(200),
  section: z.enum(SECTION_KEYS),
  consent: z.literal(true, { error: 'Merci de cocher la case de consentement.' }),
  website: z.string().max(0).optional().or(z.literal('')).or(z.null()), // pot de miel
})

/** Inscription « préviens-moi » (teaser « Bientôt ? »). */
export async function POST(req: Request) {
  const blocked = guard(req, 'notify', 5, 60 * 60_000)
  if (blocked) return blocked
  const body = await readJson(req, schema)
  if (!body.ok) return body.res
  const payload = await getPayloadClient()
  const email = body.data.email.toLowerCase()
  const exists = await payload.count({ collection: 'notify-signups', where: { and: [{ email: { equals: email } }, { section: { equals: body.data.section } }] } })
  if (exists.totalDocs === 0) {
    await payload.create({ collection: 'notify-signups', data: { email, section: body.data.section, consentAt: new Date().toISOString() } }).catch(() => null)
  }
  return exists.totalDocs >= 0 ? json({ ok: true }) : error('Erreur')
}
