'use client'
/** Chargement paresseux du jeu : le code du moteur n'est téléchargé que sur cette page. */
import dynamic from 'next/dynamic'

export const SaacLoader = dynamic(() => import('./SaacGame'), {
  ssr: false,
  loading: () => <p className="muted">Chargement de l’aquarium…</p>,
})
