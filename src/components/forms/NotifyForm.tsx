'use client'
/** Formulaire « préviens-moi » (email + consentement explicite RGPD). */
import Link from 'next/link'
import React, { useState } from 'react'

export function NotifyForm({ section }: { section: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setState('sending')
    const r = await fetch('/api/site/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fd.get('email'), section, consent: fd.get('consent') === 'on', website: fd.get('website') }),
    }).catch(() => null)
    const d = (await r?.json().catch(() => ({}))) as { error?: string } | undefined
    if (r?.ok) {
      setState('ok')
      setMsg('C’est noté ! Tu seras prévenu·e dès l’ouverture ✦')
    } else {
      setState('error')
      setMsg(d?.error ?? 'Oups, réessaie dans un instant.')
    }
  }

  if (state === 'ok') return <p className="form-msg">{msg}</p>
  return (
    <form onSubmit={onSubmit} className="stack" style={{ gap: 12 }}>
      <div className="field">
        <label htmlFor={`notify-${section}`}>Préviens-moi à l’ouverture</label>
        <input id={`notify-${section}`} name="email" type="email" required autoComplete="email" placeholder="ton@email.fr" />
      </div>
      {/* Pot de miel anti-robots */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />
      <label className="check">
        <input type="checkbox" name="consent" required />
        <span>
          J’accepte que mon email soit utilisé uniquement pour être prévenu·e de l’ouverture, puis supprimé. <Link href="/legal/confidentialite">Politique de confidentialité</Link>
        </span>
      </label>
      <button type="submit" className="candy-btn candy-btn--pink" disabled={state === 'sending'}>
        {state === 'sending' ? 'Envoi…' : 'Me prévenir ✦'}
      </button>
      {state === 'error' && (
        <p className="form-msg form-msg--error" role="alert">
          {msg}
        </p>
      )}
    </form>
  )
}
