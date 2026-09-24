import { error, guard } from '@/lib/api'
import { readMemberId } from '@/lib/community'
import { getPayloadClient } from '@/lib/payload'

/** Délie le compte Discord du membre connecté. */
export async function POST(req: Request) {
  const blocked = guard(req, 'discord-unlink', 10, 10 * 60_000)
  if (blocked) return blocked
  const memberId = readMemberId(req.headers.get('cookie'))
  if (!memberId) return error('Non connecté.', 401)
  const payload = await getPayloadClient()
  await payload.update({
    collection: 'members',
    id: memberId,
    data: { discordId: null, discordUsername: null, discordAvatarUrl: null },
    overrideAccess: true,
  })
  return new Response(null, { status: 303, headers: { Location: '/communaute' } })
}
