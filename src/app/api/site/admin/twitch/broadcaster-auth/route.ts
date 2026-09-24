import { randomBytes } from 'node:crypto'
import { error, requireStaff } from '@/lib/api'
import { packSigned } from '@/lib/community'
import { getBroadcasterOAuthUrl } from '@/lib/twitch'

/** Démarre l'autorisation du compte Twitch de Liratsu (abonnés/followers), réservé aux admins. */
export async function GET(req: Request) {
  const auth = await requireStaff(req, 'admin')
  if (auth instanceof Response) return auth
  const state = randomBytes(16).toString('base64url')
  const redirect = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/site/admin/twitch/broadcaster-callback`
  const url = await getBroadcasterOAuthUrl(redirect, state)
  if (!url) return error('Renseigne d’abord le Client ID Twitch.', 400)
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return new Response(null, {
    status: 302,
    headers: { Location: url, 'Set-Cookie': `btauth=${packSigned(state)}; Path=/api/site/admin/twitch; HttpOnly; SameSite=Lax; Max-Age=600${secure}` },
  })
}
