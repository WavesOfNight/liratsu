import { describe, expect, it } from 'vitest'
import {
  allocateDiscount,
  CartError,
  checkCoupon,
  computeDiscount,
  computeShipping,
  computeTotals,
  findShippingZone,
  generateCodes,
  priceCart,
  toCents,
  vatFromGross,
  type CatalogProduct,
  type Coupon,
  type ShippingZone,
} from '@/lib/shop/pricing'

const poster: CatalogProduct = {
  id: '1',
  title: 'Poster',
  slug: 'poster',
  categoryIds: ['10'],
  fulfillment: 'gelato',
  vatRate: 20,
  active: true,
  variants: [
    { sku: 'P-A4', label: 'A4', priceCents: 1990, stock: null },
    { sku: 'P-A3', label: 'A3', priceCents: 2790, stock: null },
  ],
}
const stickers: CatalogProduct = {
  id: '2',
  title: 'Stickers',
  slug: 'stickers',
  categoryIds: ['20'],
  fulfillment: 'stock',
  vatRate: 20,
  active: true,
  variants: [{ sku: 'S-6', label: 'Pack', priceCents: 600, stock: 3 }],
}
const book: CatalogProduct = { ...stickers, id: '3', title: 'Artbook', categoryIds: ['30'], vatRate: 5.5, variants: [{ sku: 'B', label: 'Livre', priceCents: 2000, stock: 10 }] }
const catalog = new Map([poster, stickers, book].map((p) => [p.id, p]))
const france: ShippingZone = { id: 'fr', name: 'France', countries: ['FR', 'MC'], baseCents: 490, perExtraItemCents: 150, freeFromCents: 6000 }
const world: ShippingZone = { id: 'w', name: 'Monde', countries: ['*'], baseCents: 1490, perExtraItemCents: 300 }
const coupon = (c: Partial<Coupon>): Coupon => ({ id: 'c', code: 'CODE', type: 'percent', value: 10, active: true, usageCount: 0, ...c })

describe('priceCart', () => {
  it('recalcule les prix depuis le catalogue et fusionne les lignes identiques', () => {
    const lines = priceCart(
      [
        { productId: '1', sku: 'P-A3', quantity: 1 },
        { productId: '1', sku: 'P-A3', quantity: 2 },
      ],
      catalog,
    )
    expect(lines).toHaveLength(1)
    expect(lines[0].quantity).toBe(3)
    expect(lines[0].lineTotalCents).toBe(3 * 2790)
  })
  it('refuse un panier vide, une variante inconnue, un produit inactif, une quantité absurde', () => {
    expect(() => priceCart([], catalog)).toThrow(CartError)
    expect(() => priceCart([{ productId: '1', sku: 'NOPE', quantity: 1 }], catalog)).toThrow(/variante/)
    expect(() => priceCart([{ productId: '9', sku: 'X', quantity: 1 }], catalog)).toThrow(/disponible/)
    expect(() => priceCart([{ productId: '1', sku: 'P-A4', quantity: 0 }], catalog)).toThrow(/Quantité/)
    expect(() => priceCart([{ productId: '1', sku: 'P-A4', quantity: 21 }], catalog)).toThrow(/Quantité/)
    const inactive = new Map(catalog)
    inactive.set('1', { ...poster, active: false })
    expect(() => priceCart([{ productId: '1', sku: 'P-A4', quantity: 1 }], inactive)).toThrow(/disponible/)
  })
  it('vérifie le stock pour les produits en stock propre uniquement', () => {
    expect(() => priceCart([{ productId: '2', sku: 'S-6', quantity: 4 }], catalog)).toThrow(/stock/)
    expect(priceCart([{ productId: '1', sku: 'P-A4', quantity: 20 }], catalog)[0].quantity).toBe(20)
  })
})

describe('livraison', () => {
  it('trouve la zone par pays, avec repli « reste du monde »', () => {
    expect(findShippingZone('fr', [france, world])?.id).toBe('fr')
    expect(findShippingZone('JP', [france, world])?.id).toBe('w')
    expect(findShippingZone('JP', [france])).toBeNull()
  })
  it('calcule base + articles supplémentaires, et la gratuité au seuil', () => {
    const lines = priceCart([{ productId: '1', sku: 'P-A4', quantity: 2 }], catalog)
    expect(computeShipping(lines, france, 3980)).toBe(490 + 150)
    expect(computeShipping(lines, france, 6000)).toBe(0)
    expect(computeShipping(lines, world, 100000, 5000)).toBe(0) // seuil global
  })
})

