import { z } from 'zod'
import { clientIp, error, guard, json, readJson } from '@/lib/api'
import { hashIdentifier } from '@/lib/crypto'
import { getModerationSettings, notifyModerators } from '@/lib/moderation/notify'
import { analyzeText } from '@/lib/moderation/textFilter'
import { getPayloadClient } from '@/lib/payload'
import { getSection } from '@/lib/site'

const schema = z.object({
  name: z.string().trim().min(2, 'Pseudo trop court.').max(40, 'Pseudo trop long.'),
  message: z.string().trim().min(3, 'Message trop court.').max(600, 'Message trop long (600 caractères max).'),
  mood: z.enum(['star', 'heart', 'fish', 'bubble', 'music']).default('star'),
  consent: z.literal(true, { error: 'Merci d’accepter les conditions.' }),
  website: z.string().max(0).optional().or(z.literal('')).or(z.null()),
})

/**
 * Livre d'or. Le filtre automatique (insultes, liens, coordonnées, spam) :
 *  - refuse immédiatement les messages interdits, avec une explication ;
 *  - signale les messages douteux aux modérateurs (alertes visibles dans l'admin) ;
 * puis le message attend la validation d'un modérateur (sauf option « publication auto »
 * des messages sans aucune alerte).
 */
export async function POST(req: Request) {
  const blocked = guard(req, 'guestbook', 3, 10 * 60_000)
  if (blocked) return blocked
  if ((await getSection('community')).status !== 'on') return error('Espace communauté fermé.', 403)
  const body = await readJson(req, schema)
  if (!body.ok) return body.res

  const payload = await getPayloadClient()
  const ipHash = hashIdentifier(clientIp(req))
  const { settings, filter } = await getModerationSettings(payload)
  const check = analyzeText(`${body.data.name}\n${body.data.message}`, filter)
  if (check.verdict === 'block') return error(check.reason ?? 'Message refusé.', 422)

  // Même message déjà envoyé récemment par la même personne : spam.
  const since = new Date(Date.now() - 24 * 3600_000).toISOString()
  const same = await payload.count({
    collection: 'guestbook',
    where: { and: [{ ipHash: { equals: ipHash } }, { message: { equals: body.data.message } }, { createdAt: { greater_than: since } }] },
  })
  if (same.totalDocs > 0) return error('Tu as déjà envoyé ce message ✦ Il attend sa validation.', 409)

  const autoApprove = settings.autoApproveClean === true && check.verdict === 'ok'
  await payload.create({
    collection: 'guestbook',
    data: {
      name: body.data.name,
      message: body.data.message,
      mood: body.data.mood,
      status: autoApprove ? 'approved' : 'pending',
      flags: check.flags as never,
      flaggedTerms: check.matches.join(' · ') || undefined,
      ipHash,
    },
  })
  if (!autoApprove) void notifyModerators(payload, { kind: 'guestbook', title: `${body.data.name} : « ${body.data.message.slice(0, 140)} »`, flags: check.flags }).catch(() => null)
  return json({ ok: true, published: autoApprove })
}
