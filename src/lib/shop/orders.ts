/**
 * Cycle de vie des commandes, commun à Stripe et PayPal.
 *
 * 1. `preparePendingOrder` : le serveur recalcule tout (prix, promo, port) et crée une
 *    commande « pending » avec un instantané des articles.
 * 2. Le client paie chez Stripe ou PayPal.
 * 3. Le WEBHOOK signé appelle `markOrderPaid` : seule voie de validation d'une commande.
 *    Idempotence : un verrou unique `paid:<orderId>` dans `webhook-events` garantit qu'une
 *    commande n'est traitée qu'une fois (pas de double commande Gelato, pas de double décrément).
 */
import { randomBytes } from 'node:crypto'
import type { Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import type { Order } from '@/payload-types'
import { customerCouponUses, findCouponByCode, loadCatalog, toCoupon, toZone } from './catalog'
import { createGelatoOrder } from './gelato'
import { canTransition, type OrderStatus } from './orderStatus'
import { CartError, checkCoupon, computeTotals, findShippingZone, priceCart, type CartInputLine, type Coupon, type PricedLine, type Totals } from './pricing'

export type Address = {
  firstName: string
  lastName: string
  line1: string
  line2?: string
  postalCode: string
  city: string
  country: string
  phone?: string
}

export type Quote = { lines: PricedLine[]; totals: Totals; coupon: Coupon | null; couponId: number | null; zoneId: number; couponError?: string }

/** Calcule un devis complet à partir du panier (utilisé par le panier ET par le checkout). */
export async function quote(payload: Payload, cart: CartInputLine[], country: string, couponCode?: string, email?: string): Promise<Quote> {
  const catalog = await loadCatalog(payload, cart.map((l) => l.productId))
  const lines = priceCart(cart, catalog)
  const zones = (await payload.find({ collection: 'shipping-zones', limit: 100, depth: 0 })).docs
  const zoneDoc = zones.find((z) => String(z.id) === findShippingZone(country, zones.map(toZone))?.id)
  if (!zoneDoc) throw new CartError('Désolée, on ne livre pas encore dans ce pays.', 'ZONE')
  const settings = await payload.findGlobal({ slug: 'shop-settings', depth: 0 })

  let coupon: Coupon | null = null
  let couponId: number | null = null
  let couponError: string | undefined
  if (couponCode) {
    const doc = await findCouponByCode(payload, couponCode)
    if (!doc) couponError = 'Code inconnu.'
    else {
      const c = toCoupon(doc)
      const uses = email ? await customerCouponUses(payload, doc.id, email) : 0
      const check = checkCoupon(c, lines, new Date(), uses)
      if (check.ok) {
        coupon = c
        couponId = Number(doc.id)
      } else couponError = check.reason
    }
  }
  const totals = computeTotals({
    lines,
    coupon,
    zone: toZone(zoneDoc),
    globalFreeFromCents: Math.round((settings.freeShippingThreshold ?? 0) * 100),
    shippingVatRate: settings.vatRates?.find((r) => r.key === 'standard')?.rate ?? 20,
  })
  return { lines, totals, coupon, couponId, zoneId: Number(zoneDoc.id), couponError }
}

const orderNumber = () => {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `LIR-${ymd}-${randomBytes(3).toString('hex').toUpperCase()}`
}

async function upsertCustomer(payload: Payload, email: string, name: string, phone?: string): Promise<number> {
  const existing = await payload.find({ collection: 'customers', where: { email: { equals: email } }, limit: 1, depth: 0 })
  if (existing.docs[0]) return Number(existing.docs[0].id)
  const created = await payload.create({ collection: 'customers', data: { email, name, phone } })
  return Number(created.id)
}

export async function preparePendingOrder(
  payload: Payload,
  input: { cart: CartInputLine[]; email: string; address: Address; couponCode?: string; provider: 'stripe' | 'paypal'; testMode: boolean },
): Promise<{ order: Order; quote: Quote }> {
  const email = input.email.trim().toLowerCase()
  const q = await quote(payload, input.cart, input.address.country, input.couponCode, email)
  if (input.couponCode && q.couponError) throw new CartError(q.couponError, 'COUPON')
  const customer = await upsertCustomer(payload, email, `${input.address.firstName} ${input.address.lastName}`, input.address.phone)
  const order = await payload.create({
    collection: 'orders',
    data: {
      number: orderNumber(),
      status: 'pending',
      testMode: input.testMode,
      email,
      customer,
      provider: input.provider,
      items: q.lines.map((l, i) => ({
        title: l.title,
        variantLabel: l.variantLabel,
        sku: l.sku,
        quantity: l.quantity,
        unitPrice: l.unitPriceCents,
        discount: q.totals.lineDiscounts[i],
        vatRate: l.vatRate,
        fulfillment: l.fulfillment,
        product: Number(l.productId),
        gelatoProductUid: l.gelatoProductUid,
        gelatoFileUrl: l.gelatoFileUrl,
      })),
      amounts: {
        subtotal: q.totals.subtotalCents,
        discount: q.totals.discountCents,
        shipping: q.totals.shippingCents,
        vat: q.totals.vatCents,
        vatBreakdown: q.totals.vatBreakdown,
      },
      total: q.totals.totalCents / 100,
      coupon: q.couponId,
      couponCode: q.coupon?.code,
      shippingZone: q.zoneId,
      shippingAddress: input.address,
      accessToken: randomBytes(24).toString('base64url'),
    },
  })
  return { order, quote: q }
}

/** Pose un verrou idempotent. Renvoie false si l'événement a déjà été traité. */
export async function claimEvent(payload: Payload, eventId: string, source: string, type?: string, orderId?: number | string): Promise<boolean> {
  try {
    await payload.create({
      collection: 'webhook-events',
      data: { eventId, source, type, order: orderId ? Number(orderId) : undefined },
      overrideAccess: true,
    })
    return true
  } catch (err) {
    const msg = String((err as Error)?.message ?? err)
    if (/unique|duplicate|already/i.test(msg) || (err as { status?: number }).status === 400) return false
    throw err
  }
}

async function nextInvoiceNumber(payload: Payload, prefix: string): Promise<string> {
  const year = new Date().getFullYear()
  const seq = `invoice_seq_${year}`
  const db = payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<{ rows: { n: string }[] }> } }
  await db.drizzle.execute(sql.raw(`CREATE SEQUENCE IF NOT EXISTS ${seq} START 1`))
  const r = await db.drizzle.execute(sql.raw(`SELECT nextval('${seq}') AS n`))
  return `${prefix}-${year}-${String(r.rows[0].n).padStart(5, '0')}`
}

