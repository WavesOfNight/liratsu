import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { ComingSoon } from '@/components/ComingSoon'
import { CartBadge } from '@/components/shop/AddToCart'
import styles from '@/components/shop/shop.module.css'
import { formatEuros, toCents } from '@/lib/shop/pricing'
import { getSection, getSiteData, mediaUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Boutique',
  description: 'Créations imaginées et dessinées par Liratsu : posters, stickers et goodies de la boutique officielle.',
  alternates: { canonical: '/boutique' },
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const section = await getSection('shop')
  if (section.status === 'off') notFound()
  if (section.status === 'soon')
    return (
      <ComingSoon
        title="Boutique"
        section="shop"
        text={section.teaserText || 'Peut-être bientôt : des créations imaginées et dessinées par Liratsu elle-même.'}
        notifyForm={section.notifyForm}
      />
    )

  const { cat } = await searchParams
  const { payload } = await getSiteData()
  const categories = await payload.find({ collection: 'categories', sort: 'order', limit: 50, depth: 0 })
  const current = categories.docs.find((c) => c.slug === cat)
  const products = await payload.find({
    collection: 'products',
    where: { and: [{ _status: { equals: 'published' } }, ...(current ? [{ categories: { contains: current.id } }] : [])] },
    sort: '-createdAt',
    limit: 100,
    depth: 1,
  })

  return (
    <div className="container">
      <header className="page-head">
        <h1>Boutique</h1>
        <p>Des créations imaginées et dessinées par Liratsu ✦</p>
      </header>
      <div className={styles.toolbar}>
        <nav className={styles.cats} aria-label="Catégories">
          <Link href="/boutique" className={`candy-btn candy-btn--small ${current ? 'candy-btn--ghost' : ''}`} aria-current={!current ? 'page' : undefined}>
            Tout
          </Link>
          {categories.docs.map((c) => (
            <Link key={c.id} href={`/boutique?cat=${c.slug}`} className={`candy-btn candy-btn--small ${current?.id === c.id ? '' : 'candy-btn--ghost'}`} aria-current={current?.id === c.id ? 'page' : undefined}>
              {c.title}
            </Link>
          ))}
        </nav>
        <CartBadge />
      </div>
      <ul className={styles.grid}>
        {products.docs.map((p) => {
          const img = mediaUrl(p.images?.[0]?.image, 'card')
          const prices = (p.variants ?? []).map((v) => toCents(v.price ?? p.price))
          const min = prices.length ? Math.min(...prices) : toCents(p.price)
          return (
            <li key={p.id}>
              <Link href={`/boutique/${p.slug}`} className={styles.card}>
                {img && <Image src={img} alt="" width={480} height={480} sizes="(max-width: 600px) 100vw, 300px" />}
                {p.badge && <span className={`sticker ${styles.cardBadge}`}>{p.badge}</span>}
                <span className={styles.cardTitle}>{p.title}</span>
                <span>
                  {prices.length > 1 && new Set(prices).size > 1 ? 'dès ' : ''}
                  <strong>{formatEuros(min)}</strong>
                  {p.compareAtPrice ? <span className={styles.compare}>{formatEuros(toCents(p.compareAtPrice))}</span> : null}
                </span>
              </Link>
            </li>
          )
        })}
        {products.docs.length === 0 && <li className="muted">Aucun produit pour le moment… ça arrive !</li>}
      </ul>
    </div>
  )
}
