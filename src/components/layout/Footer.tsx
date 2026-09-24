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
          <img src="/lionel.png" alt="" width={28} height={28} className={styles.avatar} />
          {devCredit}
          <span className={styles.star} aria-hidden="true">
            ✦
          </span>
        </p>
      </div>
    </footer>
  )
}