describe('bons de réduction', () => {
  const lines = priceCart(
    [
      { productId: '1', sku: 'P-A3', quantity: 1 },
      { productId: '2', sku: 'S-6', quantity: 1 },
    ],
    catalog,
  )
  it('pourcentage, montant fixe (plafonné), livraison offerte', () => {
    expect(computeDiscount(coupon({ type: 'percent', value: 10 }), lines)).toBe(339)
    expect(computeDiscount(coupon({ type: 'fixed', value: 500 }), lines)).toBe(500)
    expect(computeDiscount(coupon({ type: 'fixed', value: 99999 }), lines)).toBe(3390)
    expect(computeDiscount(coupon({ type: 'freeShipping' }), lines)).toBe(0)
  })
  it('restriction par produit ou catégorie', () => {
    expect(computeDiscount(coupon({ type: 'percent', value: 50, productIds: ['2'] }), lines)).toBe(300)
    expect(computeDiscount(coupon({ type: 'percent', value: 50, categoryIds: ['10'] }), lines)).toBe(1395)
    expect(checkCoupon(coupon({ categoryIds: ['99'] }), lines)).toMatchObject({ ok: false })
  })
  it('dates, activation, utilisations globales et par client, minimum', () => {
    const now = new Date('2026-06-15T12:00:00Z')
    expect(checkCoupon(coupon({ active: false }), lines, now).ok).toBe(false)
    expect(checkCoupon(coupon({ startsAt: '2026-07-01' }), lines, now).ok).toBe(false)
    expect(checkCoupon(coupon({ endsAt: '2026-06-01' }), lines, now).ok).toBe(false)
    expect(checkCoupon(coupon({ maxUses: 5, usageCount: 5 }), lines, now).ok).toBe(false)
    expect(checkCoupon(coupon({ maxUsesPerCustomer: 1 }), lines, now, 1).ok).toBe(false)
    expect(checkCoupon(coupon({ minAmountCents: 5000 }), lines, now).ok).toBe(false)
    expect(checkCoupon(coupon({ maxUses: 5, usageCount: 4, minAmountCents: 1000 }), lines, now).ok).toBe(true)
  })
  it('répartit la remise au prorata sans perte de centime', () => {
    const alloc = allocateDiscount(coupon({}), lines, 339)
    expect(alloc.reduce((a, b) => a + b, 0)).toBe(339)
  })
})

describe('totaux et TVA', () => {
  it('extrait la TVA du TTC', () => {
    expect(vatFromGross(1200, 20)).toBe(200)
    expect(vatFromGross(1055, 5.5)).toBe(55)
  })
  it('calcule un total complet multi-taux avec code livraison offerte', () => {
    const lines = priceCart(
      [
        { productId: '1', sku: 'P-A4', quantity: 1 },
        { productId: '3', sku: 'B', quantity: 1 },
      ],
      catalog,
    )
    const t = computeTotals({ lines, coupon: coupon({ type: 'freeShipping' }), zone: france })
    expect(t.subtotalCents).toBe(3990)
    expect(t.shippingCents).toBe(0)
    expect(t.totalCents).toBe(3990)
    expect(t.vatBreakdown.find((v) => v.rate === 5.5)?.vatCents).toBe(vatFromGross(2000, 5.5))
    expect(t.vatCents).toBe(vatFromGross(1990, 20) + vatFromGross(2000, 5.5))
  })
  it('applique réduction puis port (TVA 20 % sur le port)', () => {
    const lines = priceCart([{ productId: '2', sku: 'S-6', quantity: 2 }], catalog)
    const t = computeTotals({ lines, coupon: coupon({ type: 'percent', value: 10 }), zone: france })
    expect(t.discountCents).toBe(120)
    expect(t.shippingCents).toBe(640)
    expect(t.totalCents).toBe(1200 - 120 + 640)
  })
  it('convertit les euros en centimes sans erreur flottante', () => {
    expect(toCents(19.9)).toBe(1990)
    expect(toCents(0.1 + 0.2)).toBe(30)
  })
})

describe('génération de codes', () => {
  it('génère des codes uniques, lisibles, avec préfixe', () => {
    const codes = generateCodes(200, 'LIVE-')
    expect(new Set(codes).size).toBe(200)
    expect(codes.every((c) => /^LIVE-[A-HJ-NP-Z2-9]{8}$/.test(c))).toBe(true)
  })
})
