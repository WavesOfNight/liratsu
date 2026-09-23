'use client'
/**
 * Easter eggs globaux (discrets, jamais bloquants) :
 * - Konami code → pluie de poissons rouges et de bulles
 * - taper « lionel » → wizz d'El Technico Lionel (secousse désactivée si mouvement réduit)
 * - message ASCII dans la console
 * - easter egg secret (poisson doré rare ou « glouglou ») → code surprise
 */
import React, { useEffect, useRef, useState } from 'react'
import { usePrefs } from '../prefs/PrefsProvider'
import { playSound } from '../prefs/sounds'
import { useEggs } from './EggsContext'
import styles from './EasterEggs.module.css'

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

function isTypingTarget(t: EventTarget | null) {
  const el = t as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
}

export function EasterEggs() {
  const eggs = useEggs()
  const { effectiveMotion } = usePrefs()
  const [wizz, setWizz] = useState(false)
  const [secret, setSecret] = useState<{ code?: string; message?: string } | null>(null)
  const [goldfish, setGoldfish] = useState<{ top: number; dir: 1 | -1 } | null>(null)
  const goldClicks = useRef(0)
  const buffer = useRef<string[]>([])
  const typed = useRef('')

  // Message console
  useEffect(() => {
    if (!eggs.console) return
    const art = `
   .-~~~-.        ✦  Liratsu  ✦
  /  o  o \\      Dessin · Musique · Jeu vidéo
 (    ><   )~<
  \\  '--' /       Codé avec des bulles par
   '-...-'        El Technico Lionel
`
    console.log(`%c${art}`, 'color:#1e6fd9;font-family:monospace;font-size:12px')
    console.log('%cTu fouilles la console ? Essaie le Konami code… 🐟', 'color:#ff7eb6;font-weight:bold')
  }, [eggs.console])

  // Clavier : Konami + mots magiques
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (eggs.konami) {
        buffer.current = [...buffer.current, key].slice(-KONAMI.length)
        if (buffer.current.join(',') === KONAMI.join(',')) {
          buffer.current = []
          window.dispatchEvent(new Event('liratsu:rain'))
          playSound('coin')
        }
      }
      if (key.length === 1) {
        typed.current = (typed.current + key).slice(-12)
        if (eggs.wizz && typed.current.endsWith('lionel')) {
          typed.current = ''
          setWizz(true)
          playSound('wizz')
        }
        if (eggs.secretCode && eggs.secretHint === 'typeGlouglou' && typed.current.endsWith('glouglou')) {
          typed.current = ''
          void revealSecret()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eggs])

  // Secousse de l'écran pendant le wizz
  useEffect(() => {
    if (!wizz || !effectiveMotion) return
    document.body.classList.add(styles.shake)
    const t = window.setTimeout(() => document.body.classList.remove(styles.shake), 700)
    return () => {
      window.clearTimeout(t)
      document.body.classList.remove(styles.shake)
    }
  }, [wizz, effectiveMotion])

  // Poisson doré rare (easter egg secret)
  useEffect(() => {
    if (!eggs.secretCode || eggs.secretHint !== 'fishClicks') return
    const schedule = () =>
      window.setTimeout(
        () => {
          if (Math.random() < 0.5) setGoldfish({ top: 20 + Math.random() * 60, dir: Math.random() < 0.5 ? 1 : -1 })
          timer = schedule()
        },
        25000 + Math.random() * 30000,
      )
    let timer = schedule()
    return () => window.clearTimeout(timer)
  }, [eggs.secretCode, eggs.secretHint])

  async function revealSecret() {
    const r = await fetch('/api/site/eggs/secret', { method: 'POST' }).catch(() => null)
    const d = r?.ok ? ((await r.json()) as { code?: string; message?: string }) : null
    setSecret(d ?? { message: 'Tu as trouvé le secret… mais la surprise n’est pas encore prête. Reviens bientôt !' })
    playSound('coin')
  }

  return (
    <>
      {goldfish && (
        <button
          type="button"
          className={`${styles.goldfish} ${goldfish.dir === 1 ? styles.ltr : styles.rtl}`}
          style={{ top: `${goldfish.top}vh` }}
          onAnimationEnd={() => {
            setGoldfish(null)
            goldClicks.current = 0
          }}
          onClick={() => {
            goldClicks.current += 1
            playSound('pop')
            if (goldClicks.current >= 3) {
              setGoldfish(null)
              goldClicks.current = 0
              void revealSecret()
            }
          }}
          aria-label="Un poisson doré passe… attrape-le !"
        >
          <svg viewBox="0 0 48 28" width="48" height="28" aria-hidden="true">
            <path d="M8 14c6-10 22-12 30-4l8-6v20l-8-6c-8 8-24 6-30-4Z" fill="#ffd35c" stroke="#fff" strokeWidth="2" />
            <circle cx="14" cy="12" r="2.4" fill="#1b2240" />
            <path d="M18 8c4-2 10-2 14 1" stroke="#fff" strokeWidth="2" fill="none" opacity=".7" />
          </svg>
        </button>
      )}

      {wizz && (
        <div className={styles.msn} role="dialog" aria-modal="false" aria-labelledby="wizz-title">
          <div className="aero-window">
            <div className="aero-window__bar">
              <span className="aero-window__title" id="wizz-title">
                Messagerie Bulle ✦ El Technico Lionel
              </span>
              <button type="button" className="aero-window__ctrl aero-window__ctrl--close" onClick={() => setWizz(false)} aria-label="Fermer">
                ×
              </button>
            </div>
            <div className="aero-window__body">
              <p className={styles.wizzText}>
                <strong>El Technico Lionel</strong> vous a envoyé un wizz !
              </p>
              <p className="muted">« Salut ! C’est moi qui ai codé ce site. Merci de passer par ici ✦ »</p>
            </div>
          </div>
        </div>
      )}

      {secret && (
        <div className={styles.msn} role="dialog" aria-modal="false" aria-labelledby="secret-title">
          <div className="aero-window">
            <div className="aero-window__bar">
              <span className="aero-window__title" id="secret-title">
                ✦ Surprise !
              </span>
              <button type="button" className="aero-window__ctrl aero-window__ctrl--close" onClick={() => setSecret(null)} aria-label="Fermer">
                ×
              </button>
            </div>
            <div className="aero-window__body">
              <p>{secret.message ?? 'Bravo, tu as trouvé l’easter egg secret !'}</p>
              {secret.code && (
                <p>
                  Ton code surprise : <code className={styles.code}>{secret.code}</code>
                  <br />
                  <a href="/communaute#codes">À utiliser dans l’Espace communauté →</a>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
