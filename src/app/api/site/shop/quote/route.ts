import { error, guard, json, readJson } from '@/lib/api'
import { getPayloadClient } from '@/lib/payload'
import { quote } from '@/lib/shop/orders'
import { CartError } from '@/lib/shop/pricing'
import { quoteSchema } from '@/lib/shop/schemas'
import { getSection } from '@/lib/site'

/** Devis du panier recalculé côté serveur (prix, promo, livraison, TVA). */
export async function POST(req: Request) {
  const blocked = guard(req, 'quote', 60, 60_000)
  if (blocked) return blocked
  if ((await getSection('shop')).status !== 'on') return error('La boutique est fermée pour le moment.', 403)
  const body = await readJson(req, quoteSchema)
  if (!body.ok) return body.res
  try {
    const payload = await getPayloadClient()
    const q = await quote(payload, body.data.cart, body.data.country, body.data.coupon || undefined, body.data.email || undefined)
    return json({
      lines: q.lines.map((l) => ({ productId: l.productId, sku: l.sku, title: l.title, variantLabel: l.variantLabel, quantity: l.quantity, unitPriceCents: l.unitPriceCents, lineTotalCents: l.lineTotalCents })),
      totals: q.totals,
      coupon: q.coupon ? { code: q.coupon.code, type: q.coupon.type } : null,
      couponError: q.couponError ?? null,
    })
  } catch (e) {
    if (e instanceof CartError) return json({ error: e.message, code: e.code }, 422)
    throw e
  }
}
