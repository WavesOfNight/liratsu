'use client'
/** Bouton « envoyer sur Discord » dans le Planning : l'envoi n'est jamais automatique, seul ce bouton déclenche un post. */
import React, { useState } from 'react'

export function SendScheduleToDiscord() {
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async () => {
    setBusy(true)
    setMsg('')
    const r = await fetch('/api/site/admin/schedule/send-discord', { method: 'POST', credentials: 'include' })
    const d = await r.json().catch(() => ({}))
    setBusy(false)
    setMsg(r.ok ? (d.message ?? 'Envoyé ✦') : (d.error ?? 'Erreur'))
  }

  return (
    <div style={{ margin: '4px 0 16px', padding: 12, borderRadius: 8, background: 'var(--theme-elevation-50)' }}>
      <p style={{ marginTop: 0, fontSize: 13, opacity: 0.8 }}>Sauvegarder ne poste rien sur Discord. Clique ici quand le planning ci-dessous est prêt à être annoncé :</p>
      <button type="button" className="btn btn--style-secondary btn--size-small" onClick={run} disabled={busy}>
        📤 Envoyer ce planning sur Discord
      </button>
      {msg && (
        <p role="status" style={{ marginTop: 6 }}>
          {msg}
        </p>
      )}
    </div>
  )
}
