'use client'
/**
 * Panier persistant (localStorage), synchronisé entre onglets.
 * Les prix stockés ne servent qu'à l'affichage : le serveur recalcule tout.
 */
import { useSyncExternalStore } from 'react'

export type CartLine = { productId: string; sku: string; quantity: number; title: string; variantLabel: string; priceCents: number; image?: string | null; slug: string }

const KEY = 'liratsu:cart'
const listeners = new Set<() => void>()
let cache: CartLine[] | null = null

function read(): CartLine[] {
  if (cache) return cache
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || '[]') as CartLine[]
  } catch {
    cache = []
  }
  return cache
}

function write(lines: CartLine[]) {
  cache = lines
  try {
    localStorage.setItem(KEY, JSON.stringify(lines))
  } catch {
    /* stockage plein ou désactivé */
  }
  listeners.forEach((l) => l())
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      cache = null
      listeners.forEach((l) => l())
    }
  })
}

const EMPTY: CartLine[] = []

export function useCart() {
  const lines = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    read,
    () => EMPTY,
  )
  return {
    lines,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    add(line: CartLine) {
      const cur = read()
      const i = cur.findIndex((l) => l.productId === line.productId && l.sku === line.sku)
      if (i >= 0) write(cur.map((l, k) => (k === i ? { ...l, quantity: Math.min(20, l.quantity + line.quantity) } : l)))
      else write([...cur, line])
    },
    setQty(productId: string, sku: string, quantity: number) {
      write(
        read()
          .map((l) => (l.productId === productId && l.sku === sku ? { ...l, quantity: Math.max(0, Math.min(20, quantity)) } : l))
          .filter((l) => l.quantity > 0),
      )
    },
    clear() {
      write([])
    },
  }
}
