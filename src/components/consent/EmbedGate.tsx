'use client'
/**
 * Bloque un contenu tiers (iframe) tant que le visiteur n'a pas consenti.
 * Placeholder aero : « Cliquer pour charger le live » (chargement ponctuel, sans tout accepter).
 */
import React from 'react'
import { useConsent } from './CookieConsent'
import styles from './EmbedGate.module.css'

type Props = {
  id: string
  provider: 'Twitch' | 'YouTube' | 'TikTok' | 'Instagram'
  label?: string
  thumbnail?: string | null
  ratio?: string
  children: React.ReactNode
}

export function EmbedGate({ id, provider, label, thumbnail, ratio = '16 / 9', children }: Props) {
  const { consent, allowOnce, allowedOnce, openSettings } = useConsent()
  if (consent?.embeds || allowedOnce.has(id)) return <div style={{ aspectRatio: ratio }} className={styles.frame}>{children}</div>
  return (
    <div className={styles.placeholder} style={{ aspectRatio: ratio, backgroundImage: thumbnail ? `url(${thumbnail})` : undefined }}>
      <div className={styles.veil}>
        <button type="button" className="candy-btn" onClick={() => allowOnce(id)}>
          ▶ {label ?? `Cliquer pour charger ${provider}`}
        </button>
        <p className={styles.note}>
          Ce contenu est hébergé par {provider}, qui peut déposer des cookies.{' '}
          <button type="button" className={styles.link} onClick={openSettings}>
            Autoriser pour tout le site
          </button>
        </p>
      </div>
    </div>
  )
}
