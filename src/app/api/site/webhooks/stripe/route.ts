/**
 * Webhook Stripe (signature vérifiée avec le secret whsec_…).
 * Événements : checkout.session.completed / async_payment_succeeded → commande payée ;
 * checkout.session.expired / async_payment_failed → échec ; charge.refunded → trace.
 */
import type Stripe from 'stripe'
import { getPayloadClient } from '@/lib/payload'
import { claimEvent, markOrderFailed, markOrderPaid } from '@/lib/shop/orders'
import { getStripe } from '@/lib/shop/stripe'

export async function POST(req: Request) {
  const raw = await req.text()
  const sig = req.headers.get('stripe-signature')
  let event: Stripe.Event
  let stripe: Stripe
  try {
    const s = await getStripe()
    stripe = s.stripe
    if (!sig || !s.webhookSecret) return new Response('Signature manquante', { status: 400 })
    event = stripe.webhooks.constructEvent(raw, sig, s.webhookSecret)
  } catch {
    return new Response('Signature invalide', { status: 400 })
  }

  const payload = await getPayloadClient()
  if (!(await claimEvent(payload, `stripe:${event.id}`, 'stripe', event.type))) return new Response('déjà traité', { status: 200 })

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = session.metadata?.orderId ?? session.client_reference_id
      if (!orderId || session.payment_status !== 'paid') break
      await markOrderPaid(payload, orderId, {
        provider: 'stripe',
        paymentId: typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? session.id),
        amountCents: session.amount_total ?? 0,
        eventId: event.id,
      })
      break
    }
    case 'checkout.session.expired':
    case 'checkout.session.async_payment_failed': {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = session.metadata?.orderId ?? session.client_reference_id
      if (orderId) await markOrderFailed(payload, orderId)
      break
    }
    default:
      break
  }
  return new Response('ok', { status: 200 })
}
