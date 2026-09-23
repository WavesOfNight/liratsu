/** Pied de page : liens légaux, réseaux, crédit « Codé par El Technico Lionel » animé au survol. */
import Link from 'next/link'
import React from 'react'
import { CookieSettingsLink } from '../consent/CookieConsent'
import { SocialIcon, type SocialName } from '../SocialIcon'
import styles from './Footer.module.css'

type Props = {
  socials: { name: SocialName; url: string }[]
  footerText: string
  devCredit: string
  publisherCredit: string
  animateCredit: boolean
}

export function Footer({ socials, footerText, devCredit, publisherCredit, animateCredit }: Props) {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <ul className={styles.socials} aria-label="Réseaux sociaux">
          {socials.map((s) => (
            <li key={s.name}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name} className={styles.social}>
                <SocialIcon name={s.name} />
              </a>
            </li>
          ))}
        </ul>
        <nav aria-label="Informations légales" className={styles.legal}>
          <Link href="/legal/mentions-legales">Mentions légales</Link>
          <Link href="/legal/cgu">CGU</Link>
          <Link href="/legal/cgv">CGV</Link>
          <Link href="/legal/confidentialite">Confidentialité</Link>
          <Link href="/legal/cookies">Cookies</Link>
          <CookieSettingsLink />
        </nav>
        <p className={styles.small}>
          {footerText} · {publisherCredit}
        </p>
        <p className={`${styles.credit} ${animateCredit ? styles.animated : ''}`}>
          <span className={styles.wrench} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M21 6.5a5 5 0 0 1-6.6 4.7L6 19.6a2 2 0 0 1-2.8-2.8l8.4-8.4A5 5 0 0 1 17.5 3l-3 3 .9 2.6 2.6.9Z" fill="currentColor" />
            </svg>
          </span>
          {devCredit}
          <span className={styles.star} aria-hidden="true">
            ✦
          </span>
        </p>
      </div>
    </footer>
  )
}
