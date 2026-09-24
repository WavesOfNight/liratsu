'use client'
/** Boutons visibles pour couper/activer animations, sons et changer de thème. */
import React from 'react'
import { usePrefs } from './PrefsProvider'
import { playSound } from './sounds'
import styles from './PrefsToggles.module.css'
import { BubblesOffIcon, BubblesOnIcon, MoonIcon, SoundOffIcon, SoundOnIcon, SunIcon } from './ToggleIcons'

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
        {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
        <span className="sr-only">Mode sombre</span>
      </button>
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={motion}
        onClick={() => setPref('motion', !motion)}
        title={motion ? 'Couper les animations' : systemReducedMotion ? 'Réactiver les animations (ton système préfère les réduire)' : 'Activer les animations'}
      >
        {motion ? <BubblesOnIcon /> : <BubblesOffIcon />}
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
          {sound ? <SoundOnIcon /> : <SoundOffIcon />}
          <span className="sr-only">Sons</span>
        </button>
      )}
    </div>
  )
}
