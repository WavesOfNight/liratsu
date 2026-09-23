/**
 * Actions d'administration sur une commande (rôle éditrice ou admin, 2FA respectée) :
 *   refund        → remboursement Stripe / PayPal (total ou partiel)
 *   gelato        → (re)transmission de la commande à Gelato (idempotent)
 *   resend-email  → renvoi de l'email correspondant au statut actuel
 */
import { z } from 'zod'
import { error, json, readJson, requireStaff } from '@/lib/api'
import { sendOrderConfirmation, sendOrderStatusEmail } from '@/lib/shop/emails'
import { createGelatoOrder } from '@/lib/shop/gelato'
import type { OrderStatus } from '@/lib/shop/orderStatus'
import { refundPayPalCapture } from '@/lib/shop/paypal'
import { getStripe } from '@/lib/shop/stripe'

type Params = { params: Promise<{ id: string; action: string }> }

export async function POST(req: Request, { params }: Params) {
  const auth = await requireStaff(req, 'editor')
  if (auth instanceof Response) return auth
  const { payload, user } = auth
  const { id, action } = await params
  const order = await payload.findByID({ collection: 'orders', id, depth: 0 }).catch(() => null)
  if (!order) return error('Commande introuvable.', 404)

  switch (action) {
    case 'refund': {
      const body = await readJson(req, z.object({ amount: z.number().positive().max(100_000).nullable().optional() }))
      if (!body.ok) return body.res
      if (!order.paymentId || !['paid', 'in_production', 'shipped', 'delivered', 'partially_refunded'].includes(order.status)) {
        return error('Cette commande ne peut pas être remboursée dans son état actuel.')
      }
      const totalCents = Math.round((order.total ?? 0) * 100)
      const already = (order.refunds ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
      const remaining = totalCents - already
      const amountCents = body.data.amount ? Math.round(body.data.amount * 100) : remaining
      if (amountCents <= 0 || amountCents > remaining) return error(`Montant invalide (restant remboursable : ${(remaining / 100).toFixed(2)} €).`)
      const key = `refund-${order.id}-${already}-${amountCents}`

      let reference: string
      try {
        if (order.provider === 'stripe') {
          const { stripe } = await getStripe()
          const refund = await stripe.refunds.create({ payment_intent: order.paymentId, amount: amountCents, metadata: { orderId: String(order.id) } }, { idempotencyKey: key })
          reference = refund.id
        } else {
          const refund = await refundPayPalCapture(order.paymentId, amountCents === totalCents ? null : amountCents, key)
          reference = refund.id
        }
      } catch (e) {
        payload.logger.error({ err: e }, 'refund')
        return error(`Remboursement refusé par le prestataire : ${(e as Error).message}`, 502)
      }
      const full = already + amountCents >= totalCents
      await payload.update({
        collection: 'orders',
        id: order.id,
        data: {
          status: full ? 'refunded' : 'partially_refunded',
          refunds: [...(order.refunds ?? []), { amount: amountCents, reference, at: new Date().toISOString(), by: user.email }],
        },
      })
      return json({ message: `Remboursement de ${(amountCents / 100).toFixed(2)} € effectué (${reference}).` })
    }
    case 'gelato': {
      if (!['paid', 'in_production'].includes(order.status)) return error('La commande doit être payée.')
      const r = await createGelatoOrder(payload, order)
      return r.ok ? json({ message: `Transmise à Gelato (${r.gelatoOrderId}).` }) : error(r.error, 502)
    }
    case 'resend-email': {
      if (order.status === 'paid') await sendOrderConfirmation(payload, order)
      else await sendOrderStatusEmail(payload, order, order.status as OrderStatus)
      return json({ message: 'Email renvoyé (si le SMTP est configuré).' })
    }
    default:
      return error('Action inconnue.', 404)
  }
}
