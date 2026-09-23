/**
 * Machine à états des commandes (commune Stripe / PayPal / Gelato).
 * Empêche les régressions (ex. un webhook Gelato tardif « in_production » après « shipped »).
 */
export const ORDER_STATUSES = [
  'pending',
  'paid',
  'in_production',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'partially_refunded',
  'failed',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente de paiement',
  paid: 'Payée',
  in_production: 'En production',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  refunded: 'Remboursée',
  partially_refunded: 'Partiellement remboursée',
  failed: 'Paiement échoué',
}

const RANK: Record<OrderStatus, number> = {
  pending: 0,
  failed: 1,
  paid: 2,
  in_production: 3,
  shipped: 4,
  delivered: 5,
  partially_refunded: 6,
  cancelled: 7,
  refunded: 8,
}

const TERMINAL: OrderStatus[] = ['cancelled', 'refunded']

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false
  if (TERMINAL.includes(from)) return false
  if (to === 'paid') return from === 'pending' || from === 'failed'
  if (from === 'pending' || from === 'failed') return to === 'failed' || to === 'cancelled'
  if (to === 'cancelled' || to === 'refunded' || to === 'partially_refunded') return true
  return RANK[to] > RANK[from]
}

/** Correspondance des statuts Gelato (fulfillmentStatus) vers nos statuts. */
export function mapGelatoStatus(status: string): OrderStatus | null {
  switch (status) {
    case 'passed':
    case 'in_production':
    case 'printed':
    case 'uploading':
    case 'pending_approval':
      return 'in_production'
    case 'shipped':
    case 'in_transit':
      return 'shipped'
    case 'delivered':
      return 'delivered'
    case 'canceled':
    case 'cancelled':
      return 'cancelled'
    default:
      return null
  }
}
