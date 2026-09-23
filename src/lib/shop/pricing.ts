/**
 * Logique de calcul de la boutique, pure et sans accès base (testée unitairement).
 *
 * Tous les montants sont en CENTIMES (entiers) et TTC. La TVA est extraite du TTC.
 * Le serveur recalcule toujours le panier à partir des données en base : les prix
 * envoyés par le navigateur ne sont jamais utilisés.
 */

export const toCents = (euros: number | null | undefined): number => Math.round((euros ?? 0) * 100)
export const formatEuros = (cents: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)

export type CatalogVariant = {
  sku: string
  label: string
  priceCents: number
  stock: number | null // null = illimité (print-on-demand)
  gelatoProductUid?: string | null
  gelatoFileUrl?: string | null
}

export type CatalogProduct = {
  id: string
  title: string
  slug: string
  categoryIds: string[]
  fulfillment: 'gelato' | 'stock'
  vatRate: number // en %
  active: boolean
  variants: CatalogVariant[]
}

export type CartInputLine = { productId: string; sku: string; quantity: number }

export type PricedLine = {
  productId: string
  sku: string
  title: string
  variantLabel: string
  quantity: number
  unitPriceCents: number
  lineTotalCents: number
  vatRate: number
  fulfillment: 'gelato' | 'stock'
  categoryIds: string[]
  gelatoProductUid?: string | null
  gelatoFileUrl?: string | null
}

export type Coupon = {
  id: string
  code: string
  type: 'percent' | 'fixed' | 'freeShipping'
  value: number // % pour percent, centimes pour fixed
  active: boolean
  startsAt?: string | null
  endsAt?: string | null
  maxUses?: number | null
  maxUsesPerCustomer?: number | null
  usageCount: number
  minAmountCents?: number | null
  productIds?: string[]
  categoryIds?: string[]
}

export type ShippingZone = {
  id: string
  name: string
  countries: string[] // codes ISO 3166-1 alpha-2, '*' = reste du monde
  baseCents: number
  perExtraItemCents: number
  freeFromCents?: number | null
}

export class CartError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message)
  }
}

export const MAX_QTY_PER_LINE = 20

/** Transforme le panier du navigateur en lignes tarifées à partir du catalogue serveur. */
export function priceCart(input: CartInputLine[], catalog: Map<string, CatalogProduct>): PricedLine[] {
  if (!Array.isArray(input) || input.length === 0) throw new CartError('Ton panier est vide.', 'EMPTY')
  const merged = new Map<string, CartInputLine>()
  for (const line of input) {
    const key = `${line.productId}::${line.sku}`
    const prev = merged.get(key)
    merged.set(key, { ...line, quantity: (prev?.quantity ?? 0) + Math.floor(line.quantity) })
  }
  const lines: PricedLine[] = []
  for (const line of merged.values()) {
    const product = catalog.get(line.productId)
    if (!product || !product.active) throw new CartError('Un produit de ton panier n’est plus disponible.', 'UNAVAILABLE')
    const variant = product.variants.find((v) => v.sku === line.sku)
    if (!variant) throw new CartError(`La variante choisie pour « ${product.title} » n’existe plus.`, 'UNAVAILABLE')
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_QTY_PER_LINE)
      throw new CartError('Quantité invalide.', 'QTY')
    if (product.fulfillment === 'stock' && variant.stock !== null && variant.stock < line.quantity)
      throw new CartError(`Plus assez de stock pour « ${product.title} (${variant.label}) ».`, 'STOCK')
    lines.push({
      productId: product.id,
      sku: variant.sku,
      title: product.title,
      variantLabel: variant.label,
      quantity: line.quantity,
      unitPriceCents: variant.priceCents,
      lineTotalCents: variant.priceCents * line.quantity,
      vatRate: product.vatRate,
      fulfillment: product.fulfillment,
      categoryIds: product.categoryIds,
      gelatoProductUid: variant.gelatoProductUid,
      gelatoFileUrl: variant.gelatoFileUrl,
    })
  }
  return lines
}

export function findShippingZone(country: string, zones: ShippingZone[]): ShippingZone | null {
  const cc = country.toUpperCase()
  return zones.find((z) => z.countries.map((c) => c.toUpperCase()).includes(cc)) ?? zones.find((z) => z.countries.includes('*')) ?? null
}

export function computeShipping(lines: PricedLine[], zone: ShippingZone, subtotalAfterDiscountCents: number, globalFreeFromCents = 0): number {
  const items = lines.reduce((n, l) => n + l.quantity, 0)
  if (items === 0) return 0
  const freeFrom = zone.freeFromCents || globalFreeFromCents
  if (freeFrom > 0 && subtotalAfterDiscountCents >= freeFrom) return 0
  return zone.baseCents + Math.max(0, items - 1) * zone.perExtraItemCents
}

export type CouponCheck = { ok: true } | { ok: false; reason: string }

