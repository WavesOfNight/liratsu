/** Emails de commande : confirmation (avec facture), production, expédition, livraison, annulation, remboursement. */
import type { Payload } from 'payload'
import type { Order } from '@/payload-types'
import { escapeHtml as esc, layoutEmail, sendMail } from '../mail'
import { renderInvoicePdf } from './invoice'
import { ORDER_STATUS_LABELS, type OrderStatus } from './orderStatus'
import { formatEuros } from './pricing'

async function siteUrl(payload: Payload) {
  const s = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  return (s.siteUrl || process.env.NEXT_PUBLIC_SERVER_URL || 'https://liratsu.fr').replace(/\/$/, '')
}

const orderLink = (base: string, o: Order) => `${base}/commande/${o.id}?t=${o.accessToken}`

function itemsTable(o: Order) {
  const rows = (o.items ?? [])
    .map((i) => `<tr><td style="padding:4px 0">${esc(i.title ?? '')} — ${esc(i.variantLabel ?? '')} × ${i.quantity}</td><td align="right">${formatEuros((i.unitPrice ?? 0) * (i.quantity ?? 0))}</td></tr>`)
    .join('')
  const am = o.amounts ?? {}
  return `<table width="100%" style="border-collapse:collapse;font-size:14px">${rows}
<tr><td style="padding-top:8px">Livraison</td><td align="right">${formatEuros(am.shipping ?? 0)}</td></tr>
${am.discount ? `<tr><td>Réduction ${esc(o.couponCode ?? '')}</td><td align="right">− ${formatEuros(am.discount)}</td></tr>` : ''}
<tr><td style="padding-top:8px"><strong>Total TTC</strong></td><td align="right"><strong>${formatEuros(Math.round((o.total ?? 0) * 100))}</strong></td></tr></table>`
}

async function markSent(payload: Payload, o: Order, key: string) {
  const sent = { ...((o.emailsSent as Record<string, string>) ?? {}), [key]: new Date().toISOString() }
  await payload.update({ collection: 'orders', id: o.id, data: { emailsSent: sent }, context: { skipStatusEmail: true } })
}

export async function sendOrderConfirmation(payload: Payload, o: Order) {
  const base = await siteUrl(payload)
  const pdf = await renderInvoicePdf(payload, o)
  const name = o.shippingAddress?.firstName ?? ''
  const html = layoutEmail(
    `Commande ${o.number} confirmée`,
    `<p>Coucou ${esc(name)} ✦</p><p>Merci infiniment pour ta commande ! Elle est bien payée et part en préparation.${
      (o.items ?? []).some((i) => i.fulfillment === 'gelato') ? ' Les articles imprimés à la demande sont fabriqués spécialement pour toi : compte quelques jours de fabrication avant l’expédition.' : ''
    }</p>${itemsTable(o)}<p>Ta facture est jointe à cet email. Tu peux suivre ta commande ici : <a href="${orderLink(base, o)}">suivre ma commande</a>.</p><p>Des bulles et des bisous,<br>Liratsu</p>`,
    base,
  )
  const r = await sendMail({
    to: o.email,
    subject: `✦ Commande ${o.number} confirmée — Liratsu`,
    html,
    text: `Merci pour ta commande ${o.number} ! Total : ${formatEuros(Math.round((o.total ?? 0) * 100))}. Suivi : ${orderLink(base, o)}`,
    attachments: [{ filename: `facture-${o.invoiceNumber}.pdf`, content: pdf }],
  })
  if (r.sent) await markSent(payload, o, 'confirmation')
}

const STATUS_COPY: Partial<Record<OrderStatus, (o: Order) => string>> = {
  in_production: () => '<p>Ta commande est en cours de fabrication ! On te prévient dès qu’elle est expédiée.</p>',
  shipped: (o) => {
    const f = o.fulfillment ?? {}
    return `<p>Bonne nouvelle : ta commande est expédiée 📦</p>${
      f.trackingNumber || f.trackingUrl
        ? `<p>Transporteur : ${esc(f.carrier ?? '—')}<br>N° de suivi : <strong>${esc(f.trackingNumber ?? '—')}</strong>${f.trackingUrl ? `<br><a href="${esc(f.trackingUrl)}">Suivre le colis</a>` : ''}</p>`
        : ''
    }`
  },
  delivered: () => '<p>Ta commande a été livrée ! J’espère qu’elle te plaît ✦ N’hésite pas à me montrer ça sur Discord ou en live.</p>',
  cancelled: () => '<p>Ta commande a été annulée. Si un paiement a été effectué, il te sera remboursé. Une question ? Réponds simplement à cet email.</p>',
  refunded: () => '<p>Ta commande a été remboursée. Le montant apparaîtra sur ton moyen de paiement sous quelques jours.</p>',
  partially_refunded: (o) =>
    `<p>Un remboursement partiel de ${formatEuros(o.refunds?.at(-1)?.amount ?? 0)} a été effectué sur ta commande. Il apparaîtra sous quelques jours.</p>`,
}

export async function sendOrderStatusEmail(payload: Payload, o: Order, status: OrderStatus) {
  const copy = STATUS_COPY[status]
  if (!copy) return
  const base = await siteUrl(payload)
  const r = await sendMail({
    to: o.email,
    subject: `Commande ${o.number} : ${ORDER_STATUS_LABELS[status].toLowerCase()} — Liratsu`,
    html: layoutEmail(`Commande ${o.number}`, `${copy(o)}<p><a href="${orderLink(base, o)}">Voir ma commande</a></p><p>Liratsu</p>`, base),
    text: `Commande ${o.number} : ${ORDER_STATUS_LABELS[status]}. ${orderLink(base, o)}`,
  })
  if (r.sent) await markSent(payload, o, status)
}
