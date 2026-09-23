/**
 * Webhook Gelato : suivi de fabrication et d'expédition.
 * Authentification : jeton secret dans l'URL (?token=…), comparé en temps constant.
 * Le changement de statut déclenche automatiquement l'email client (hook de la collection Orders).
 */
import { safeEqual } from '@/lib/crypto'
import { getPayloadClient } from '@/lib/payload'
import { extractTracking, type GelatoWebhook } from '@/lib/shop/gelato'
import { canTransition, mapGelatoStatus, type OrderStatus } from '@/lib/shop/orderStatus'
import { claimEvent } from '@/lib/shop/orders'
import { getIntegrations } from '@/lib/settings'

export async function POST(req: Request) {
  const { gelato } = await getIntegrations()
  const token = new URL(req.url).searchParams.get('token') ?? ''
  if (!gelato.webhookToken || !safeEqual(token, gelato.webhookToken)) return new Response('Non autorisé', { status: 401 })

  const raw = await req.text()
  if (raw.length > 200_000) return new Response('Trop volumineux', { status: 413 })
  let evt: GelatoWebhook
  try {
    evt = JSON.parse(raw) as GelatoWebhook
  } catch {
    return new Response('JSON invalide', { status: 400 })
  }
  const payload = await getPayloadClient()
  const eventKey = `gelato:${evt.id ?? `${evt.orderId}:${evt.event}:${evt.fulfillmentStatus}:${evt.trackingCode ?? ''}`}`
  if (!(await claimEvent(payload, eventKey, 'gelato', evt.event))) return new Response('déjà traité', { status: 200 })

  const orderId = evt.orderReferenceId
  if (!orderId || !/^\d+$/.test(orderId)) return new Response('ok', { status: 200 })
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0 }).catch(() => null)
  if (!order || (order.fulfillment?.gelatoOrderId && evt.orderId && order.fulfillment.gelatoOrderId !== evt.orderId)) return new Response('ok', { status: 200 })

  const tracking = extractTracking(evt)
  const fulfillment = {
    ...order.fulfillment,
    gelatoStatus: evt.fulfillmentStatus ?? order.fulfillment?.gelatoStatus,
    ...(tracking.trackingNumber ? { trackingNumber: tracking.trackingNumber } : {}),
    ...(tracking.trackingUrl ? { trackingUrl: tracking.trackingUrl } : {}),
    ...(tracking.carrier ? { carrier: tracking.carrier } : {}),
  }
  const next = evt.fulfillmentStatus ? mapGelatoStatus(evt.fulfillmentStatus) : tracking.trackingNumber ? 'shipped' : null
  const data: Record<string, unknown> = { fulfillment }
  if (next && canTransition(order.status as OrderStatus, next)) data.status = next
  await payload.update({ collection: 'orders', id: order.id, data })
  return new Response('ok', { status: 200 })
}
