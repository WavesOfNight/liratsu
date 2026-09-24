import { requireStaff } from '@/lib/api'
import { unpackSigned } from '@/lib/community'
import { safeEqual } from '@/lib/crypto'
import { exchangeBroadcasterOAuthCode } from '@/lib/twitch'
import { readCookie } from '@/lib/twoFactor'

const back = (q: string) => new Response(null, { status: 302, headers: { Location: `/admin/globals/integrations${q}` } })

/** Retour de l'autorisation du compte Twitch de Liratsu : sauvegarde le jeton, revient dans l'admin. */
export async function GET(req: Request) {
  const auth = await requireStaff(req, 'admin')
  if (auth instanceof Response) return auth
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
