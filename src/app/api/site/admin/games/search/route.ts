import { json, requireStaff } from '@/lib/api'
import { searchGameBoxArt } from '@/lib/twitch'

/** Recherche d'un jeu (nom + jaquette officielle Twitch) pour le sélecteur du planning. */
export async function GET(req: Request) {
  const auth = await requireStaff(req, 'editor')
  if (auth instanceof Response) return auth
  const q = new URL(req.url).searchParams.get('q') ?? ''
  const results = await searchGameBoxArt(q).catch(() => [])
  return json(results)
}
