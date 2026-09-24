'use client'
/**
 * Préférences du visiteur (stockées localement, jamais envoyées au serveur) :
 * thème clair/sombre, animations, sons. `prefers-reduced-motion` est toujours respecté.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { setSoundsEnabled } from './sounds'

import { PREFS_KEY as KEY, type ThemeMode } from '@/lib/themeScript'

export type { ThemeMode }
type Prefs = { theme: ThemeMode; motion: boolean; sound: boolean }
type Ctx = Prefs & {
  systemReducedMotion: boolean
  effectiveMotion: boolean
  setPref: <K extends keyof Prefs>(k: K, v: Prefs[K]) => void
  soundsAvailable: boolean
}

const PrefsContext = createContext<Ctx | null>(null)

function readStored(): Partial<Prefs> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<Prefs>
  } catch {
    return {}
  }
}

export function applyTheme(mode: ThemeMode) {
  const dark = mode === 'dark' || (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

export function PrefsProvider({ children, defaultTheme, soundsAvailable }: { children: React.ReactNode; defaultTheme: ThemeMode; soundsAvailable: boolean }) {
  const [prefs, setPrefs] = useState<Prefs>({ theme: defaultTheme, motion: true, sound: false })
  const [systemReducedMotion, setSRM] = useState(false)

  useEffect(() => {
    const stored = readStored()
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    // Le système ne sert que de valeur de départ : s'il n'y a pas de préférence enregistrée
    // et que l'OS demande de réduire les animations, on démarre coupé — mais le bouton reste
    // toujours cliquable pour les réactiver explicitement (pas de blocage définitif).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronisation avec le stockage/API du navigateur après hydratation
    setPrefs((p) => ({ ...p, motion: mq.matches ? false : p.motion, ...stored }))
    setSRM(mq.matches)
    const onChange = () => setSRM(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    applyTheme(prefs.theme)
    document.documentElement.dataset.motion = prefs.motion ? 'full' : 'reduce'
    setSoundsEnabled(soundsAvailable && prefs.sound)
    if (prefs.theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const f = () => applyTheme('auto')
      mq.addEventListener('change', f)
      return () => mq.removeEventListener('change', f)
    }
  }, [prefs, soundsAvailable])

  const setPref = useCallback(<K extends keyof Prefs>(k: K, v: Prefs[K]) => {
    setPrefs((p) => {
      const next = { ...p, [k]: v }
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        /* stockage indisponible */
      }
      return next
    })
  }, [])

  const value = useMemo<Ctx>(
    // `effectiveMotion` reflète uniquement le choix explicite de la personne : la préférence
    // système ne fait que définir la valeur de départ (voir l'effet ci-dessus), jamais un blocage.
    () => ({ ...prefs, systemReducedMotion, effectiveMotion: prefs.motion, setPref, soundsAvailable }),
    [prefs, systemReducedMotion, setPref, soundsAvailable],
  )
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
}

export function usePrefs(): Ctx {
  const ctx = useContext(PrefsContext)
  if (!ctx) throw new Error('usePrefs hors PrefsProvider')
  return ctx
}

