import { z } from 'zod'
import { error, guard, json, readJson } from '@/lib/api'
import { getPayloadClient } from '@/lib/payload'
import { capturePayPalOrder } from '@/lib/shop/paypal'

const schema = z.object({ paypalOrderId: z.string().min(5).max(64) })

/**
 * Capture PayPal après approbation par l'acheteur (appel serveur → PayPal).
 * Important : on ne marque PAS la commande payée ici ; c'est le webhook
 * PAYMENT.CAPTURE.COMPLETED signé qui la valide.
 */
export async function POST(req: Request) {
  const blocked = guard(req, 'paypal-capture', 10, 10 * 60_000)
  if (blocked) return blocked
  const body = await readJson(req, schema)
  if (!body.ok) return body.res
  const payload = await getPayloadClient()
  const r = await payload.find({ collection: 'orders', where: { providerRef: { equals: body.data.paypalOrderId } }, limit: 1, depth: 0 })
  const order = r.docs[0]
  if (!order) return error('Commande introuvable.', 404)
  try {
    const capture = await capturePayPalOrder(body.data.paypalOrderId)
    return json({ status: capture.status, redirect: `/commande/${order.id}?t=${order.accessToken}` })
  } catch (e) {
    payload.logger.error({ err: e }, 'paypal capture')
    return error('Le paiement PayPal n’a pas abouti.', 502)
  }
}
