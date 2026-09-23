import { describe, expect, it } from 'vitest'
import { canTransition, mapGelatoStatus } from '@/lib/shop/orderStatus'

describe('machine à états des commandes', () => {
  it('seul un paiement fait passer de pending à paid', () => {
    expect(canTransition('pending', 'paid')).toBe(true)
    expect(canTransition('pending', 'shipped')).toBe(false)
    expect(canTransition('paid', 'paid')).toBe(false)
  })
  it('empêche les régressions (webhook tardif)', () => {
    expect(canTransition('shipped', 'in_production')).toBe(false)
    expect(canTransition('delivered', 'shipped')).toBe(false)
    expect(canTransition('in_production', 'shipped')).toBe(true)
  })
  it('les états terminaux sont figés, les remboursements toujours possibles sinon', () => {
    expect(canTransition('refunded', 'paid')).toBe(false)
    expect(canTransition('cancelled', 'shipped')).toBe(false)
    expect(canTransition('delivered', 'refunded')).toBe(true)
    expect(canTransition('partially_refunded', 'refunded')).toBe(true)
  })
  it('traduit les statuts Gelato', () => {
    expect(mapGelatoStatus('in_production')).toBe('in_production')
    expect(mapGelatoStatus('shipped')).toBe('shipped')
    expect(mapGelatoStatus('delivered')).toBe('delivered')
    expect(mapGelatoStatus('canceled')).toBe('cancelled')
    expect(mapGelatoStatus('created')).toBeNull()
  })
})
