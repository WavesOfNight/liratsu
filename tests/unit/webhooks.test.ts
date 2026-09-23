/**
 * Tests des webhooks : vérification de signature (Stripe réel en mode hors-ligne,
 * PayPal et Gelato simulés) et idempotence de la validation de commande.
 */
import Stripe from 'stripe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const WHSEC = 'whsec_test_secret'
const stripe = new Stripe('sk_test_dummy')

const markOrderPaid = vi.fn(async () => 'processed')
const markOrderFailed = vi.fn(async () => undefined)
const seen = new Set<string>()
const claimEvent = vi.fn(async (_p: unknown, id: string) => {
  if (seen.has(id)) return false
  seen.add(id)
  return true
})
const update = vi.fn(async () => ({}))
const findByID = vi.fn(async () => ({ id: 42, status: 'paid', fulfillment: {} }))

vi.mock('@/lib/shop/stripe', () => ({ getStripe: async () => ({ stripe, webhookSecret: WHSEC, publishableKey: 'pk' }) }))
vi.mock('@/lib/payload', () => ({ getPayloadClient: async () => ({ update, findByID, find: async () => ({ docs: [] }) }) }))
vi.mock('@/lib/shop/orders', () => ({ markOrderPaid, markOrderFailed, claimEvent }))
vi.mock('@/lib/shop/paypal', () => ({ verifyPayPalWebhook: async (h: Headers) => h.get('paypal-transmission-sig') === 'valid' }))
vi.mock('@/lib/settings', () => ({ getIntegrations: async () => ({ gelato: { webhookToken: 'tok-123' } }) }))

const { POST: stripeHook } = await import('@/app/api/site/webhooks/stripe/route')
const { POST: paypalHook } = await import('@/app/api/site/webhooks/paypal/route')
const { POST: gelatoHook } = await import('@/app/api/site/webhooks/gelato/route')

function stripeRequest(event: object, secret = WHSEC) {
  const body = JSON.stringify(event)
  const sig = stripe.webhooks.generateTestHeaderString({ payload: body, secret })
  return new Request('http://localhost/api/site/webhooks/stripe', { method: 'POST', body, headers: { 'stripe-signature': sig } })
}

const sessionEvent = (id: string, status = 'paid') => ({
  id,
  object: 'event',
  type: 'checkout.session.completed',
  data: { object: { id: 'cs_1', object: 'checkout.session', metadata: { orderId: '42' }, client_reference_id: '42', payment_status: status, amount_total: 1720, payment_intent: 'pi_1' } },
})

beforeEach(() => {
  vi.clearAllMocks()
  seen.clear()
})

describe('webhook Stripe', () => {
  it('rejette une signature invalide', async () => {
    const res = await stripeHook(stripeRequest(sessionEvent('evt_1'), 'whsec_autre'))
    expect(res.status).toBe(400)
    expect(markOrderPaid).not.toHaveBeenCalled()
  })
  it('valide la commande avec le montant réellement payé', async () => {
    const res = await stripeHook(stripeRequest(sessionEvent('evt_2')))
    expect(res.status).toBe(200)
    expect(markOrderPaid).toHaveBeenCalledWith(expect.anything(), '42', expect.objectContaining({ provider: 'stripe', paymentId: 'pi_1', amountCents: 1720 }))
  })
  it('est idempotent : un événement rejoué n’est traité qu’une fois', async () => {
    await stripeHook(stripeRequest(sessionEvent('evt_3')))
    await stripeHook(stripeRequest(sessionEvent('evt_3')))
    expect(markOrderPaid).toHaveBeenCalledTimes(1)
  })
  it('ignore une session non payée (paiement différé)', async () => {
    await stripeHook(stripeRequest(sessionEvent('evt_4', 'unpaid')))
    expect(markOrderPaid).not.toHaveBeenCalled()
  })
})

describe('webhook PayPal', () => {
  const capture = (id: string) =>
    JSON.stringify({ id, event_type: 'PAYMENT.CAPTURE.COMPLETED', resource: { id: 'CAP-1', custom_id: '42', amount: { value: '17.20', currency_code: 'EUR' } } })
  it('rejette une signature invalide', async () => {
    const res = await paypalHook(new Request('http://x', { method: 'POST', body: capture('WH-1'), headers: { 'paypal-transmission-sig': 'bad' } }))
    expect(res.status).toBe(400)
  })
  it('valide la commande (montant en centimes) une seule fois', async () => {
    const req = () => new Request('http://x', { method: 'POST', body: capture('WH-2'), headers: { 'paypal-transmission-sig': 'valid' } })
    await paypalHook(req())
    await paypalHook(req())
    expect(markOrderPaid).toHaveBeenCalledTimes(1)
    expect(markOrderPaid).toHaveBeenCalledWith(expect.anything(), '42', expect.objectContaining({ provider: 'paypal', paymentId: 'CAP-1', amountCents: 1720 }))
  })
})

describe('webhook Gelato', () => {
  const body = JSON.stringify({ id: 'g1', event: 'order_status_updated', orderReferenceId: '42', fulfillmentStatus: 'shipped', trackingCode: 'TRK1', trackingUrl: 'https://track' })
  it('exige le jeton secret', async () => {
    const res = await gelatoHook(new Request('http://x/api/site/webhooks/gelato?token=faux', { method: 'POST', body }))
    expect(res.status).toBe(401)
  })
  it('met à jour statut et suivi', async () => {
    const res = await gelatoHook(new Request('http://x/api/site/webhooks/gelato?token=tok-123', { method: 'POST', body }))
    expect(res.status).toBe(200)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 42, data: expect.objectContaining({ status: 'shipped', fulfillment: expect.objectContaining({ trackingNumber: 'TRK1' }) }) }),
    )
  })
})
