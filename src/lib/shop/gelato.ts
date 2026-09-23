/**
 * Gelato (print-on-demand) : création de commande après paiement + lecture des webhooks.
 * Idempotence : orderReferenceId = notre id de commande ; on ne recrée jamais une commande
 * si `fulfillment.gelatoOrderId` est déjà renseigné.
 */
import type { Payload } from 'payload'
import type { Order } from '@/payload-types'
import { getIntegrations } from '../settings'

const API = 'https://order.gelatoapis.com/v4'

export type GelatoResult = { ok: true; gelatoOrderId: string } | { ok: false; error: string; skipped?: boolean }

export async function createGelatoOrder(payload: Payload, order: Order): Promise<GelatoResult> {
  if (order.fulfillment?.gelatoOrderId) return { ok: true, gelatoOrderId: order.fulfillment.gelatoOrderId }
  const items = (order.items ?? []).filter((i) => i.fulfillment === 'gelato')
  if (items.length === 0) return { ok: false, error: 'Aucun article Gelato', skipped: true }
  const { gelato, testMode } = await getIntegrations()
  if (!gelato.apiKey) return { ok: false, error: 'Clé API Gelato non configurée' }
  const missing = items.find((i) => !i.gelatoProductUid || !i.gelatoFileUrl)
  if (missing) return { ok: false, error: `Variante « ${missing.title} ${missing.variantLabel} » sans productUid ou fichier d’impression` }

  const a = order.shippingAddress ?? {}
  const body = {
    orderType: testMode ? 'draft' : 'order', // en mode test, brouillon : rien n'est fabriqué ni facturé
    orderReferenceId: String(order.id),
    customerReferenceId: order.email,
    currency: 'EUR',
    items: items.map((i, idx) => ({
      itemReferenceId: `${order.id}-${idx}`,
      productUid: i.gelatoProductUid,
      files: [{ type: 'default', url: i.gelatoFileUrl }],
      quantity: i.quantity,
    })),
    shippingAddress: {
      firstName: a.firstName,
      lastName: a.lastName,
      addressLine1: a.line1,
      addressLine2: a.line2 || undefined,
      city: a.city,
      postCode: a.postalCode,
      country: a.country,
      email: order.email,
      phone: a.phone || undefined,
    },
  }

  const r = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': gelato.apiKey },
    body: JSON.stringify(body),
  })
  const data = (await r.json().catch(() => ({}))) as { id?: string; message?: string }
  if (!r.ok || !data.id) {
    const error = `Gelato ${r.status}: ${data.message ?? 'erreur inconnue'}`
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { fulfillment: { ...order.fulfillment, gelatoError: error } },
      context: { skipStatusEmail: true },
    })
    return { ok: false, error }
  }
  await payload.update({
    collection: 'orders',
    id: order.id,
    data: { fulfillment: { ...order.fulfillment, gelatoOrderId: data.id, gelatoStatus: 'created', gelatoError: null } },
    context: { skipStatusEmail: true },
  })
  return { ok: true, gelatoOrderId: data.id }
}

export type GelatoWebhook = {
  id?: string
  event?: string
  orderId?: string
  orderReferenceId?: string
  fulfillmentStatus?: string
  items?: { fulfillments?: { trackingCode?: string; trackingUrl?: string; shipmentMethodName?: string }[] }[]
  trackingCode?: string
  trackingUrl?: string
  shipmentMethodName?: string
}

/** Extrait un éventuel numéro de suivi d'un webhook Gelato (plusieurs formats possibles). */
export function extractTracking(evt: GelatoWebhook): { trackingNumber?: string; trackingUrl?: string; carrier?: string } {
  if (evt.trackingCode || evt.trackingUrl) return { trackingNumber: evt.trackingCode, trackingUrl: evt.trackingUrl, carrier: evt.shipmentMethodName }
  const f = evt.items?.flatMap((i) => i.fulfillments ?? []).find((x) => x.trackingCode || x.trackingUrl)
  return f ? { trackingNumber: f.trackingCode, trackingUrl: f.trackingUrl, carrier: f.shipmentMethodName } : {}
}