export type PaidInfo = { provider: 'stripe' | 'paypal'; paymentId: string; amountCents: number; eventId: string }

/**
 * Valide le paiement d'une commande (appelé UNIQUEMENT depuis un webhook vérifié).
 * Retourne 'processed', 'duplicate' ou 'mismatch'.
 */
export async function markOrderPaid(payload: Payload, orderId: string | number, info: PaidInfo): Promise<'processed' | 'duplicate' | 'mismatch' | 'not_found'> {
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0 }).catch(() => null)
  if (!order) return 'not_found'
  if (!(await claimEvent(payload, `paid:${order.id}`, info.provider, 'order.paid', order.id))) return 'duplicate'

  const expected = Math.round((order.total ?? 0) * 100)
  if (info.amountCents !== expected) {
    payload.logger.error(`Commande ${order.number} : montant payé ${info.amountCents} ≠ attendu ${expected}`)
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { notes: `${order.notes ?? ''}\n⚠️ Montant payé (${info.amountCents / 100} €) différent du total. Vérifier avant expédition.`.trim() },
      context: { skipStatusEmail: true },
    })
  }

  const settings = await payload.findGlobal({ slug: 'shop-settings', depth: 0 })
  const invoiceNumber = order.testMode ? `TEST-${order.number}` : await nextInvoiceNumber(payload, settings.invoice?.prefix || 'LIR')

  const paid = await payload.update({
    collection: 'orders',
    id: order.id,
    data: { status: 'paid', paymentId: info.paymentId, paidAt: new Date().toISOString(), invoiceNumber },
    context: { skipStatusEmail: true },
  })

  // Effets de bord (chacun protégé : un échec n'annule pas le paiement).
  await Promise.allSettled([decrementStock(payload, paid), countCoupon(payload, paid), updateCustomerStats(payload, paid)])

  const { sendOrderConfirmation } = await import('./emails')
  await sendOrderConfirmation(payload, paid).catch((err) => payload.logger.error({ err }, 'email confirmation'))

  if ((paid.items ?? []).some((i) => i.fulfillment === 'gelato')) {
    const g = await createGelatoOrder(payload, paid)
    if (!g.ok && !('skipped' in g && g.skipped)) payload.logger.error(`Gelato (${paid.number}) : ${g.error}`)
  }
  return info.amountCents === expected ? 'processed' : 'mismatch'
}

async function decrementStock(payload: Payload, order: Order) {
  const stockItems = (order.items ?? []).filter((i) => i.fulfillment === 'stock' && i.product)
  for (const item of stockItems) {
    const productId = typeof item.product === 'object' ? item.product!.id : item.product!
    const p = await payload.findByID({ collection: 'products', id: productId, depth: 0 })
    const variants = (p.variants ?? []).map((v) => (v.sku === item.sku ? { ...v, stock: Math.max(0, (v.stock ?? 0) - (item.quantity ?? 0)) } : v))
    await payload.update({ collection: 'products', id: productId, data: { variants } })
  }
}

async function countCoupon(payload: Payload, order: Order) {
  if (!order.coupon) return
  const id = typeof order.coupon === 'object' ? order.coupon.id : order.coupon
  const c = await payload.findByID({ collection: 'coupons', id, depth: 0 })
  await payload.update({
    collection: 'coupons',
    id,
    data: { usageCount: (c.usageCount ?? 0) + 1, revenue: Math.round(((c.revenue ?? 0) + (order.total ?? 0)) * 100) / 100 },
  })
}

async function updateCustomerStats(payload: Payload, order: Order) {
  if (!order.customer) return
  const id = typeof order.customer === 'object' ? order.customer.id : order.customer
  const c = await payload.findByID({ collection: 'customers', id, depth: 0 })
  await payload.update({
    collection: 'customers',
    id,
    data: { ordersCount: (c.ordersCount ?? 0) + 1, totalSpent: Math.round(((c.totalSpent ?? 0) + (order.total ?? 0)) * 100) / 100 },
  })
}

/** Change le statut en respectant la machine à états ; envoie l'email correspondant. */
export async function transitionOrder(payload: Payload, order: Order, to: OrderStatus, extra: Partial<Order> = {}): Promise<Order | null> {
  if (!canTransition(order.status as OrderStatus, to)) return null
  return payload.update({ collection: 'orders', id: order.id, data: { ...extra, status: to } })
}

export async function markOrderFailed(payload: Payload, orderId: string | number) {
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0 }).catch(() => null)
  if (order && order.status === 'pending') {
    await payload.update({ collection: 'orders', id: order.id, data: { status: 'failed' }, context: { skipStatusEmail: true } })
  }
}
