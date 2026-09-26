import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { AeroWindow } from '@/components/AeroWindow'
import { JsonLd } from '@/components/JsonLd'
import { RichText } from '@/components/RichText'
import { AddToCart, CartBadge } from '@/components/shop/AddToCart'
import styles from '@/components/shop/shop.module.css'
import { toCents } from '@/lib/shop/pricing'
import { absoluteUrl, getSection, getSiteData, mediaUrl } from '@/lib/site'

type Props = { params: Promise<{ slug: string }> }

async function load(slug: string) {
  const { payload } = await getSiteData()
  const r = await payload.find({ collection: 'products', where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] }, limit: 1, depth: 1 })
  return r.docs[0] ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = await load(slug)
  if (!p) return {}
  const img = mediaUrl(p.images?.[0]?.image, 'card')
  const description = p.seo?.description || p.shortDescription
  return {
    title: p.seo?.title || p.title,
    ...(description ? { description } : {}),
    alternates: { canonical: `/boutique/${slug}` },
    ...(img ? { openGraph: { images: [{ url: img }] } } : {}),
  }
}

export default async function ProductPage({ params }: Props) {
  if ((await getSection('shop')).status !== 'on') notFound()
  const { slug } = await params
  const p = await load(slug)
  if (!p) notFound()
  const { site } = await getSiteData()
  const variants = (p.variants ?? []).map((v) => {
    const stock = p.fulfillment === 'stock' ? (v.stock ?? 0) : null
    return { sku: v.sku, label: v.label, priceCents: toCents(v.price ?? p.price), stock, available: stock === null || stock > 0 }
  })
  const images = (p.images ?? []).map((i) => ({ src: mediaUrl(i.image, 'wide'), alt: typeof i.image === 'object' ? i.image.alt : '' })).filter((i) => i.src)
  const thumb = mediaUrl(p.images?.[0]?.image, 'thumb')

  return (
    <div className="container">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.title,
          description: p.shortDescription,
          image: images.map((i) => absoluteUrl(site, i.src!)),
          sku: variants[0]?.sku,
          brand: { '@type': 'Brand', name: 'Liratsu' },
          offers: variants.map((v) => ({
            '@type': 'Offer',
            sku: v.sku,
            price: (v.priceCents / 100).toFixed(2),
            priceCurrency: 'EUR',
            availability: v.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: absoluteUrl(site, `/boutique/${p.slug}`),
            seller: { '@type': 'Organization', name: 'Reads Records' },
          })),
        }}
      />
      <nav aria-label="Fil d’Ariane" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/boutique">← Retour à la boutique</Link>
        <CartBadge />
      </nav>
      <div className={styles.product}>
        <div className={styles.gallery}>
          {images.map((img, i) => (
            <Image key={i} src={img.src!} alt={img.alt} width={900} height={900} sizes="(max-width: 800px) 100vw, 550px" priority={i === 0} />
          ))}
        </div>
        <AeroWindow title={p.title} icon="shop" as="article" headingLevel={2}>
          <h1 style={{ fontSize: 'clamp(1.6rem,5vw,2.2rem)' }}>{p.title}</h1>
          {p.badge && <p className="sticker">{p.badge}</p>}
          {p.shortDescription && <p>{p.shortDescription}</p>}
          <AddToCart productId={String(p.id)} slug={p.slug ?? ''} title={p.title} image={thumb} variants={variants} />
          <p className="muted" style={{ fontSize: '.9rem' }}>
            {p.fulfillment === 'gelato'
              ? '🖨️ Imprimé à la demande spécialement pour toi (fabrication puis expédition : délais variables).'
              : '📦 Expédié par nos soins.'}{' '}
            {p.personalized ? 'Produit personnalisé : pas de droit de rétractation.' : 'Droit de rétractation de 14 jours.'} Prix TTC.
          </p>
          {p.description && <RichText data={p.description} />}
        </AeroWindow>
      </div>
    </div>
  )
}
