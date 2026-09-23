'use client'
/**
 * Panier + paiement. Le devis est toujours recalculé par le serveur (/api/site/shop/quote).
 * Stripe : redirection vers Stripe Checkout. PayPal : boutons du SDK JS PayPal.
 * La commande n'est validée que par webhook : la page de retour attend la confirmation.
 */
import Link from 'next/link'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { formatEuros } from '@/lib/shop/pricing'
import { useCart } from './cart'
import styles from './shop.module.css'

type Quote = {
  lines: { productId: string; sku: string; title: string; variantLabel: string; quantity: number; unitPriceCents: number; lineTotalCents: number }[]
  totals: { subtotalCents: number; discountCents: number; shippingCents: number; totalCents: number; vatCents: number }
  coupon: { code: string } | null
  couponError: string | null
}
type Config = { testMode: boolean; stripe: boolean; paypalClientId: string | null; notice: string | null }

const COUNTRIES: [string, string][] = [
  ['FR', 'France'],
  ['BE', 'Belgique'],
  ['CH', 'Suisse'],
  ['LU', 'Luxembourg'],
  ['MC', 'Monaco'],
  ['DE', 'Allemagne'],
  ['ES', 'Espagne'],
  ['IT', 'Italie'],
  ['NL', 'Pays-Bas'],
  ['PT', 'Portugal'],
  ['GB', 'Royaume-Uni'],
  ['CA', 'Canada'],
  ['US', 'États-Unis'],
]

declare global {
  interface Window {
    paypal?: { Buttons: (o: object) => { render: (el: HTMLElement) => Promise<void>; close?: () => void } }
  }
}

