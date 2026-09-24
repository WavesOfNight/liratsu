import { guard } from '@/lib/api'
import { getPayloadClient } from '@/lib/payload'

/**
 * Sert le code d'un jeu « personnalisé » (HTML/JS collé dans l'admin) comme un document
 * à part entière — jamais en `srcdoc` — pour lui donner sa PROPRE Content-Security-Policy,
 * permissive uniquement ici, sans toucher au CSP strict (nonce) du reste du site.
 *
 * Sécurité : chargé uniquement dans une <iframe sandbox="allow-scripts"> (sans
 * allow-same-origin) par CustomGameFrame → aucun accès aux cookies/stockage du site,
 * aucune requête réseau autorisée (connect-src 'none'), aucune ressource distante
 * (le jeu doit être 100 % autonome), pas de navigation ni de popup, embarquable
 * uniquement par notre propre site (frame-ancestors 'self').
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const blocked = guard(req, 'arcade-render', 60, 60_000)
  if (blocked) return blocked
  const { slug } = await params
  const payload = await getPayloadClient()
  const r = await payload.find({ collection: 'games', where: { and: [{ slug: { equals: slug } }, { status: { equals: 'live' } }, { engine: { equals: 'custom' } }] }, limit: 1, depth: 0 })
  const game = r.docs[0]
  if (!game?.code) return new Response('Introuvable', { status: 404 })

  const csp = [
    `default-src 'none'`,
    `script-src 'unsafe-inline'`,
    `style-src 'unsafe-inline'`,
    `img-src data: blob:`,
    `media-src data: blob:`,
    `font-src data:`,
    `connect-src 'none'`,
    `frame-src 'none'`,
    `form-action 'none'`,
    `base-uri 'none'`,
    `frame-ancestors 'self'`,
  ].join('; ')

  return new Response(game.code, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': csp,
      'X-Frame-Options': 'SAMEORIGIN',
      'Cache-Control': 'public, max-age=60',
    },
  })
}
