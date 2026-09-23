'use client'
/**
 * Affiche l'avancement d'une commande. Juste après le paiement, la commande peut être
 * encore « en attente » le temps que le webhook arrive : on interroge le serveur quelques fois.
 */
import React, { useEffect, useState } from 'react'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/shop/orderStatus'
import { useCart } from './cart'
import styles from './shop.module.css'

const STEPS: OrderStatus[] = ['paid', 'in_production', 'shipped', 'delivered']

export function OrderTracker({ id, token, initialStatus }: { id: string; token: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus as OrderStatus)
  const cart = useCart()

  useEffect(() => {
    if (status !== 'pending') {
      if (status === 'paid') cart.clear()
      return
    }
    let tries = 0
    const t = window.setInterval(async () => {
      tries++
      const r = await fetch(`/api/site/shop/order/${id}?t=${encodeURIComponent(token)}`).catch(() => null)
      const d = r?.ok ? ((await r.json()) as { status: OrderStatus }) : null
      if (d && d.status !== 'pending') {
        setStatus(d.status)
        window.clearInterval(t)
      }
      if (tries > 20) window.clearInterval(t)
    }, 3000)
    return () => window.clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, id, token])

  if (status === 'pending')
    return (
      <p className="form-msg" role="status">
        ⏳ Paiement en cours de confirmation… cette page se met à jour toute seule.
      </p>
    )
  if (['failed', 'cancelled', 'refunded', 'partially_refunded'].includes(status)) return <p className="form-msg form-msg--error">{ORDER_STATUS_LABELS[status]}</p>
  const idx = STEPS.indexOf(status)
  return (
    <>
      <p className="form-msg" role="status">
        ✦ Merci pour ta commande ! Un email de confirmation avec ta facture t’a été envoyé.
      </p>
      <ol className={styles.steps} aria-label="Avancement">
        {STEPS.map((s, i) => (
          <li key={s} className={i <= idx ? styles.done : ''}>
            <span aria-hidden="true">{i <= idx ? '🟢' : '⚪'}</span> {ORDER_STATUS_LABELS[s]}
          </li>
        ))}
      </ol>
    </>
  )
}