/** Vérifie qu'un code promo est applicable (hors comptage par client, fait en base). */
export function checkCoupon(coupon: Coupon, lines: PricedLine[], now = new Date(), customerUses = 0): CouponCheck {
  if (!coupon.active) return { ok: false, reason: 'Ce code n’est plus actif.' }
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return { ok: false, reason: 'Ce code n’est pas encore valable.' }
  if (coupon.endsAt && new Date(coupon.endsAt) < now) return { ok: false, reason: 'Ce code a expiré.' }
  if (coupon.maxUses != null && coupon.maxUses > 0 && coupon.usageCount >= coupon.maxUses) return { ok: false, reason: 'Ce code a atteint son nombre maximal d’utilisations.' }
  if (coupon.maxUsesPerCustomer != null && coupon.maxUsesPerCustomer > 0 && customerUses >= coupon.maxUsesPerCustomer)
    return { ok: false, reason: 'Tu as déjà utilisé ce code.' }
  const eligible = eligibleSubtotal(coupon, lines)
  if (eligible === 0) return { ok: false, reason: 'Ce code ne s’applique à aucun article de ton panier.' }
  const subtotal = lines.reduce((s, l) => s + l.lineTotalCents, 0)
  if (coupon.minAmountCents && subtotal < coupon.minAmountCents)
    return { ok: false, reason: `Ce code nécessite un panier d’au moins ${formatEuros(coupon.minAmountCents)}.` }
  return { ok: true }
}

function isRestricted(coupon: Coupon): boolean {
  return Boolean(coupon.productIds?.length || coupon.categoryIds?.length)
}

function lineEligible(coupon: Coupon, line: PricedLine): boolean {
  if (!isRestricted(coupon)) return true
  if (coupon.productIds?.includes(line.productId)) return true
  return Boolean(coupon.categoryIds?.some((c) => line.categoryIds.includes(c)))
}

export function eligibleSubtotal(coupon: Coupon, lines: PricedLine[]): number {
  return lines.filter((l) => lineEligible(coupon, l)).reduce((s, l) => s + l.lineTotalCents, 0)
}

/** Montant de réduction sur les articles (hors livraison), jamais supérieur au sous-total éligible. */
export function computeDiscount(coupon: Coupon | null, lines: PricedLine[]): number {
  if (!coupon || coupon.type === 'freeShipping') return 0
  const eligible = eligibleSubtotal(coupon, lines)
  if (coupon.type === 'percent') return Math.min(eligible, Math.round((eligible * Math.min(100, Math.max(0, coupon.value))) / 100))
  return Math.min(eligible, Math.max(0, Math.round(coupon.value)))
}

/** Répartit la remise sur les lignes éligibles au prorata (pour la TVA et Stripe). */
export function allocateDiscount(coupon: Coupon | null, lines: PricedLine[], discountCents: number): number[] {
  const alloc = lines.map(() => 0)
  if (!coupon || discountCents <= 0) return alloc
  const eligibleIdx = lines.map((l, i) => (lineEligible(coupon, l) ? i : -1)).filter((i) => i >= 0)
  const base = eligibleIdx.reduce((s, i) => s + lines[i].lineTotalCents, 0)
  let remaining = discountCents
  eligibleIdx.forEach((i, k) => {
    const share = k === eligibleIdx.length - 1 ? remaining : Math.floor((discountCents * lines[i].lineTotalCents) / base)
    alloc[i] = Math.min(share, lines[i].lineTotalCents)
    remaining -= alloc[i]
  })
  return alloc
}

/** TVA contenue dans un montant TTC. */
export const vatFromGross = (grossCents: number, ratePct: number): number => Math.round(grossCents - grossCents / (1 + ratePct / 100))

export type Totals = {
  subtotalCents: number
  discountCents: number
  shippingCents: number
  totalCents: number
  vatCents: number
  vatBreakdown: { rate: number; vatCents: number }[]
  lineDiscounts: number[]
}

export function computeTotals(opts: {
  lines: PricedLine[]
  coupon: Coupon | null
  zone: ShippingZone
  globalFreeFromCents?: number
  shippingVatRate?: number
}): Totals {
  const { lines, coupon, zone } = opts
  const subtotalCents = lines.reduce((s, l) => s + l.lineTotalCents, 0)
  const discountCents = computeDiscount(coupon, lines)
  const lineDiscounts = allocateDiscount(coupon, lines, discountCents)
  let shippingCents = computeShipping(lines, zone, subtotalCents - discountCents, opts.globalFreeFromCents)
  if (coupon?.type === 'freeShipping') shippingCents = 0

  const byRate = new Map<number, number>()
  lines.forEach((l, i) => byRate.set(l.vatRate, (byRate.get(l.vatRate) ?? 0) + l.lineTotalCents - lineDiscounts[i]))
  const shippingRate = opts.shippingVatRate ?? 20
  if (shippingCents > 0) byRate.set(shippingRate, (byRate.get(shippingRate) ?? 0) + shippingCents)
  const vatBreakdown = [...byRate.entries()].map(([rate, gross]) => ({ rate, vatCents: vatFromGross(gross, rate) }))

  return {
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: subtotalCents - discountCents + shippingCents,
    vatCents: vatBreakdown.reduce((s, v) => s + v.vatCents, 0),
    vatBreakdown,
    lineDiscounts,
  }
}

/** Génère des codes uniques lisibles (sans 0/O/1/I) pour les giveaways. */
export function generateCodes(count: number, prefix = '', length = 8, rand: () => number = Math.random): string[] {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const out = new Set<string>()
  while (out.size < count) {
    let c = ''
    for (let i = 0; i < length; i++) c += alphabet[Math.floor(rand() * alphabet.length)]
    out.add(`${prefix}${c}`)
  }
  return [...out]
}
