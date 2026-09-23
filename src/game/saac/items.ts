/** Objets à ramasser : modifient les stats et les tirs, effets cumulables. Tous originaux. */
export type Stats = {
  maxHearts: number
  damage: number
  fireRate: number // tirs / seconde
  shotSpeed: number // px / s
  range: number // durée de vie des tirs (s)
  speed: number // px / s
  multishot: number
  piercing: boolean
  homing: boolean
  luck: number
}

export const BASE_STATS: Stats = { maxHearts: 3, damage: 1, fireRate: 2.6, shotSpeed: 150, range: 0.9, speed: 78, multishot: 1, piercing: false, homing: false, luck: 0 }

export type Item = { id: string; name: string; desc: string; color: string; glyph: string; apply: (s: Stats) => void }

export const ITEMS: Item[] = [
  { id: 'double', name: 'Bulle double', desc: 'Tir +1 projectile', color: '#bfe8ff', glyph: '◎', apply: (s) => void (s.multishot += 1) },
  { id: 'star', name: 'Étoile filante', desc: 'Dégâts +1', color: '#ffd35c', glyph: '★', apply: (s) => void (s.damage += 1) },
  { id: 'coffee', name: 'Café glacé', desc: 'Cadence +40 %', color: '#c98d5a', glyph: '☕', apply: (s) => void (s.fireRate *= 1.4) },
  { id: 'fins', name: 'Palmes roses', desc: 'Vitesse +20 %', color: '#ff7eb6', glyph: '≈', apply: (s) => void (s.speed *= 1.2) },
  { id: 'glassheart', name: 'Cœur en verre', desc: '+1 cœur max', color: '#ff5a7a', glyph: '♥', apply: (s) => void (s.maxHearts += 1) },
  { id: 'magnet', name: 'Aimant à étoiles', desc: 'Tirs à tête chercheuse', color: '#9be15d', glyph: 'U', apply: (s) => void (s.homing = true) },
  { id: 'pearl', name: 'Perle nacrée', desc: 'Tirs perçants', color: '#f4f8ff', glyph: '○', apply: (s) => void (s.piercing = true) },
  { id: 'spyglass', name: 'Longue-vue', desc: 'Portée +50 %', color: '#2ec4c9', glyph: '⌕', apply: (s) => {
    s.range *= 1.5
    s.shotSpeed *= 1.15
  } },
  { id: 'sticker', name: 'Sticker porte-bonheur', desc: 'Chance +1', color: '#9be15d', glyph: '✿', apply: (s) => void (s.luck += 1) },
  { id: 'headphones', name: 'Casque lo-fi', desc: 'Dégâts +0,5, cadence +15 %', color: '#8a7bd8', glyph: '♫', apply: (s) => {
    s.damage += 0.5
    s.fireRate *= 1.15
  } },
]
