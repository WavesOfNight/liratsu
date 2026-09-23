import Link from 'next/link'
import React from 'react'
import styles from './not-found.module.css'

/** 404 : un aquarium vide. Le poisson échappé est cliquable et ramène à l'accueil. */
export default function NotFound() {
  return (
    <div className="container">
      <div className={styles.wrap}>
        <h1 className={styles.title}>404</h1>
        <p className={styles.text}>Le poisson de cette page s’est échappé…</p>
        <div className={styles.tank} aria-hidden="true">
          <div className={styles.water} />
          <div className={styles.sand} />
          <i className={styles.b1} />
          <i className={styles.b2} />
          <i className={styles.b3} />
          <div className={styles.weed} />
        </div>
        <Link href="/" className={styles.fish} aria-label="Rattraper le poisson et retourner à l’accueil">
          <svg viewBox="0 0 64 40" width="64" height="40" aria-hidden="true">
            <path d="M10 20c8-14 30-16 40-6l10-8v28l-10-8c-10 10-32 8-40-6Z" fill="#ff8a3d" stroke="#fff" strokeWidth="2.5" />
            <path d="M24 10c6-3 14-3 20 1" stroke="#fff" strokeWidth="2.5" fill="none" opacity=".7" />
            <circle cx="18" cy="18" r="3.2" fill="#1b2240" />
          </svg>
        </Link>
        <p>
          <Link href="/" className="candy-btn">
            Retour à l’accueil
          </Link>
        </p>
      </div>
    </div>
  )
}
