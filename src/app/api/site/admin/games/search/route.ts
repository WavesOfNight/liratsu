import { json, requireStaff } from '@/lib/api'
import { getIntegrations } from '@/lib/settings'
import { searchGameBoxArt } from '@/lib/twitch'

/** Recherche d'un jeu (nom + jaquette officielle Twitch) pour le sélecteur du planning. */
export async function GET(req: Request) {
  const auth = await requireStaff(req, 'editor')
  if (auth instanceof Response) return auth
  const q = new URL(req.url).searchParams.get('q') ?? ''
  const { twitch } = await getIntegrations()
  if (!twitch.clientId || !twitch.clientSecret) {
    return json({ error: 'Clé API Twitch manquante (Réglages > Clés API & services > Twitch, Client ID et Client Secret).', results: [] }, 200)
  }
  try {
    const results = await searchGameBoxArt(q)
    return json({ results })
  } catch (err) {
    // Erreur remontée telle quelle (401/403 identifiants invalides, quota, etc.) : sans ça,
    // l'admin voit juste « aucun résultat » et ne peut pas savoir que quelque chose est cassé.
    return json({ error: err instanceof Error ? err.message : 'Erreur Twitch inconnue.', results: [] }, 200)
  }
}
