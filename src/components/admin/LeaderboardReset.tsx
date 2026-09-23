'use client'
/** Remise à zéro du classement (tout, ou seulement le défi du jour). */
import React, { useState } from 'react'

export function LeaderboardReset() {
  const [msg, setMsg] = useState('')
  const reset = async (scope: 'all' | 'daily') => {
    if (!confirm(scope === 'all' ? 'Masquer TOUS les scores du classement ?' : 'Masquer les scores des défis du jour ?')) return
    const r = await fetch('/api/site/admin/leaderboard/reset', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope }),
    })
    const d = await r.json().catch(() => ({}))
    setMsg(r.ok ? `${d.count} scores masqués.` : d.error || 'Erreur')
  }
  return (
    <div style={{ display: 'flex', gap: 8, margin: '0 0 24px', alignItems: 'center' }}>
      <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => reset('daily')}>
        Réinitialiser les défis du jour
      </button>
      <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => reset('all')}>
        Réinitialiser tout le classement
      </button>
      {msg && <span role="status">{msg}</span>}
    </div>
  )
}
