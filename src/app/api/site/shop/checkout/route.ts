/**
 * Démarrage du paiement. Crée une commande « pending » (prix recalculés côté serveur),
 * puis une session Stripe Checkout ou une commande PayPal. La commande ne sera validée
 * QUE par le webhook signé du prestataire.
 */
import { error, guard, json, readJson } from '@/lib/api'
import { readMemberId } from '@/lib/community'
import { getPayloadClient } from '@/lib/payload'
import { preparePendingOrder } from '@/lib/shop/orders'
import { createPayPalOrder } from '@/lib/shop/paypal'
import { CartError } from '@/lib/shop/pricing'
import { checkoutSchema } from '@/lib/shop/schemas'
import { getStripe } from '@/lib/shop/stripe'
import { absoluteUrl, getSection, getSiteData } from '@/lib/site'

export async function POST(req: Request) {
  const blocked = guard(req, 'checkout', 10, 10 * 60_000)
  if (blocked) return blocked
  if ((await getSection('shop')).status !== 'on') return error('La boutique est fermée pour le moment.', 403)
  const body = await readJson(req, checkoutSchema)
  if (!body.ok) return body.res
  const { site, shop, integrations } = await getSiteData()
  const enabled = shop.enabledPayments ?? ['stripe', 'paypal']
  if (!enabled.includes(body.data.provider)) return error('Moyen de paiement indisponible.')
  const configured = body.data.provider === 'stripe' ? Boolean(integrations.stripe.secretKey) : Boolean(integrations.paypal.clientId && integrations.paypal.clientSecret)
  if (!configured) return error('Ce moyen de paiement n’est pas encore configuré.', 503)

  const payload = await getPayloadClient()
  let prepared
  try {
    prepared = await preparePendingOrder(payload, {
      cart: body.data.cart,
      email: body.data.email,
      address: { ...body.data.address, line2: body.data.address.line2 || undefined, phone: body.data.address.phone || undefined },
      couponCode: body.data.coupon || undefined,
      provider: body.data.provider,
      testMode: integrations.testMode,
      memberId: readMemberId(req.headers.get('cookie')),
    })
  } catch (e) {
    if (e instanceof CartError) return json({ error: e.message, code: e.code }, 422)
    throw e
  }
  const { order, quote } = prepared
  const t = quote.totals
  const returnUrl = absoluteUrl(site, `/commande/${order.id}?t=${order.accessToken}`)

  try {
    if (body.data.provider === 'stripe') {
      const { stripe } = await getStripe()
      const discounts = t.discountCents > 0 ? [{ coupon: (await stripe.coupons.create({ amount_off: t.discountCents, currency: 'eur', duration: 'once', name: quote.coupon?.code ?? 'Réduction' }, { idempotencyKey: `coupon-${order.id}` })).id }] : undefined
      const session = await stripe.checkout.sessions.create(
        {
          mode: 'payment',
          locale: 'fr',
          customer_email: order.email,
          client_reference_id: String(order.id),
          metadata: { orderId: String(order.id), orderNumber: order.number },
          payment_intent_data: { metadata: { orderId: String(order.id), orderNumber: order.number }, description: `Commande ${order.number}` },
          line_items: quote.lines.map((l) => ({
            quantity: l.quantity,
            price_data: { currency: 'eur', unit_amount: l.unitPriceCents, product_data: { name: `${l.title} — ${l.variantLabel}` } },
          })),
          discounts,
          shipping_options: [
            { shipping_rate_data: { type: 'fixed_amount', display_name: 'Livraison', fixed_amount: { amount: t.shippingCents, currency: 'eur' } } },
          ],
          success_url: returnUrl,
          cancel_url: absoluteUrl(site, '/panier?paiement=annule'),
          expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
        },
        { idempotencyKey: `session-${order.id}` },
      )
      await payload.update({ collection: 'orders', id: order.id, data: { providerRef: session.id }, context: { skipStatusEmail: true } })
      return json({ provider: 'stripe', url: session.url })
    }

    const paypalId = await createPayPalOrder({
      orderId: String(order.id),
      orderNumber: order.number,
      itemsCents: t.subtotalCents,
      shippingCents: t.shippingCents,
      discountCents: t.discountCents,
      totalCents: t.totalCents,
      lines: quote.lines.map((l) => ({ name: `${l.title} — ${l.variantLabel}`, quantity: l.quantity, unitCents: l.unitPriceCents })),
    })
    await payload.update({ collection: 'orders', id: order.id, data: { providerRef: paypalId }, context: { skipStatusEmail: true } })
    return json({ provider: 'paypal', paypalOrderId: paypalId, orderId: order.id, returnUrl })
  } catch (e) {
    payload.logger.error({ err: e }, 'checkout')
    await payload.update({ collection: 'orders', id: order.id, data: { status: 'failed', notes: String((e as Error).message) }, context: { skipStatusEmail: true } })
    return error('Le paiement n’a pas pu démarrer. Réessaie dans un instant.', 502)
  }
}
