/**
 * Webhook PayPal (signature vérifiée via l'API officielle verify-webhook-signature).
 * PAYMENT.CAPTURE.COMPLETED → commande payée ; DENIED/DECLINED → échec.
 */
import { getPayloadClient } from '@/lib/payload'
import { claimEvent, markOrderFailed, markOrderPaid } from '@/lib/shop/orders'
import { verifyPayPalWebhook } from '@/lib/shop/paypal'

type PayPalEvent = {
  id: string
  event_type: string
  resource: { id: string; custom_id?: string; amount?: { value: string; currency_code: string }; supplementary_data?: { related_ids?: { order_id?: string } } }
}

export async function POST(req: Request) {
  const raw = await req.text()
  let ok = false
  try {
    ok = await verifyPayPalWebhook(req.headers, raw)
  } catch {
    ok = false
  }
  if (!ok) return new Response('Signature invalide', { status: 400 })

  const event = JSON.parse(raw) as PayPalEvent
  const payload = await getPayloadClient()
  if (!(await claimEvent(payload, `paypal:${event.id}`, 'paypal', event.event_type))) return new Response('déjà traité', { status: 200 })

  const r = event.resource
  let orderId = r.custom_id
  if (!orderId && r.supplementary_data?.related_ids?.order_id) {
    const found = await payload.find({ collection: 'orders', where: { providerRef: { equals: r.supplementary_data.related_ids.order_id } }, limit: 1, depth: 0 })
    orderId = found.docs[0] ? String(found.docs[0].id) : undefined
  }
  if (!orderId) return new Response('ok', { status: 200 })

  switch (event.event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED':
      if (r.amount?.currency_code !== 'EUR') break
      await markOrderPaid(payload, orderId, {
        provider: 'paypal',
        paymentId: r.id,
        amountCents: Math.round(Number(r.amount.value) * 100),
        eventId: event.id,
      })
      break
    case 'PAYMENT.CAPTURE.DENIED':
    case 'PAYMENT.CAPTURE.DECLINED':
      await markOrderFailed(payload, orderId)
      break
    default:
      break
  }
  return new Response('ok', { status: 200 })
}
