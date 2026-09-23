'use client'
/** Boutons visibles pour couper/activer animations, sons et changer de thème. */
import React from 'react'
import { usePrefs } from './PrefsProvider'
import { playSound } from './sounds'
import styles from './PrefsToggles.module.css'

export function PrefsToggles() {
  const { theme, motion, sound, setPref, soundsAvailable, systemReducedMotion } = usePrefs()
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  return (
    <div className={styles.toggles} role="group" aria-label="Préférences d’affichage">
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={theme === 'dark'}
        onClick={() => setPref('theme', nextTheme)}
        title={theme === 'dark' ? 'Passer au ciel (mode clair)' : 'Passer à l’aquarium de nuit (mode sombre)'}
      >
        <span aria-hidden="true">{theme === 'dark' ? '🌙' : '☀️'}</span>
        <span className="sr-only">Mode sombre</span>
      </button>
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={motion && !systemReducedMotion}
        disabled={systemReducedMotion}
        onClick={() => setPref('motion', !motion)}
        title={systemReducedMotion ? 'Animations réduites par ton système' : motion ? 'Couper les animations' : 'Activer les animations'}
      >
        <span aria-hidden="true">{motion && !systemReducedMotion ? '🫧' : '⏸️'}</span>
        <span className="sr-only">Animations</span>
      </button>
      {soundsAvailable && (
        <button
          type="button"
          className={styles.toggle}
          aria-pressed={sound}
          onClick={() => {
            setPref('sound', !sound)
            if (!sound) playSound('notify', true)
          }}
          title={sound ? 'Couper les sons' : 'Activer les petits sons rétro'}
        >
          <span aria-hidden="true">{sound ? '🔊' : '🔇'}</span>
          <span className="sr-only">Sons</span>
        </button>
      )}
    </div>
  )
}
