import { randomBytes } from 'node:crypto'
import { error, guard } from '@/lib/api'
import { packSigned } from '@/lib/community'
import { getOAuthUrl } from '@/lib/twitch'

/** Démarre la connexion Twitch (OAuth, aucune permission demandée). */
export async function GET(req: Request) {
  const blocked = guard(req, 'twitch-login', 10, 10 * 60_000)
  if (blocked) return blocked
  const state = randomBytes(16).toString('base64url')
  const redirect = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/site/auth/twitch/callback`
  const url = await getOAuthUrl(redirect, state)
  if (!url) return error('Connexion Twitch désactivée.', 404)
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return new Response(null, {
    status: 302,
    headers: { Location: url, 'Set-Cookie': `loauth=${packSigned(state)}; Path=/api/site/auth; HttpOnly; SameSite=Lax; Max-Age=600${secure}` },
  })
}
