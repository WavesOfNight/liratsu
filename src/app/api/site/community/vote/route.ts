import { z } from 'zod'
import { clientIp, error, guard, json, readJson } from '@/lib/api'
import { readMemberId } from '@/lib/community'
import { hashIdentifier } from '@/lib/crypto'
import { getPayloadClient } from '@/lib/payload'

const schema = z.object({ poll: z.number().int().positive(), option: z.number().int().min(0).max(7) })

/** Vote à un sondage : 1 vote par personne (membre Twitch, sinon empreinte IP + navigateur hachée). */
export async function POST(req: Request) {
  const blocked = guard(req, 'vote', 10, 10 * 60_000)
  if (blocked) return blocked
  const body = await readJson(req, schema)
  if (!body.ok) return body.res
  const payload = await getPayloadClient()
  const poll = await payload.findByID({ collection: 'polls', id: body.data.poll, depth: 0 }).catch(() => null)
  if (!poll || !poll.active || (poll.closesAt && new Date(poll.closesAt) < new Date())) return error('Ce sondage est fermé.')
  if (!poll.options?.[body.data.option]) return error('Option invalide.')

  const member = readMemberId(req.headers.get('cookie'))
  const voterHash = hashIdentifier(member ? `member:${member}` : `${clientIp(req)}|${req.headers.get('user-agent') ?? ''}|${poll.id}`)
  try {
    await payload.create({ collection: 'poll-votes', data: { poll: poll.id, voterHash, option: body.data.option }, overrideAccess: true })
  } catch {
    return error('Tu as déjà voté à ce sondage ✦', 409)
  }
  // Recompte exact à partir des votes enregistrés.
  const votes = await payload.find({ collection: 'poll-votes', where: { poll: { equals: poll.id } }, limit: 100_000, depth: 0, select: { option: true } })
  const counts = poll.options.map((_, i) => votes.docs.filter((v) => v.option === i).length)
  await payload.update({ collection: 'polls', id: poll.id, data: { options: poll.options.map((o, i) => ({ ...o, votes: counts[i] })) } })
  return json({ ok: true, counts })
}
