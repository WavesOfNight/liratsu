import { guard } from '@/lib/api'
import { unpackSigned } from '@/lib/community'
import { safeEqual } from '@/lib/crypto'
import { exchangeBroadcasterOAuthCode } from '@/lib/twitch'
import { readCookie } from '@/lib/twoFactor'

const back = (q: string) => new Response(null, { status: 302, headers: { Location: `/admin/globals/integrations${q}` } })

/**
 * Retour de l'autorisation du compte Twitch de Liratsu : sauvegarde le jeton, revient dans l'admin.
 * Pas de requireStaff ici (contrairement à /broadcaster-auth) : Twitch amène le navigateur ici par
 * une redirection cross-site, et le cookie de session admin n'y revient pas forcément selon le
 * navigateur — la protection vient du state signé (btauth), qui ne peut avoir été obtenu que par
 * un admin déjà authentifié sur /broadcaster-auth (même schéma que la connexion viewer ci-contre).
 */
export async function GET(req: Request) {
  const blocked = guard(req, 'twitch-broadcaster-cb', 10, 10 * 60_000)
  if (blocked) return blocked
  const url = new URL(req.url)
  const state = url.searchParams.get('state') ?? ''
  const expected = unpackSigned(readCookie(req.headers.get('cookie'), 'btauth'))
  if (!expected || !safeEqual(state, expected)) return back('?twitch=erreur')
  const code = url.searchParams.get('code')
  if (!code) return back('?twitch=annule')

  const ok = await exchangeBroadcasterOAuthCode(code, `${process.env.NEXT_PUBLIC_SERVER_URL}/api/site/admin/twitch/broadcaster-callback`)
  const res = back(ok ? '?twitch=ok' : '?twitch=erreur')
  res.headers.append('Set-Cookie', 'btauth=; Path=/api/site/admin/twitch; Max-Age=0')
  return res
}
