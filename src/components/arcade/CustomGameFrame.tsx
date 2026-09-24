'use client'
/**
 * Rendu d'un jeu « code personnalisé » (collé dans l'admin) dans une iframe isolée.
 * Chargée depuis /api/site/arcade/<slug>/render — un vrai document séparé, PAS un
 * `srcdoc` (qui hériterait du CSP strict à nonce du site et bloquerait tout script
 * inline). Cette route a sa propre CSP permissive mais sans réseau (connect-src 'none',
 * pas de ressource distante), et l'iframe est en `sandbox="allow-scripts"` uniquement :
 * pas d'accès aux cookies/stockage du site, pas de navigation, pas de popup.
 *
 * Le jeu peut signaler un score via
 * `window.parent.postMessage({type:'liratsu:score', score}, '*')` ; affiché ici en lecture
 * seule (non classé : impossible à valider côté serveur pour du code arbitraire).
 */
import React, { useEffect, useRef, useState } from 'react'
import { AeroWindow } from '../AeroWindow'
import styles from './arcade.module.css'

export function CustomGameFrame({ slug, title, hasCode }: { slug: string; title: string; hasCode: boolean }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow) return
      const data = e.data as { type?: string; score?: number } | null
      if (data?.type === 'liratsu:score' && typeof data.score === 'number') setScore(data.score)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  if (!hasCode) {
    return (
      <AeroWindow title={title} icon="gamepad">
        <p className="muted">Ce jeu n’a pas encore de code : reviens bientôt !</p>
      </AeroWindow>
    )
  }

  return (
    <div className={styles.frameWrap}>
      <iframe ref={ref} src={`/api/site/arcade/${slug}/render`} title={title} sandbox="allow-scripts" className={styles.frame} />
      {score !== null && (
        <p className={styles.score}>
          Score en cours : <strong>{score}</strong> <span className="muted">(jeu personnalisé, classement non certifié)</span>
        </p>
      )}
    </div>
  )
}
