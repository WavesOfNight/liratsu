'use client'
/** En-tête façon barre des tâches glossy : nom du site, navigation en onglets, préférences. */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'
import { PrefsToggles } from '../prefs/PrefsToggles'
import { playSound } from '../prefs/sounds'
import styles from './Header.module.css'

export type NavItem = { href: string; label: string; soon?: boolean }
export type HeaderMember = { displayName: string; avatarUrl: string | null } | null

export function Header({ items, siteName, member = null }: { items: NavItem[]; siteName: string; member?: HeaderMember }) {
  const pathname = usePathname()
  // Le menu mobile se referme de lui-même quand la page change.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const setOpen = (v: boolean) => setOpenOn(v ? pathname : null)

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label={`${siteName} — accueil`} onClick={() => playSound('click')}>
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
          {member && (
            <Link href="/communaute/profil" className={styles.profileLink} title={`Mon profil (${member.displayName})`} onClick={() => playSound('click')}>
              {member.avatarUrl ? (
                <img src={`/_next/image?url=${encodeURIComponent(member.avatarUrl)}&w=64&q=75`} alt="" width={40} height={40} />
              ) : (
                <span aria-hidden="true">👤</span>
              )}
              <span className="sr-only">Mon profil</span>
            </Link>
          )}
          <PrefsToggles />
        </div>
      </div>
    </header>
  )
}
