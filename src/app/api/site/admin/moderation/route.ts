/**
 * File de modération (rôle Modérateur ou Admin, 2FA respectée).
 *   GET  ?type=fanarts|guestbook&status=pending|approved|rejected  → éléments + compteurs
 *   POST { type, ids, action: approve|reject|delete, reason?, reply? }  → décision (par lot possible)
 * La décision est tracée (modéré par / le) et l'artiste est prévenu par email (hook Fanarts).
 */
import type { Where } from 'payload'
import { z } from 'zod'
import { error, json, readJson, requireStaff } from '@/lib/api'

const TYPES = ['fanarts', 'guestbook'] as const
const STATUSES = ['pending', 'approved', 'rejected'] as const
const strip = (u?: string | null) => (u ?? '').replace(/^https?:\/\/[^/]+/, '')

export async function GET(req: Request) {
  const auth = await requireStaff(req, 'moderator')
  if (auth instanceof Response) return auth
  const { payload } = auth
  const url = new URL(req.url)
  const type = (TYPES as readonly string[]).includes(url.searchParams.get('type') ?? '') ? (url.searchParams.get('type') as (typeof TYPES)[number]) : 'fanarts'
  const status = (STATUSES as readonly string[]).includes(url.searchParams.get('status') ?? '') ? url.searchParams.get('status')! : 'pending'
  const where: Where = { status: { equals: status } }
  const sort = status === 'pending' ? 'createdAt' : '-moderatedAt'

  const [counts, docs] = await Promise.all([
    Promise.all(TYPES.map((c) => payload.count({ collection: c, where: { status: { equals: 'pending' } } }))),
    type === 'fanarts'
      ? payload.find({ collection: 'fanarts', where, sort, limit: 60, depth: 1, showHiddenFields: true })
      : payload.find({ collection: 'guestbook', where, sort, limit: 100, depth: 1, showHiddenFields: true }),
  ])

  const items = docs.docs.map((d) => {
    const base = {
      id: d.id,
      status: d.status,
      createdAt: d.createdAt,
      flags: d.flags ?? [],
      flaggedTerms: d.flaggedTerms ?? '',
      rejectionReason: d.rejectionReason ?? '',
      moderatedAt: d.moderatedAt ?? null,
      moderatedBy: typeof d.moderatedBy === 'object' && d.moderatedBy ? d.moderatedBy.name || d.moderatedBy.email : null,
    }
    if ('artist' in d) {
      return {
        ...base,
        title: d.title,
        artist: d.artist,
        artistLink: d.artistLink ?? '',
        contactEmail: d.contactEmail ?? '',
        thumb: strip(d.sizes?.preview?.url || d.sizes?.thumb?.url || d.url),
        full: strip(d.url),
        width: d.width,
        height: d.height,
        filesize: d.filesize,
      }
    }
    return { ...base, name: d.name, message: d.message, mood: d.mood, reply: d.reply ?? '' }
  })

  return json({ type, status, counts: { fanarts: counts[0].totalDocs, guestbook: counts[1].totalDocs }, items })
}

const schema = z.object({
  type: z.enum(TYPES),
  ids: z.array(z.union([z.number(), z.string()])).min(1).max(100),
  action: z.enum(['approve', 'reject', 'delete', 'pending']),
  reason: z.string().trim().max(200).optional(),
  reply: z.string().trim().max(600).optional(),
})

export async function POST(req: Request) {
  const auth = await requireStaff(req, 'moderator')
  if (auth instanceof Response) return auth
  const { payload, user } = auth
  const body = await readJson(req, schema)
  if (!body.ok) return body.res
  const { type, ids, action, reason, reply } = body.data
  if (action === 'reject' && !reason) return error('Choisis un motif de refus.')

  let done = 0
  for (const id of ids) {
    try {
      if (action === 'delete') {
        await payload.delete({ collection: type, id, user, overrideAccess: true })
      } else {
        const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending'
        await payload.update({
          collection: type,
          id,
          user, // → « modéré par » renseigné par le hook stampModeration
          overrideAccess: true,
          data: { status, rejectionReason: action === 'reject' ? reason : null, ...(type === 'guestbook' && reply !== undefined ? { reply: reply || null } : {}) } as never,
        })
      }
      done++
    } catch (err) {
      payload.logger.error({ err }, `moderation ${action} ${type}#${id}`)
    }
  }
  return json({ ok: true, done })
}
