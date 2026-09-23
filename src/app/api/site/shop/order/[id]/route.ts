import { error, guard, json } from '@/lib/api'
import { safeEqual } from '@/lib/crypto'
import { getPayloadClient } from '@/lib/payload'

/** Statut d'une commande pour le client (jeton secret dans l'URL, reçu par email). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = guard(req, 'order-status', 60, 60_000)
  if (blocked) return blocked
  const { id } = await params
  const token = new URL(req.url).searchParams.get('t') ?? ''
  const payload = await getPayloadClient()
  const order = await payload.findByID({ collection: 'orders', id, depth: 0, showHiddenFields: true }).catch(() => null)
  if (!order || !order.accessToken || !safeEqual(token, order.accessToken)) return error('Introuvable.', 404)
  return json({ status: order.status, number: order.number })
}