export function Checkout({ hasCustomProducts }: { hasCustomProducts?: boolean }) {
  const cart = useCart()
  const [config, setConfig] = useState<Config | null>(null)
  const [country, setCountry] = useState('FR')
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState('')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteError, setQuoteError] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [provider, setProvider] = useState<'stripe' | 'paypal'>('stripe')
  const formRef = useRef<HTMLFormElement>(null)
  const paypalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/site/shop/config')
      .then((r) => r.json())
      .then((c: Config) => {
        setConfig(c)
        if (!c.stripe && c.paypalClientId) setProvider('paypal')
      })
      .catch(() => null)
    if (new URLSearchParams(window.location.search).get('paiement') === 'annule') setError('Paiement annulé : ton panier est toujours là ✦')
  }, [])

  const cartPayload = cart.lines.map((l) => ({ productId: l.productId, sku: l.sku, quantity: l.quantity }))
  const cartKey = JSON.stringify(cartPayload)

  useEffect(() => {
    if (!cartPayload.length) {
      setQuote(null)
      return
    }
    const ctrl = new AbortController()
    fetch('/api/site/shop/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart: cartPayload, country, coupon }),
      signal: ctrl.signal,
    })
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) {
          setQuote(null)
          setQuoteError(d.error ?? 'Erreur')
        } else {
          setQuote(d)
          setQuoteError('')
        }
      })
      .catch(() => null)
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey, country, coupon])

  const collect = useCallback(() => {
    const form = formRef.current
    if (!form || !form.reportValidity()) return null
    const fd = new FormData(form)
    const g = (k: string) => String(fd.get(k) ?? '')
    return {
      cart: cartPayload,
      email: g('email'),
      coupon,
      acceptCgv: fd.get('cgv') === 'on',
      address: { firstName: g('firstName'), lastName: g('lastName'), line1: g('line1'), line2: g('line2'), postalCode: g('postalCode'), city: g('city'), country, phone: g('phone') },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey, coupon, country])

  const payStripe = async () => {
    const data = collect()
    if (!data) return
    setBusy(true)
    setError('')
    const r = await fetch('/api/site/shop/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, provider: 'stripe' }) })
    const d = await r.json().catch(() => ({}))
    if (r.ok && d.url) window.location.href = d.url
    else {
      setBusy(false)
      setError(d.error ?? 'Erreur')
    }
  }

  // Boutons PayPal (SDK chargé à la demande, uniquement si PayPal est choisi).
  useEffect(() => {
    if (provider !== 'paypal' || !config?.paypalClientId || !paypalRef.current || !quote) return
    let cancelled = false
    const render = () => {
      if (cancelled || !window.paypal || !paypalRef.current) return
      paypalRef.current.innerHTML = ''
      void window.paypal
        .Buttons({
          style: { shape: 'pill', color: 'blue', label: 'pay' },
          onClick: (_: unknown, actions: { reject: () => void; resolve: () => void }) => (collect() ? actions.resolve() : actions.reject()),
          createOrder: async () => {
            const data = collect()
            const r = await fetch('/api/site/shop/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, provider: 'paypal' }) })
            const d = await r.json()
            if (!r.ok) {
              setError(d.error ?? 'Erreur')
              throw new Error(d.error)
            }
            return d.paypalOrderId
          },
          onApprove: async (data: { orderID: string }) => {
            setBusy(true)
            const r = await fetch('/api/site/shop/paypal-capture', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paypalOrderId: data.orderID }) })
            const d = await r.json()
            if (r.ok) {
              cart.clear()
              window.location.href = d.redirect
            } else {
              setBusy(false)
              setError(d.error ?? 'Paiement refusé')
            }
          },
          onError: () => setError('PayPal a rencontré un problème. Réessaie ou choisis la carte bancaire.'),
        })
        .render(paypalRef.current)
    }
    if (window.paypal) render()
    else if (!document.getElementById('paypal-sdk')) {
      const s = document.createElement('script')
      s.id = 'paypal-sdk'
      s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(config.paypalClientId)}&currency=EUR&intent=capture&locale=fr_FR&components=buttons`
      s.onload = render
      document.head.appendChild(s)
    } else document.getElementById('paypal-sdk')?.addEventListener('load', render)
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, config?.paypalClientId, quote?.totals.totalCents])

  if (!cart.lines.length)
    return (
      <div className={styles.empty}>
        <p>Ton panier est vide comme un aquarium sans poisson…</p>
        <Link href="/boutique" className="candy-btn">
          Voir la boutique
        </Link>
      </div>
    )

  const t = quote?.totals
  return (
    <div className={styles.checkout}>
      <section aria-labelledby="cart-title">
        <h2 id="cart-title">Mon panier</h2>
        <ul className={styles.cartLines}>
          {cart.lines.map((l) => (
            <li key={`${l.productId}-${l.sku}`}>
              {l.image && <img src={l.image} alt="" width={64} height={64} />}
              <div>
                <Link href={`/boutique/${l.slug}`}>{l.title}</Link>
                <div className="muted">{l.variantLabel}</div>
              </div>
              <label className="sr-only" htmlFor={`q-${l.sku}`}>
                Quantité
              </label>
              <input id={`q-${l.sku}`} className="input" type="number" min={0} max={20} value={l.quantity} onChange={(e) => cart.setQty(l.productId, l.sku, Number(e.target.value))} style={{ width: 72 }} />
              <button type="button" className={styles.remove} onClick={() => cart.setQty(l.productId, l.sku, 0)} aria-label={`Retirer ${l.title}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.couponRow}>
          <label htmlFor="coupon" className="sr-only">
            Code promo
          </label>
          <input id="coupon" className="input" placeholder="Code promo" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} />
          <button type="button" className="candy-btn candy-btn--star candy-btn--small" onClick={() => setCoupon(couponInput.trim())}>
            Appliquer
          </button>
        </div>
        {coupon && quote?.couponError && <p className="form-msg form-msg--error">{quote.couponError}</p>}
        {quote?.coupon && <p className="form-msg">Code « {quote.coupon.code} » appliqué ✦ (codes non cumulables)</p>}

        <dl className={styles.totals}>
          <dt>Sous-total</dt>
          <dd>{t ? formatEuros(t.subtotalCents) : '…'}</dd>
          {t && t.discountCents > 0 && (
            <>
              <dt>Réduction</dt>
              <dd>− {formatEuros(t.discountCents)}</dd>
            </>
          )}
          <dt>Livraison</dt>
          <dd>{t ? (t.shippingCents ? formatEuros(t.shippingCents) : 'Offerte') : '…'}</dd>
          <dt className={styles.total}>Total TTC</dt>
          <dd className={styles.total}>{t ? formatEuros(t.totalCents) : '…'}</dd>
          <dt className="muted">dont TVA</dt>
          <dd className="muted">{t ? formatEuros(t.vatCents) : '…'}</dd>
        </dl>
        {quoteError && <p className="form-msg form-msg--error">{quoteError}</p>}
      </section>

      <section aria-labelledby="ship-title">
        <h2 id="ship-title">Livraison & paiement</h2>
        <form ref={formRef} className="stack" style={{ gap: 12 }} onSubmit={(e) => e.preventDefault()}>
          <div className="field">
            <label htmlFor="email">Email (confirmation & suivi)</label>
            <input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="field">
              <label htmlFor="firstName">Prénom</label>
              <input id="firstName" name="firstName" required autoComplete="given-name" />
            </div>
            <div className="field">
              <label htmlFor="lastName">Nom</label>
              <input id="lastName" name="lastName" required autoComplete="family-name" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="line1">Adresse</label>
            <input id="line1" name="line1" required autoComplete="address-line1" />
          </div>
          <div className="field">
            <label htmlFor="line2">Complément (optionnel)</label>
            <input id="line2" name="line2" autoComplete="address-line2" />
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="field">
              <label htmlFor="postalCode">Code postal</label>
              <input id="postalCode" name="postalCode" required autoComplete="postal-code" />
            </div>
            <div className="field">
              <label htmlFor="city">Ville</label>
              <input id="city" name="city" required autoComplete="address-level2" />
            </div>
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="field">
              <label htmlFor="country">Pays</label>
              <select id="country" name="country" value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country">
                {COUNTRIES.map(([c, n]) => (
                  <option key={c} value={c}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="phone">Téléphone (pour le transporteur)</label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" />
            </div>
          </div>
          <label className="check">
            <input type="checkbox" name="cgv" required />
            <span>
              J’ai lu et j’accepte les <Link href="/legal/cgv" target="_blank">CGV</Link> et la <Link href="/legal/confidentialite" target="_blank">politique de confidentialité</Link>.
              {hasCustomProducts && ' Les produits personnalisés ne bénéficient pas du droit de rétractation.'}
            </span>
          </label>
          {config?.notice && <p className="muted">{config.notice}</p>}

          {config && (config.stripe || config.paypalClientId) ? (
            <fieldset className={styles.providers}>
              <legend>Moyen de paiement</legend>
              {config.stripe && (
                <label className={`${styles.variant} ${provider === 'stripe' ? styles.variantOn : ''}`}>
                  <input type="radio" name="provider" checked={provider === 'stripe'} onChange={() => setProvider('stripe')} /> 💳 Carte, Apple Pay, Google Pay
                </label>
              )}
              {config.paypalClientId && (
                <label className={`${styles.variant} ${provider === 'paypal' ? styles.variantOn : ''}`}>
                  <input type="radio" name="provider" checked={provider === 'paypal'} onChange={() => setProvider('paypal')} /> PayPal
                </label>
              )}
            </fieldset>
          ) : (
            <p className="form-msg form-msg--error">Le paiement n’est pas encore configuré (clés Stripe/PayPal à saisir dans l’admin).</p>
          )}

          {provider === 'stripe' && config?.stripe && (
            <button type="button" className="candy-btn" disabled={busy || !quote} onClick={payStripe}>
              {busy ? 'Redirection…' : `Payer ${t ? formatEuros(t.totalCents) : ''}`}
            </button>
          )}
          {provider === 'paypal' && config?.paypalClientId && <div ref={paypalRef} className={styles.paypal} />}
          {config?.testMode && <p className="muted">🧪 Mode test : utilise la carte 4242 4242 4242 4242 (date future, CVC quelconque) ou un compte PayPal sandbox.</p>}
          {error && (
            <p className="form-msg form-msg--error" role="alert">
              {error}
            </p>
          )}
        </form>
      </section>
    </div>
  )
}
