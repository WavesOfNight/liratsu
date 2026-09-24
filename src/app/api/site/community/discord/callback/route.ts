import { guard } from '@/lib/api'
import { unpackSigned } from '@/lib/community'
import { safeEqual } from '@/lib/crypto'
import { exchangeDiscordLinkCode } from '@/lib/discord'
import { getPayloadClient } from '@/lib/payload'
import { readCookie } from '@/lib/twoFactor'

const back = (q: string) => new Response(null, { status: 302, headers: { Location: `/communaute${q}` } })
const clearCookie = 'dcauth=; Path=/api/site/community/discord; Max-Age=0'

/** Retour de la liaison Discord : le state signé porte l'id du membre à relier (voir /link). */
export async function GET(req: Request) {
  const blocked = guard(req, 'discord-cb', 10, 10 * 60_000)
  if (blocked) return blocked
  const url = new URL(req.url)
  const nonce = url.searchParams.get('state') ?? ''
  const packed = unpackSigned(readCookie(req.headers.get('cookie'), 'dcauth'))
  const [memberIdRaw, expectedNonce] = (packed ?? '').split(':')
  const memberId = Number(memberIdRaw)
  if (!packed || !memberId || !expectedNonce || !safeEqual(nonce, expectedNonce)) {
    const res = back('?discord=erreur')
    res.headers.append('Set-Cookie', clearCookie)
    return res
  }

  const code = url.searchParams.get('code')
  let q = '?discord=annule'
  if (code) {
    const identity = await exchangeDiscordLinkCode(code, `${process.env.NEXT_PUBLIC_SERVER_URL}/api/site/community/discord/callback`)
    if (!identity) q = '?discord=erreur'
    else {
      const payload = await getPayloadClient()
      try {
        await payload.update({
          collection: 'members',
          id: memberId,
          data: { discordId: identity.id, discordUsername: identity.username, discordAvatarUrl: identity.avatarUrl },
          overrideAccess: true,
        })
        q = '?discord=ok'
      } catch (err) {
        // Ce compte Discord est déjà lié à un autre membre (contrainte d'unicité sur discordId).
        q = /unique|duplicate/i.test(String((err as Error)?.message ?? err)) ? '?discord=deja-lie' : '?discord=erreur'
      }
    }
  }
  const res = back(q)
  res.headers.append('Set-Cookie', clearCookie)
  return res
}
