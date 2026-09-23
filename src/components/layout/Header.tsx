'use client'
/** En-tête façon barre des tâches glossy : orbe-logo, navigation en onglets, préférences. */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { PrefsToggles } from '../prefs/PrefsToggles'
import { playSound } from '../prefs/sounds'
import styles from './Header.module.css'

export type NavItem = { href: string; label: string; soon?: boolean }

export function Header({ items, siteName }: { items: NavItem[]; siteName: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [pathname])

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label={`${siteName} — accueil`} onClick={() => playSound('click')}>
          <img src="/favicon.svg" alt="" width={40} height={40} className={styles.orb} />
          <span className={styles.brandText}>{siteName}</span>
        </Link>
        <button type="button" className={styles.burger} aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>
          <span aria-hidden="true">{open ? '✕' : '☰'}</span>
          <span className="sr-only">Menu</span>
        </button>
        <nav id="main-nav" className={`${styles.nav} ${open ? styles.open : ''}`} aria-label="Navigation principale">
          <ul>
            {items.map((it) => {
              const active = it.href === '/' ? pathname === '/' : pathname.startsWith(it.href)
              return (
                <li key={it.href}>
                  <Link href={it.href} className={styles.tab} aria-current={active ? 'page' : undefined} onClick={() => playSound('click')}>
                    {it.label}
                    {it.soon && <span className={styles.soon}>bientôt ?</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className={styles.prefs}>
          <PrefsToggles />
        </div>
      </div>
    </header>
  )
}
