/**
 * PayPal Checkout (API REST v2) : création de commande, capture, vérification de webhook,
 * remboursement. Aucune dépendance : appels fetch directs.
 */
import { cached } from '../cache'
import { getIntegrations } from '../settings'

async function token(): Promise<{ token: string; base: string }> {
  const { paypal } = await getIntegrations()
  if (!paypal.clientId || !paypal.clientSecret) throw new Error('PayPal non configuré')
  const t = await cached(`paypal:token:${paypal.clientId}`, 8 * 60_000, async () => {
    const r = await fetch(`${paypal.apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${paypal.clientId}:${paypal.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })
    if (!r.ok) throw new Error(`PayPal token ${r.status}`)
    return ((await r.json()) as { access_token: string }).access_token
  })
  return { token: t, base: paypal.apiBase }
}

async function api<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
  const { token: t, base } = await token()
  const r = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${t}`,
      'Content-Type': 'application/json',
      ...(init.idempotencyKey ? { 'PayPal-Request-Id': init.idempotencyKey } : {}),
      ...init.headers,
    },
  })
  const data = (await r.json().catch(() => ({}))) as T & { message?: string }
  if (!r.ok) throw new Error(`PayPal ${path} ${r.status}: ${data.message ?? ''}`)
  return data
}

const eur = (cents: number) => ({ currency_code: 'EUR', value: (cents / 100).toFixed(2) })

export async function createPayPalOrder(opts: {
  orderId: string
  orderNumber: string
  itemsCents: number
  shippingCents: number
  discountCents: number
  totalCents: number
  lines: { name: string; quantity: number; unitCents: number }[]
}): Promise<string> {
  const d = await api<{ id: string }>('/v2/checkout/orders', {
    method: 'POST',
    idempotencyKey: `create-${opts.orderId}`,
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: opts.orderId,
          custom_id: opts.orderId,
          invoice_id: opts.orderNumber,
          description: `Commande ${opts.orderNumber} — boutique Liratsu`,
          amount: {
            ...eur(opts.totalCents),
            breakdown: {
              item_total: eur(opts.itemsCents),
              shipping: eur(opts.shippingCents),
              discount: eur(opts.discountCents),
            },
          },
          items: opts.lines.map((l) => ({ name: l.name.slice(0, 127), quantity: String(l.quantity), unit_amount: eur(l.unitCents), category: 'PHYSICAL_GOODS' })),
        },
      ],
      application_context: { shipping_preference: 'NO_SHIPPING', brand_name: 'Liratsu', locale: 'fr-FR', user_action: 'PAY_NOW' },
    }),
  })
  return d.id
}

export type PayPalCapture = { status: string; purchase_units: { payments?: { captures?: { id: string; status: string; custom_id?: string; amount: { value: string } }[] } }[] }

export async function capturePayPalOrder(paypalOrderId: string): Promise<PayPalCapture> {
  return api<PayPalCapture>(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: 'POST',
    idempotencyKey: `capture-${paypalOrderId}`,
    body: '{}',
  })
}

/** Vérification de signature d'un webhook via l'API PayPal (méthode officielle). */
export async function verifyPayPalWebhook(headers: Headers, rawBody: string): Promise<boolean> {
  const { paypal } = await getIntegrations()
  if (!paypal.webhookId) return false
  const h = (k: string) => headers.get(k) ?? ''
  const d = await api<{ verification_status: string }>('/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    body: JSON.stringify({
      auth_algo: h('paypal-auth-algo'),
      cert_url: h('paypal-cert-url'),
      transmission_id: h('paypal-transmission-id'),
      transmission_sig: h('paypal-transmission-sig'),
      transmission_time: h('paypal-transmission-time'),
      webhook_id: paypal.webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  })
  return d.verification_status === 'SUCCESS'
}

export async function refundPayPalCapture(captureId: string, amountCents: number | null, key: string): Promise<{ id: string; status: string }> {
  return api<{ id: string; status: string }>(`/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, {
    method: 'POST',
    idempotencyKey: key,
    body: JSON.stringify(amountCents ? { amount: eur(amountCents) } : {}),
  })
}
