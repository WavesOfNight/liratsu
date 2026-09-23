import { error, sameOrigin } from '@/lib/api'
import { clearCookie, MEMBER_COOKIE } from '@/lib/community'

/** Déconnexion du membre Twitch. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return error('Origine non autorisée.', 403)
  return new Response(null, { status: 303, headers: { Location: '/communaute', 'Set-Cookie': clearCookie(MEMBER_COOKIE) } })
}
