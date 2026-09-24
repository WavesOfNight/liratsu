/**
 * Décor de fond statique façon Frutiger Aero : grands halos de lumière flous (profondeur)
 * + bulles de verre nettes (reflet, liseré) façon makeaero.com/frutiger.js. Indépendant du
 * canvas animé (bulles qui montent, poissons) : comble le fond même quand celui-ci est calme.
 */
import React from 'react'
import styles from './AeroGlow.module.css'

type Glow = { top?: string; bottom?: string; left?: string; right?: string; size: number; color: string }

const GLOWS: Glow[] = [
  { top: '-12%', left: '-8%', size: 520, color: 'var(--c-aero)' },
  { top: '-10%', right: '-10%', size: 460, color: 'var(--c-lagoon)' },
  { bottom: '-14%', right: '-6%', size: 420, color: 'var(--c-star)' },
  { bottom: '-16%', left: '-10%', size: 400, color: 'var(--c-candy)' },
]

const ORBS: (Glow & { delay: number })[] = [
  { top: '10%', right: '6%', size: 130, color: 'var(--c-lagoon)', delay: 0 },
  { top: '62%', left: '3%', size: 96, color: 'var(--c-candy)', delay: 4 },
  { top: '24%', left: '5%', size: 60, color: 'var(--c-aero)', delay: 9 },
  { top: '76%', right: '9%', size: 84, color: 'var(--c-star)', delay: 2 },
  { top: '42%', right: '2%', size: 54, color: 'var(--c-lime)', delay: 6 },
  { top: '4%', left: '32%', size: 40, color: 'var(--c-aero)', delay: 12 },
]

export function AeroGlow() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      {GLOWS.map((g, i) => (
        <span
          key={i}
          className={styles.glow}
          style={{
            top: g.top,
            bottom: g.bottom,
            left: g.left,
            right: g.right,
            width: g.size,
            height: g.size,
            background: `radial-gradient(circle, color-mix(in srgb, ${g.color} 75%, transparent) 0%, transparent 70%)`,
          }}
        />
      ))}
      {ORBS.map((o, i) => (
        <span
          key={i}
          className={styles.orb}
          style={{
            top: o.top,
            bottom: o.bottom,
            left: o.left,
            right: o.right,
            width: o.size,
            height: o.size,
            animationDelay: `${o.delay}s`,
            background: `radial-gradient(circle at 30% 26%, rgba(255,255,255,.95) 0%, rgba(255,255,255,.4) 16%, color-mix(in srgb, ${o.color} 55%, transparent) 55%, color-mix(in srgb, ${o.color} 22%, transparent) 100%)`,
          }}
        />
      ))}
    </div>
  )
}
