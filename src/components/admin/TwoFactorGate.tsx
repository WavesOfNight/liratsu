'use client'
/**
 * Fournisseur global de l'admin : si l'utilisateur connecté a activé la 2FA et n'a pas
 * encore validé son code pour cette session, on affiche un écran de saisie du code.
 * (La vraie protection est côté serveur : sans cookie 2FA valide, l'API refuse tout.)
 */
import React, { useEffect, useState } from 'react'
import { useAuth } from '@payloadcms/ui'

type State = 'checking' | 'ok' | 'required'

export function TwoFactorGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<State>('checking')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      setState('ok')
      return
    }
    fetch('/api/site/2fa/status', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { required?: boolean }) => setState(d.required ? 'required' : 'ok'))
      .catch(() => setState('ok'))
  }, [user])

  if (state !== 'required') return <>{children}</>

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const r = await fetch('/api/site/2fa/verify', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    if (r.ok) window.location.reload()
    else setError('Code invalide, réessaie.')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg,#bfe8ff,#f4f8ff)' }}>
      <form
        onSubmit={submit}
        style={{ background: '#fff', padding: 32, borderRadius: 20, boxShadow: '0 20px 50px rgba(30,111,217,.25)', width: 340, textAlign: 'center' }}
      >
        <img src="/favicon.svg" alt="" width={56} height={56} />
        <h2 style={{ margin: '12px 0 4px', color: '#1B2240' }}>Double authentification</h2>
        <p style={{ color: '#46507a', fontSize: 14 }}>Saisis le code à 6 chiffres de ton application d’authentification.</p>
        <input
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]*"
          maxLength={7}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-label="Code 2FA"
          style={{ fontSize: 28, letterSpacing: 8, textAlign: 'center', width: '100%', padding: 10, borderRadius: 12, border: '2px solid #3FA9F5' }}
        />
        {error && (
          <p role="alert" style={{ color: '#b0133f' }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          style={{ marginTop: 16, width: '100%', padding: 12, borderRadius: 999, border: 0, background: 'linear-gradient(#5cbcf7,#1e6fd9)', color: '#fff', fontWeight: 700 }}
        >
          Valider
        </button>
        <p style={{ marginTop: 16 }}>
          <a href="/admin/logout">Se déconnecter</a>
        </p>
      </form>
    </div>
  )
}
