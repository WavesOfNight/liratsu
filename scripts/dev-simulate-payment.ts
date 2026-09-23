/**
 * Outil de dev : simule un paiement réussi (comme le ferait un webhook Stripe/PayPal)
 * pour tester la chaîne complète sans clés : commande → paiement → stock, promo,
 * facture, email (journalisé si pas de SMTP), Gelato (en erreur propre si pas de clé).
 *
 *   npx payload run scripts/dev-simulate-payment.ts
 */
import { writeFileSync } from 'node:fs'
import config from '@payload-config'
import { getPayload } from 'payload'
import { markOrderPaid, preparePendingOrder } from '../src/lib/shop/orders'
import { renderInvoicePdf } from '../src/lib/shop/invoice'

const payload = await getPayload({ config })
const products = await payload.find({ collection: 'products', where: { slug: { equals: 'test-stickers-bulles' } }, limit: 1 })
const p = products.docs[0]
if (!p) throw new Error('Lance d’abord npm run seed')
const stockBefore = p.variants?.[0]?.stock

const { order } = await preparePendingOrder(payload, {
  cart: [{ productId: String(p.id), sku: 'TEST-STICK-6', quantity: 2 }],
  email: `client.test+${Date.now()}@example.com`,
  address: { firstName: 'Bulle', lastName: 'Test', line1: '1 rue des Poissons', postalCode: '75001', city: 'Paris', country: 'FR' },
  couponCode: 'TEST10',
  provider: 'stripe',
  testMode: true,
})
console.log(`Commande ${order.number} créée (${order.status}), total ${order.total} €`)
const amount = Math.round((order.total ?? 0) * 100)
const first = await markOrderPaid(payload, order.id, { provider: 'stripe', paymentId: 'pi_simule', amountCents: amount, eventId: 'evt_sim_1' })
const second = await markOrderPaid(payload, order.id, { provider: 'stripe', paymentId: 'pi_simule', amountCents: amount, eventId: 'evt_sim_2' })
const paid = await payload.findByID({ collection: 'orders', id: order.id })
const after = await payload.findByID({ collection: 'products', id: p.id })
const coupon = await payload.find({ collection: 'coupons', where: { code: { equals: 'TEST10' } } })
console.log({ first, second, status: paid.status, invoice: paid.invoiceNumber, stock: `${stockBefore} → ${after.variants?.[0]?.stock}`, couponUses: coupon.docs[0]?.usageCount })
const pdf = await renderInvoicePdf(payload, paid)
const out = `${process.env.TMP ?? '.'}/facture-test.pdf`
writeFileSync(out, pdf)
console.log(`Facture PDF : ${out} (${pdf.length} octets)`)
process.exit(0)
