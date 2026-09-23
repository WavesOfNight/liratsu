import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'
import { AeroWindow } from '@/components/AeroWindow'
import { OrderTracker } from '@/components/shop/OrderTracker'
import { safeEqual } from '@/lib/crypto'
import { formatEuros } from '@/lib/shop/pricing'
import { getSiteData } from '@/lib/site'

export const metadata: Metadata = { title: 'Ma commande', robots: { index: false } }

/** Suivi de commande (lien secret envoyé par email / retour de paiement). */
export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  const { id } = await params
  const { t = '' } = await searchParams
  const { payload } = await getSiteData()
  const order = await payload.findByID({ collection: 'orders', id, depth: 0, showHiddenFields: true }).catch(() => null)
  if (!order || !order.accessToken || !safeEqual(t, order.accessToken)) notFound()
  const f = order.fulfillment ?? {}

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <header className="page-head">
        <h1>Commande {order.number}</h1>
      </header>
      <AeroWindow title="Suivi de commande" icon="shop">
        <OrderTracker id={String(order.id)} token={t} initialStatus={order.status} />
        <ul style={{ paddingLeft: 18 }}>
          {order.items?.map((i) => (
            <li key={i.id}>
              {i.title} — {i.variantLabel} × {i.quantity}
            </li>
          ))}
        </ul>
        <p>
          <strong>Total : {formatEuros(Math.round((order.total ?? 0) * 100))}</strong>
        </p>
        {(f.trackingNumber || f.trackingUrl) && (
          <p>
            📦 Suivi : {f.carrier} {f.trackingNumber}{' '}
            {f.trackingUrl && (
              <a href={f.trackingUrl} target="_blank" rel="noopener noreferrer">
                Suivre le colis
              </a>
            )}
          </p>
        )}
        {order.invoiceNumber && (
          <p>
            <a className="candy-btn candy-btn--ghost candy-btn--small" href={`/api/site/invoice/${order.id}?t=${encodeURIComponent(t)}`}>
              📄 Télécharger la facture
            </a>
          </p>
        )}
      </AeroWindow>
    </div>
  )
}
