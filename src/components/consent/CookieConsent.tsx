'use client'
/**
 * Bandeau de consentement conforme aux recommandations CNIL :
 * - « Tout refuser » aussi simple et visible que « Tout accepter » ;
 * - aucun contenu tiers (Twitch, YouTube, TikTok, Instagram) ni statistique avant consentement ;
 * - choix conservé 6 mois, modifiable à tout moment (lien « Gérer mes cookies »).
 */
import Link from 'next/link'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import styles from './CookieConsent.module.css'

export type Consent = { embeds: boolean; analytics: boolean; at: number }
const KEY = 'liratsu:consent'
const MAX_AGE = 1000 * 60 * 60 * 24 * 182

type Ctx = {
  consent: Consent | null
  save: (c: Omit<Consent, 'at'>) => void
  openSettings: () => void
  allowOnce: (key: string) => void
  allowedOnce: Set<string>
}
const ConsentContext = createContext<Ctx | null>(null)

export function useConsent() {
  const c = useContext(ConsentContext)
  if (!c) throw new Error('useConsent hors ConsentProvider')
  return c
}

export function ConsentProvider({ children, analyticsAvailable }: { children: React.ReactNode; analyticsAvailable: boolean }) {
  const [consent, setConsent] = useState<Consent | null>(null)
  const [ready, setReady] = useState(false)
  const [panel, setPanel] = useState(false)
  const [allowedOnce, setAllowedOnce] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem(KEY) || 'null') as Consent | null
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronisation avec le stockage/API du navigateur après hydratation
      if (c && Date.now() - c.at < MAX_AGE) setConsent(c)
    } catch {
      /* rien */
    }
     
    setReady(true)
  }, [])

  const save = useCallback((c: Omit<Consent, 'at'>) => {
    const full = { ...c, at: Date.now() }
    setConsent(full)
    setPanel(false)
    try {
      localStorage.setItem(KEY, JSON.stringify(full))
    } catch {
      /* rien */
    }
  }, [])

  const allowOnce = useCallback((key: string) => setAllowedOnce((s) => new Set(s).add(key)), [])

  return (
    <ConsentContext.Provider value={{ consent, save, openSettings: () => setPanel(true), allowOnce, allowedOnce }}>
      {children}
      {ready && (!consent || panel) && <Banner analyticsAvailable={analyticsAvailable} initial={consent} onSave={save} detailed={panel} onClose={consent ? () => setPanel(false) : undefined} />}
    </ConsentContext.Provider>
  )
}

function Banner({
  analyticsAvailable,
  initial,
  onSave,
  detailed,
  onClose,
}: {
  analyticsAvailable: boolean
  initial: Consent | null
  onSave: (c: Omit<Consent, 'at'>) => void
  detailed: boolean
  onClose?: () => void
}) {
  const [custom, setCustom] = useState(detailed)
  const [embeds, setEmbeds] = useState(initial?.embeds ?? false)
  const [analytics, setAnalytics] = useState(initial?.analytics ?? false)

  return (
    <div className={styles.banner} role="dialog" aria-modal="false" aria-labelledby="consent-title">
      <div className="aero-window">
        <div className="aero-window__bar">
          <span className="aero-window__title" id="consent-title">
            🍪 Cookies & contenus externes
          </span>
          {onClose && (
            <button type="button" className="aero-window__ctrl aero-window__ctrl--close" onClick={onClose} aria-label="Fermer sans modifier">
              ×
            </button>
          )}
        </div>
        <div className="aero-window__body">
          <p className={styles.text}>
            Ce site n’utilise aucun cookie publicitaire. Avec ton accord, on peut afficher les lives et vidéos (Twitch, YouTube, TikTok, Instagram), qui déposent leurs propres
            cookies{analyticsAvailable ? ', et mesurer l’audience avec un outil auto-hébergé' : ''}. Tu peux changer d’avis à tout moment.{' '}
            <Link href="/legal/cookies">En savoir plus</Link>
          </p>
          {custom && (
            <div className={styles.options}>
              <label className="check">
                <input type="checkbox" checked disabled /> <span>Nécessaires (panier, préférences d’affichage) — toujours actifs</span>
              </label>
              <label className="check">
                <input type="checkbox" checked={embeds} onChange={(e) => setEmbeds(e.target.checked)} />
                <span>Contenus externes : lives Twitch, vidéos YouTube, posts TikTok/Instagram</span>
              </label>
              {analyticsAvailable && (
                <label className="check">
                  <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
                  <span>Mesure d’audience anonyme (auto-hébergée)</span>
                </label>
              )}
            </div>
          )}
          <div className={styles.actions}>
            <button type="button" className="candy-btn candy-btn--ghost" onClick={() => onSave({ embeds: false, analytics: false })}>
              Tout refuser
            </button>
            {custom ? (
              <button type="button" className="candy-btn candy-btn--ghost" onClick={() => onSave({ embeds, analytics })}>
                Enregistrer mes choix
              </button>
            ) : (
              <button type="button" className="candy-btn candy-btn--ghost" onClick={() => setCustom(true)}>
                Personnaliser
              </button>
            )}
            <button type="button" className="candy-btn" onClick={() => onSave({ embeds: true, analytics: analyticsAvailable })}>
              Tout accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CookieSettingsLink() {
  const ctx = useContext(ConsentContext)
  if (!ctx) return null
  return (
    <button type="button" onClick={ctx.openSettings}>
      Gérer mes cookies
    </button>
  )
}
