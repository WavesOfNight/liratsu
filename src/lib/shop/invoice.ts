/**
 * Génération de facture PDF (pdfkit) au nom de l'émetteur configuré (Reads Records).
 * Prix TTC, TVA extraite par taux.
 */
import PDFDocument from 'pdfkit'
import type { Payload } from 'payload'
import type { Order } from '@/payload-types'
import { formatEuros, vatFromGross } from './pricing'

export async function renderInvoicePdf(payload: Payload, order: Order): Promise<Buffer> {
  const [shop, legal] = await Promise.all([
    payload.findGlobal({ slug: 'shop-settings', depth: 0 }),
    payload.findGlobal({ slug: 'legal-identity', depth: 0 }),
  ])
  const issuer = shop.invoice?.issuerName || legal.editeur?.nom || 'Reads Records'
  const details =
    shop.invoice?.issuerDetails ||
    [legal.editeur?.forme && [legal.editeur.forme, legal.editeur.capital && `au capital de ${legal.editeur.capital}`].filter(Boolean).join(' '), legal.editeur?.siege, legal.editeur?.rcs, legal.editeur?.siren && `SIREN ${legal.editeur.siren}`, legal.editeur?.tva && `TVA ${legal.editeur.tva}`]
      .filter(Boolean)
      .join('\n')

  const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `Facture ${order.invoiceNumber}`, Author: issuer } })
  const chunks: Buffer[] = []
  doc.on('data', (c: Buffer) => chunks.push(c))
  const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  const blue = '#1E6FD9'
  doc.rect(0, 0, doc.page.width, 90).fill('#3FA9F5')
  doc.fillColor('#ffffff').fontSize(26).font('Helvetica-Bold').text('Liratsu', 48, 30)
  doc.fontSize(10).font('Helvetica').text('Boutique officielle', 48, 60)
  doc.fontSize(18).font('Helvetica-Bold').text(order.testMode ? 'FACTURE (TEST)' : 'FACTURE', 300, 34, { align: 'right', width: 247 })

  doc.fillColor('#1B2240').fontSize(10).font('Helvetica-Bold').text(issuer, 48, 115)
  doc.font('Helvetica').text(details || '[Coordonnées de l’émetteur à compléter dans l’admin]', 48, 130, { width: 250 })

  const a = order.shippingAddress ?? {}
  doc.font('Helvetica-Bold').text('Facturé à', 330, 115)
  doc
    .font('Helvetica')
    .text([`${a.firstName ?? ''} ${a.lastName ?? ''}`, a.line1, a.line2, `${a.postalCode ?? ''} ${a.city ?? ''}`, a.country, order.email].filter(Boolean).join('\n'), 330, 130)

  doc
    .fillColor(blue)
    .font('Helvetica-Bold')
    .text(`N° ${order.invoiceNumber ?? '—'}`, 48, 225)
    .fillColor('#1B2240')
    .font('Helvetica')
    .text(`Date : ${new Date(order.paidAt ?? order.createdAt).toLocaleDateString('fr-FR')}   ·   Commande ${order.number}   ·   Paiement ${order.provider === 'stripe' ? 'carte (Stripe)' : 'PayPal'}`, 48, 240)

  let y = 275
  const cols = [48, 290, 340, 400, 470]
  doc.rect(48, y - 4, 499, 20).fill('#EAF5FF').fillColor('#1B2240').font('Helvetica-Bold')
  ;['Article', 'Qté', 'PU TTC', 'TVA', 'Total TTC'].forEach((h, i) => doc.text(h, cols[i], y, { width: i === 0 ? 230 : 70 }))
  doc.font('Helvetica')
  y += 24
  for (const it of order.items ?? []) {
    const total = (it.unitPrice ?? 0) * (it.quantity ?? 0) - (it.discount ?? 0)
    doc.text(`${it.title} — ${it.variantLabel}${it.discount ? ` (remise ${formatEuros(it.discount)})` : ''}`, cols[0], y, { width: 235 })
    doc.text(String(it.quantity), cols[1], y)
    doc.text(formatEuros(it.unitPrice ?? 0), cols[2], y)
    doc.text(`${it.vatRate} %`, cols[3], y)
    doc.text(formatEuros(total), cols[4], y)
    y += 28
  }
  const am = order.amounts ?? {}
  if (am.shipping) {
    doc.text('Livraison', cols[0], y)
    doc.text(formatEuros(am.shipping), cols[4], y)
    y += 22
  }
  y += 10
  doc.moveTo(300, y).lineTo(547, y).strokeColor('#3FA9F5').stroke()
  y += 10
  const row = (label: string, value: string, bold = false) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').text(label, 300, y).text(value, 440, y, { width: 107, align: 'right' })
    y += 18
  }
  row('Sous-total TTC', formatEuros(am.subtotal ?? 0))
  if (am.discount) row(`Réduction${order.couponCode ? ` (${order.couponCode})` : ''}`, `- ${formatEuros(am.discount)}`)
  row('Livraison TTC', formatEuros(am.shipping ?? 0))
  const breakdown = (am.vatBreakdown as { rate: number; vatCents: number }[] | null) ?? []
  for (const b of breakdown) row(`dont TVA ${b.rate} %`, formatEuros(b.vatCents))
  const total = Math.round((order.total ?? 0) * 100)
  row('Total HT', formatEuros(total - (am.vat ?? breakdown.reduce((s, b) => s + b.vatCents, 0))))
  row('TOTAL TTC', formatEuros(total), true)
  for (const r of order.refunds ?? []) row(`Remboursé le ${new Date(r.at ?? '').toLocaleDateString('fr-FR')}`, `- ${formatEuros(r.amount ?? 0)}`)

  doc
    .fontSize(8)
    .fillColor('#46507a')
    .text(shop.invoice?.footer ?? '', 48, 725, { width: 499, align: 'center', lineBreak: true })
    .text('Pas d’escompte pour paiement anticipé. Pénalités de retard : 3 fois le taux d’intérêt légal. Indemnité forfaitaire pour frais de recouvrement : 40 €.', 48, 750, {
      width: 499,
      align: 'center',
    })
  doc.end()
  return done
}

export { vatFromGross }
