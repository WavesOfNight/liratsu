'use client'
/** Bouton « chercher la VOD automatiquement » sur la fiche d'un ancien créneau. */
import React, { useState } from 'react'
import { useDocumentInfo, useForm } from '@payloadcms/ui'

export function FindVodButton() {
  const { id } = useDocumentInfo()
  const { dispatchFields } = useForm()
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  if (!id) return null

  const run = async () => {
    setBusy(true)
    setMsg('')
    const r = await fetch('/api/site/admin/schedule/find-vod', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const d = await r.json().catch(() => ({}))
    setBusy(false)
    if (r.ok && d.found) {
      dispatchFields({ type: 'UPDATE', path: 'vodUrl', value: d.url })
      dispatchFields({ type: 'UPDATE', path: 'vodTitle', value: d.title })
      dispatchFields({ type: 'UPDATE', path: 'vodFound', value: true })
      setMsg('VOD trouvée ✦')
    } else setMsg(d.message ?? d.error ?? 'Erreur')
  }

  return (
    <div style={{ margin: '4px 0 16px' }}>
      <button type="button" className="btn btn--style-secondary btn--size-small" onClick={run} disabled={busy}>
        🔍 Chercher la VOD automatiquement
      </button>
      {msg && (
        <p role="status" style={{ marginTop: 6 }}>
          {msg}
        </p>
      )}
    </div>
  )
}
