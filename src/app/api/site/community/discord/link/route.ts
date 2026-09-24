import { randomBytes } from 'node:crypto'
import { error, guard } from '@/lib/api'
import { packSigned, readMemberId } from '@/lib/community'
import { getDiscordLinkUrl } from '@/lib/discord'

/** Démarre la liaison du compte Discord au compte du site (Espace communauté, déjà connecté via Twitch). */
export async function GET(req: Request) {
  const blocked = guard(req, 'discord-link', 10, 10 * 60_000)
  if (blocked) return blocked
  const memberId = readMemberId(req.headers.get('cookie'))
  if (!memberId) return error('Connecte-toi avec Twitch avant de lier ton compte Discord.', 401)
  const nonce = randomBytes(16).toString('base64url')
  const redirect = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/site/community/discord/callback`
  const url = await getDiscordLinkUrl(redirect, nonce)
  if (!url) return error('Connexion Discord non configurée.', 404)
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      // Le membre à relier est encodé (signé) directement dans le cookie de state : pas de
      // dépendance à ce que le cookie de session « lmember » revienne lui aussi sur ce retour
      // cross-site depuis Discord.
      'Set-Cookie': `dcauth=${packSigned(`${memberId}:${nonce}`)}; Path=/api/site/community/discord; HttpOnly; SameSite=Lax; Max-Age=600${secure}`,
    },
  })
}
