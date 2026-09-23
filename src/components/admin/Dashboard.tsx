/**
 * Tableau de bord de l'admin (composant serveur) : commandes récentes, CA du mois,
 * codes promo les plus utilisés, statut live, éléments à modérer.
 */
import React from 'react'
import type { Payload } from 'payload'
import { getLiveStatus } from '@/lib/twitch'
import { formatEuros } from '@/lib/shop/pricing'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/shop/orderStatus'

const card: React.CSSProperties = {
  background: 'var(--theme-elevation-50)',
  borderRadius: 16,
  padding: 16,
  border: '1px solid var(--theme-elevation-100)',
}

export async function Dashboard({ payload, user }: { payload: Payload; user?: { roles?: string[] } | null }) {
  const roles = user?.roles ?? []
  const canShop = roles.includes('admin') || roles.includes('editor')
  const canModerate = roles.includes('admin') || roles.includes('moderator')
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [recent, monthOrders, coupons, guestbook, fanarts, live] = await Promise.all([
    canShop ? payload.find({ collection: 'orders', sort: '-createdAt', limit: 6, depth: 0 }) : null,
    canShop
      ? payload.find({
          collection: 'orders',
          where: { and: [{ paidAt: { greater_than_equal: monthStart } }, { testMode: { not_equals: true } }] },
          limit: 1000,
          depth: 0,
          select: { total: true, status: true },
        })
      : null,
    canShop ? payload.find({ collection: 'coupons', sort: '-usageCount', limit: 5, depth: 0, where: { usageCount: { greater_than: 0 } } }) : null,
    canModerate ? payload.count({ collection: 'guestbook', where: { status: { equals: 'pending' } } }) : null,
    canModerate ? payload.count({ collection: 'fanarts', where: { status: { equals: 'pending' } } }) : null,
    getLiveStatus().catch(() => null),
  ])

  const revenue =
    monthOrders?.docs.filter((o) => !['refunded', 'cancelled'].includes(String(o.status))).reduce((s, o) => s + Math.round((o.total ?? 0) * 100), 0) ?? 0

  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: 32 }}>
      <div style={{ ...card, background: 'linear-gradient(135deg,#bfe8ff,#5cbcf7)', color: '#0b2a55' }}>
        <strong>Statut live</strong>
        <p style={{ fontSize: 22, margin: '8px 0' }}>{live?.isLive ? `🔴 EN LIVE (${live.viewers} viewers)` : '💤 Hors ligne'}</p>
        {live?.isLive && <p style={{ margin: 0 }}>{live.title}</p>}
        {!live?.configured && <p style={{ fontSize: 12 }}>Clés Twitch à saisir dans « Clés API & services ».</p>}
      </div>
      {canShop && (
        <div style={card}>
          <strong>CA du mois (hors test)</strong>
          <p style={{ fontSize: 28, margin: '8px 0' }}>{formatEuros(revenue)}</p>
          <p style={{ margin: 0, opacity: 0.7 }}>{monthOrders?.totalDocs ?? 0} commande(s) payée(s)</p>
        </div>
      )}
      {canModerate && (
        <div style={card}>
          <strong>À modérer</strong>
          <p style={{ margin: '8px 0' }}>
            <a href="/admin/collections/guestbook?where[status][equals]=pending">Livre d’or : {guestbook?.totalDocs ?? 0}</a>
          </p>
          <p style={{ margin: 0 }}>
            <a href="/admin/collections/fanarts?where[status][equals]=pending">Fanarts : {fanarts?.totalDocs ?? 0}</a>
          </p>
        </div>
      )}
      {canShop && (
        <div style={card}>
          <strong>Codes promo les plus utilisés</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            {coupons?.docs.length ? (
              coupons.docs.map((c) => (
                <li key={c.id}>
                  {c.code} — {c.usageCount} utilisation(s)
                </li>
              ))
            ) : (
              <li>Aucun pour l’instant</li>
            )}
          </ul>
        </div>
      )}
      {canShop && (
        <div style={{ ...card, gridColumn: '1 / -1' }}>
          <strong>Commandes récentes</strong>
          <table style={{ width: '100%', marginTop: 8, borderCollapse: 'collapse' }}>
            <tbody>
              {recent?.docs.map((o) => (
                <tr key={o.id} style={{ borderTop: '1px solid var(--theme-elevation-100)' }}>
                  <td style={{ padding: 6 }}>
                    <a href={`/admin/collections/orders/${o.id}`}>{o.number}</a>
                    {o.testMode && ' 🧪'}
                  </td>
                  <td>{o.email}</td>
                  <td>{ORDER_STATUS_LABELS[o.status as OrderStatus]}</td>
                  <td style={{ textAlign: 'right' }}>{formatEuros(Math.round((o.total ?? 0) * 100))}</td>
                </tr>
              ))}
              {!recent?.docs.length && (
                <tr>
                  <td>Aucune commande pour l’instant.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
