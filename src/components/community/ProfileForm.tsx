'use client'
/** Formulaire du profil membre (Espace communauté) : email/adresse enregistrée + liaison Discord. */
import React, { useState } from 'react'
import { COUNTRIES } from '@/lib/countries'
import { playSound } from '../prefs/sounds'
import styles from './ProfileForm.module.css'

type SavedAddress = {
  firstName?: string | null
  lastName?: string | null
  line1?: string | null
  line2?: string | null
  postalCode?: string | null
  city?: string | null
  country?: string | null
  phone?: string | null
} | null

type Member = { email: string | null; savedAddress: SavedAddress; discordUsername: string | null }
type Status = { kind: 'idle' | 'saving' | 'ok' | 'error'; msg?: string }

export function ProfileForm({ member, discordEnabled }: { member: Member; discordEnabled: boolean }) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const addr = member.savedAddress

  return (
    <div className="stack" style={{ gap: 24 }}>
      <form
        className="stack"
        style={{ gap: 12 }}
        onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          const g = (k: string) => String(fd.get(k) ?? '')
          setStatus({ kind: 'saving' })
          const r = await fetch('/api/site/community/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: g('email'),
              address: { firstName: g('firstName'), lastName: g('lastName'), line1: g('line1'), line2: g('line2'), postalCode: g('postalCode'), city: g('city'), country: g('country'), phone: g('phone') },
            }),
          }).catch(() => null)
          const d = (await r?.json().catch(() => ({}))) as { error?: string }
          if (r?.ok) {
            playSound('notify')
            setStatus({ kind: 'ok', msg: 'Profil enregistré ✦' })
          } else setStatus({ kind: 'error', msg: d?.error ?? 'Erreur' })
        }}
      >
        <div className="field">
          <label htmlFor="pf-email">Email (confirmation de commande, suivi)</label>
          <input id="pf-email" name="email" type="email" defaultValue={member.email ?? ''} autoComplete="email" />
        </div>
        <p className="muted" style={{ margin: '0 0 4px' }}>
          Adresse enregistrée : préremplit automatiquement le panier de la boutique la prochaine fois.
        </p>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label htmlFor="pf-firstName">Prénom</label>
            <input id="pf-firstName" name="firstName" defaultValue={addr?.firstName ?? ''} autoComplete="given-name" />
          </div>
          <div className="field">
            <label htmlFor="pf-lastName">Nom</label>
            <input id="pf-lastName" name="lastName" defaultValue={addr?.lastName ?? ''} autoComplete="family-name" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="pf-line1">Adresse</label>
          <input id="pf-line1" name="line1" defaultValue={addr?.line1 ?? ''} autoComplete="address-line1" />
        </div>
        <div className="field">
          <label htmlFor="pf-line2">Complément (optionnel)</label>
          <input id="pf-line2" name="line2" defaultValue={addr?.line2 ?? ''} autoComplete="address-line2" />
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label htmlFor="pf-postalCode">Code postal</label>
            <input id="pf-postalCode" name="postalCode" defaultValue={addr?.postalCode ?? ''} autoComplete="postal-code" />
          </div>
          <div className="field">
            <label htmlFor="pf-city">Ville</label>
            <input id="pf-city" name="city" defaultValue={addr?.city ?? ''} autoComplete="address-level2" />
          </div>
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label htmlFor="pf-country">Pays</label>
            <select id="pf-country" name="country" defaultValue={addr?.country || 'FR'} autoComplete="country">
              {COUNTRIES.map(([c, n]) => (
                <option key={c} value={c}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="pf-phone">Téléphone</label>
            <input id="pf-phone" name="phone" type="tel" defaultValue={addr?.phone ?? ''} autoComplete="tel" />
          </div>
        </div>
        <button className="candy-btn" disabled={status.kind === 'saving'}>
          {status.kind === 'saving' ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {status.kind === 'ok' && (
          <p className="form-msg" role="status">
            {status.msg}
          </p>
        )}
        {status.kind === 'error' && (
          <p className="form-msg form-msg--error" role="alert">
            {status.msg}
          </p>
        )}
      </form>

      {discordEnabled && (
        <div className={styles.discordBox}>
          <p className={styles.discordStatus}>{member.discordUsername ? `✅ Discord : ${member.discordUsername}` : '⚠️ Compte Discord non lié'}</p>
          {member.discordUsername ? (
            <form action="/api/site/community/discord/unlink" method="post">
              <button className="candy-btn candy-btn--ghost candy-btn--small">Délier</button>
            </form>
          ) : (
            // eslint-disable-next-line @next/next/no-html-link-for-pages -- route API (redirection OAuth), pas une page
            <a className="candy-btn candy-btn--small" href="/api/site/community/discord/link">
              🔗 Lier mon compte Discord
            </a>
          )}
        </div>
      )}
    </div>
  )
}
