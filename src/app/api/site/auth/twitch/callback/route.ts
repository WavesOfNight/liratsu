import { guard } from '@/lib/api'
import { memberCookie, unpackSigned } from '@/lib/community'
import { safeEqual } from '@/lib/crypto'
import { getPayloadClient } from '@/lib/payload'
import { exchangeOAuthCode } from '@/lib/twitch'
import { readCookie } from '@/lib/twoFactor'

const back = (q: string) => new Response(null, { status: 302, headers: { Location: `/communaute${q}` } })

/** Retour OAuth Twitch : vérifie le state (anti-CSRF), crée/met à jour le membre, ouvre la session. */
export async function GET(req: Request) {
  const blocked = guard(req, 'twitch-cb', 10, 10 * 60_000)
  if (blocked) return blocked
  const url = new URL(req.url)
  const state = url.searchParams.get('state') ?? ''
  const expected = unpackSigned(readCookie(req.headers.get('cookie'), 'loauth'))
  if (!expected || !safeEqual(state, expected)) return back('?login=erreur')
  const code = url.searchParams.get('code')
  if (!code) return back('?login=annule')

  const user = await exchangeOAuthCode(code, `${process.env.NEXT_PUBLIC_SERVER_URL}/api/site/auth/twitch/callback`)
  if (!user) return back('?login=erreur')
  const payload = await getPayloadClient()
  const existing = await payload.find({ collection: 'members', where: { twitchId: { equals: user.id } }, limit: 1, depth: 0 })
  let member = existing.docs[0]
  if (member?.banned) return back('?login=refuse')
  member = member
    ? await payload.update({ collection: 'members', id: member.id, data: { displayName: user.displayName, avatarUrl: user.avatar, email: user.email ?? undefined } })
    : await payload.create({ collection: 'members', data: { twitchId: user.id, displayName: user.displayName, avatarUrl: user.avatar, email: user.email ?? undefined } })

  const res = back('?login=ok')
  res.headers.append('Set-Cookie', memberCookie(Number(member.id)))
  res.headers.append('Set-Cookie', 'loauth=; Path=/api/site/auth; Max-Age=0')
  return res
}
