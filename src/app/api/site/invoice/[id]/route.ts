import { error, guard, requireStaff } from '@/lib/api'
import { safeEqual } from '@/lib/crypto'
import { getPayloadClient } from '@/lib/payload'
import { renderInvoicePdf } from '@/lib/shop/invoice'

/** Facture PDF : accessible à l'équipe (éditrice/admin) ou au client via le jeton de commande. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = guard(req, 'invoice', 30, 60_000)
  if (blocked) return blocked
  const { id } = await params
  const token = new URL(req.url).searchParams.get('t')
  const payload = await getPayloadClient()
  const order = await payload.findByID({ collection: 'orders', id, depth: 0, showHiddenFields: true }).catch(() => null)
  if (!order) return error('Introuvable.', 404)

  if (token) {
    if (!order.accessToken || !safeEqual(token, order.accessToken)) return error('Introuvable.', 404)
  } else {
    const staff = await requireStaff(req, 'editor')
    if (staff instanceof Response) return staff
  }
  if (!order.invoiceNumber) return error('Facture disponible après paiement.', 409)
  const pdf = await renderInvoicePdf(payload, order)
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="facture-${order.invoiceNumber}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
