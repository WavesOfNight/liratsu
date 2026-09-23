'use client'
/** Sélection de variante + ajout au panier. */
import Link from 'next/link'
import React, { useState } from 'react'
import { formatEuros } from '@/lib/shop/pricing'
import { playSound } from '../prefs/sounds'
import { useCart } from './cart'
import styles from './shop.module.css'

type Variant = { sku: string; label: string; priceCents: number; available: boolean; stock: number | null }

export function AddToCart({ productId, slug, title, image, variants }: { productId: string; slug: string; title: string; image?: string | null; variants: Variant[] }) {
  const cart = useCart()
  const [sku, setSku] = useState(variants.find((v) => v.available)?.sku ?? variants[0]?.sku)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const v = variants.find((x) => x.sku === sku)

  return (
    <div className="stack" style={{ gap: 14 }}>
      {variants.length > 1 && (
        <fieldset className={styles.variants}>
          <legend>Choisis ta variante</legend>
          {variants.map((x) => (
            <label key={x.sku} className={`${styles.variant} ${x.sku === sku ? styles.variantOn : ''} ${!x.available ? styles.variantOff : ''}`}>
              <input type="radio" name="variant" value={x.sku} checked={x.sku === sku} disabled={!x.available} onChange={() => setSku(x.sku)} />
              {x.label}
            </label>
          ))}
        </fieldset>
      )}
      <p className={styles.price}>{v ? formatEuros(v.priceCents) : '—'}</p>
      {v?.stock !== null && v?.stock !== undefined && v.stock <= 5 && v.stock > 0 && <p className="sticker sticker--pink">Plus que {v.stock} en stock !</p>}
      <div className={styles.qtyRow}>
        <label htmlFor="qty">Quantité</label>
        <input id="qty" type="number" min={1} max={20} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className="input" style={{ width: 90 }} />
      </div>
      <button
        type="button"
        className="candy-btn candy-btn--pink"
        disabled={!v?.available}
        onClick={() => {
          if (!v) return
          cart.add({ productId, sku: v.sku, quantity: qty, title, variantLabel: v.label, priceCents: v.priceCents, image, slug })
          playSound('coin')
          setAdded(true)
        }}
      >
        {v?.available ? 'Ajouter au panier ✦' : 'Épuisé'}
      </button>
      {added && (
        <p className="form-msg" role="status">
          Ajouté ! <Link href="/panier">Voir mon panier ({cart.count})</Link>
        </p>
      )}
    </div>
  )
}

export function CartBadge() {
  const { count } = useCart()
  return (
    <Link href="/panier" className="candy-btn candy-btn--ghost candy-btn--small" aria-label={`Panier : ${count} article(s)`}>
      🛍️ Panier {count > 0 && <span className="sticker" style={{ transform: 'none' }}>{count}</span>}
    </Link>
  )
}
