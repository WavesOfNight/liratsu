'use client'
/**
 * Bouton pour autoriser l'app à lire les totaux abonnés/followers du compte Twitch de
 * Liratsu (à ne faire qu'une fois — Twitch exige un jeton du compte pour ces totaux,
 * l'API Client ID/Secret seule ne suffit pas). Ouvre l'écran d'autorisation Twitch dans
 * le même onglet ; on revient sur cette page une fois fait.
 */
import React from 'react'
import { useField } from '@payloadcms/ui'

export function ConnectTwitchBroadcaster() {
  const { value } = useField<string>({ path: 'twitch.broadcasterRefreshToken' })
  const connected = Boolean(value)

  return (
    <div style={{ margin: '4px 0 16px', padding: 12, borderRadius: 8, background: 'var(--theme-elevation-50)' }}>
      <p style={{ marginTop: 0, fontSize: 13, opacity: 0.8 }}>
        Nécessaire pour afficher automatiquement le nombre d’abonné·e·s ou de followers dans le bloc « Objectif communautaire ». À faire une seule fois, connecté·e avec le
        compte Twitch de Liratsu elle-même (pas un viewer).
      </p>
      <p style={{ margin: '0 0 8px', fontWeight: 700 }}>{connected ? '✅ Compte connecté' : '⚠️ Compte non connecté'}</p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- lien vers une route API (redirection OAuth), pas une page Next.js */}
      <a href="/api/site/admin/twitch/broadcaster-auth" className="btn btn--style-secondary btn--size-small">
        {connected ? '🔁 Reconnecter le compte Twitch' : '🔗 Connecter le compte Twitch de Liratsu'}
      </a>
    </div>
  )
}
