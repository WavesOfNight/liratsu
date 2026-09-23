'use client'
/** Panneau d'activation/désactivation de la 2FA dans la fiche d'un membre de l'équipe. */
import React, { useState } from 'react'
import { useAuth, useDocumentInfo } from '@payloadcms/ui'

export function TwoFactorSetup() {
  const { user } = useAuth()
  const { id, data } = useDocumentInfo() as { id?: string | number; data?: { totpEnabled?: boolean } }
  const [qr, setQr] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const isSelf = user && String(user.id) === String(id)
  const enabled = Boolean(data?.totpEnabled)

  if (!isSelf) {
    return (
      <p style={{ opacity: 0.8 }}>
        {enabled ? '2FA activée pour ce compte.' : '2FA non activée.'} Seul le titulaire du compte peut la configurer.
        {enabled && user?.roles?.includes('admin') && <ResetButton id={id} />}
      </p>
    )
  }

  const call = async (path: string, body?: object) => {
    const r = await fetch(`/api/site/2fa/${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    })
    return { ok: r.ok, data: (await r.json().catch(() => ({}))) as Record<string, string> }
  }

  return (
    <div style={{ padding: 16, border: '1px solid var(--theme-elevation-150)', borderRadius: 12, marginBottom: 16 }}>
      {enabled ? (
        <>
          <p>✅ La double authentification est active sur ton compte.</p>
          <input placeholder="Code actuel" value={code} onChange={(e) => setCode(e.target.value)} />
          <button
            type="button"
            onClick={async () => {
              const r = await call('disable', { code })
              setMsg(r.ok ? 'Désactivée. Recharge la page.' : r.data.error || 'Erreur')
            }}
          >
            Désactiver
          </button>
        </>
      ) : qr ? (
        <>
          <p>Scanne ce QR code avec ton application (Aegis, 2FAS, Google Authenticator…), puis saisis le code affiché.</p>
          <img src={qr} alt="QR code 2FA" width={200} height={200} />
          <p style={{ fontFamily: 'monospace', fontSize: 12 }}>Clé manuelle : {secret}</p>
          <input placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} />
          <button
            type="button"
            onClick={async () => {
              const r = await call('enable', { code })
              setMsg(r.ok ? '2FA activée ! Recharge la page.' : r.data.error || 'Code invalide')
            }}
          >
            Activer
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={async () => {
            const r = await call('setup')
            if (r.ok) {
              setQr(r.data.qr)
              setSecret(r.data.secret)
            } else setMsg(r.data.error || 'Erreur')
          }}
        >
          Configurer la double authentification
        </button>
      )}
      {msg && <p role="status">{msg}</p>}
    </div>
  )
}

function ResetButton({ id }: { id?: string | number }) {
  const [done, setDone] = useState(false)
  if (done) return <span> — 2FA réinitialisée.</span>
  return (
    <button
      type="button"
      style={{ marginLeft: 8 }}
      onClick={async () => {
        if (!confirm('Réinitialiser la 2FA de ce compte ?')) return
        const r = await fetch('/api/site/2fa/reset', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: id }),
        })
        setDone(r.ok)
      }}
    >
      Réinitialiser (admin)
    </button>
  )
}
