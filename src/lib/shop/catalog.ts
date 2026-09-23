/** Chargement du catalogue, des zones et des codes promo depuis Payload vers les types de pricing.ts. */
import type { Payload } from 'payload'
import type { Coupon as CouponDoc, Product, ShippingZone as ZoneDoc } from '@/payload-types'
import { toCents, type CatalogProduct, type Coupon, type ShippingZone } from './pricing'

const relId = (v: unknown): string => (typeof v === 'object' && v !== null ? String((v as { id: unknown }).id) : String(v))

export function toCatalogProduct(p: Product, vatRates: { key: string; rate: number }[]): CatalogProduct {
  const vat = vatRates.find((r) => r.key === (p.vatKey || 'standard'))?.rate ?? 20
  return {
    id: String(p.id),
    title: p.title,
    slug: p.slug ?? '',
    categoryIds: (p.categories ?? []).map(relId),
    fulfillment: p.fulfillment,
    vatRate: vat,
    active: p._status === 'published',
    variants: (p.variants ?? []).map((v) => ({
      sku: v.sku,
      label: v.label,
      priceCents: toCents(v.price ?? p.price),
      stock: p.fulfillment === 'stock' ? (v.stock ?? 0) : null,
      gelatoProductUid: v.gelatoProductUid,
      gelatoFileUrl: v.gelatoFileUrl,
    })),
  }
}

export async function loadCatalog(payload: Payload, productIds: string[]): Promise<Map<string, CatalogProduct>> {
  const settings = await payload.findGlobal({ slug: 'shop-settings', depth: 0 })
  const vatRates = (settings.vatRates ?? []).map((r) => ({ key: r.key, rate: r.rate }))
  const ids = [...new Set(productIds)].filter((id) => /^\d+$/.test(id))
  if (ids.length === 0) return new Map()
  const res = await payload.find({ collection: 'products', where: { id: { in: ids } }, limit: ids.length, depth: 0, draft: false })
  return new Map(res.docs.map((p) => [String(p.id), toCatalogProduct(p, vatRates)]))
}

export function toCoupon(c: CouponDoc): Coupon {
  return {
    id: String(c.id),
    code: c.code,
    type: c.type,
    value: c.type === 'fixed' ? toCents(c.value) : (c.value ?? 0),
    active: Boolean(c.active),
    startsAt: c.startsAt,
    endsAt: c.endsAt,
    maxUses: c.maxUses,
    maxUsesPerCustomer: c.maxUsesPerCustomer,
    usageCount: c.usageCount ?? 0,
    minAmountCents: c.minAmount ? toCents(c.minAmount) : null,
    productIds: (c.products ?? []).map(relId),
    categoryIds: (c.categories ?? []).map(relId),
  }
}

export function toZone(z: ZoneDoc): ShippingZone {
  return {
    id: String(z.id),
    name: z.name,
    countries: z.countries.split(',').map((c) => c.trim()).filter(Boolean),
    baseCents: toCents(z.base),
    perExtraItemCents: toCents(z.perExtraItem),
    freeFromCents: z.freeFrom ? toCents(z.freeFrom) : null,
  }
}

export async function findCouponByCode(payload: Payload, code: string): Promise<CouponDoc | null> {
  const clean = code.trim().toUpperCase()
  if (!clean || clean.length > 40) return null
  const r = await payload.find({ collection: 'coupons', where: { code: { equals: clean } }, limit: 1, depth: 0 })
  return r.docs[0] ?? null
}

/** Nombre de commandes payées d'un client avec ce code (limite « par client »). */
export async function customerCouponUses(payload: Payload, couponId: string | number, email: string): Promise<number> {
  const r = await payload.count({
    collection: 'orders',
    where: {
      and: [
        { coupon: { equals: couponId } },
        { email: { equals: email.toLowerCase() } },
        { status: { not_in: ['pending', 'failed', 'cancelled'] } },
      ],
    },
  })
  return r.totalDocs
}
