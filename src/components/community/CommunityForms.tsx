'use client'
/** Formulaires interactifs de l'Espace communauté : livre d'or, fanart, sondage, code surprise. */
import Link from 'next/link'
import React, { useState } from 'react'
import { playSound } from '../prefs/sounds'

type Status = { kind: 'idle' | 'sending' | 'ok' | 'error'; msg?: string }

async function postJson(url: string, body: object) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null)
  const d = (await r?.json().catch(() => ({}))) as Record<string, unknown>
  return { ok: Boolean(r?.ok), data: d ?? {} }
}

function Msg({ s }: { s: Status }) {
  if (s.kind === 'ok') return <p className="form-msg" role="status">{s.msg}</p>
  if (s.kind === 'error')
    return (
      <p className="form-msg form-msg--error" role="alert">
        {s.msg}
      </p>
    )
  return null
}

export function GuestbookForm() {
  const [s, setS] = useState<Status>({ kind: 'idle' })
  return s.kind === 'ok' ? (
    <Msg s={s} />
  ) : (
    <form
      className="stack"
      style={{ gap: 12 }}
      onSubmit={async (e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        setS({ kind: 'sending' })
        const r = await postJson('/api/site/community/guestbook', {
          name: fd.get('name'),
          message: fd.get('message'),
          mood: fd.get('mood'),
          consent: fd.get('consent') === 'on',
          website: fd.get('website'),
        })
        if (r.ok) playSound('notify')
        setS(r.ok ? { kind: 'ok', msg: 'Merci ! Ton message apparaîtra après validation par la modération ✦' } : { kind: 'error', msg: String(r.data.error ?? 'Erreur') })
      }}
    >
      <div className="field">
        <label htmlFor="gb-name">Pseudo</label>
        <input id="gb-name" name="name" required maxLength={40} autoComplete="nickname" />
      </div>
      <div className="field">
        <label htmlFor="gb-msg">Ton petit mot</label>
        <textarea id="gb-msg" name="message" required maxLength={600} rows={4} />
      </div>
      <div className="field">
        <label htmlFor="gb-mood">Humeur</label>
        <select id="gb-mood" name="mood" defaultValue="star">
          <option value="star">⭐ étoilé·e</option>
          <option value="heart">💖 plein d’amour</option>
          <option value="fish">🐟 glouglou</option>
          <option value="bubble">🫧 dans les nuages</option>
          <option value="music">🎵 en musique</option>
        </select>
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999 }} />
      <label className="check">
        <input type="checkbox" name="consent" required />
        <span>
          J’accepte que mon pseudo et mon message soient publiés après modération (<Link href="/legal/cgu">CGU</Link>, <Link href="/legal/confidentialite">confidentialité</Link>).
        </span>
      </label>
      <button className="candy-btn candy-btn--pink" disabled={s.kind === 'sending'}>
        Signer le livre d’or
      </button>
      <Msg s={s} />
    </form>
  )
}

export function FanartForm() {
  const [s, setS] = useState<Status>({ kind: 'idle' })
  return s.kind === 'ok' ? (
    <Msg s={s} />
  ) : (
    <form
      className="stack"
      style={{ gap: 12 }}
      onSubmit={async (e) => {
        e.preventDefault()
        const form = e.currentTarget
        const file = (form.elements.namedItem('image') as HTMLInputElement).files?.[0]
        if (file && file.size > 8 * 1024 * 1024) return setS({ kind: 'error', msg: 'Image trop lourde (8 Mo max).' })
        setS({ kind: 'sending' })
        const r = await fetch('/api/site/community/fanart', { method: 'POST', body: new FormData(form) }).catch(() => null)
        const d = (await r?.json().catch(() => ({}))) as { error?: string }
        setS(r?.ok ? { kind: 'ok', msg: 'Fanart reçu ! Il sera affiché après validation ✦ Merci !' } : { kind: 'error', msg: d?.error ?? 'Erreur' })
      }}
    >
      <div className="grid-2" style={{ gap: 12 }}>
        <div className="field">
          <label htmlFor="fa-title">Titre</label>
          <input id="fa-title" name="title" required maxLength={80} />
        </div>
        <div className="field">
          <label htmlFor="fa-artist">Ton pseudo d’artiste</label>
          <input id="fa-artist" name="artist" required maxLength={40} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="fa-link">Lien vers ton compte (optionnel)</label>
        <input id="fa-link" name="artistLink" type="url" placeholder="https://" />
      </div>
      <div className="field">
        <label htmlFor="fa-email">Email pour te contacter / retrait (optionnel, jamais publié)</label>
        <input id="fa-email" name="contactEmail" type="email" autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="fa-img">Image (PNG, JPG, WEBP, GIF — 8 Mo max)</label>
        <input id="fa-img" name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required />
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999 }} />
      <label className="check">
        <input type="checkbox" name="license" required />
        <span>
          Je suis l’auteur·rice de ce dessin et j’accorde une licence d’affichage sur le site et en live, retirable sur simple demande (<Link href="/legal/cgu">CGU</Link>).
        </span>
      </label>
      <button className="candy-btn candy-btn--lagoon" disabled={s.kind === 'sending'}>
        {s.kind === 'sending' ? 'Envoi…' : 'Envoyer mon fanart'}
      </button>
      <Msg s={s} />
    </form>
  )
}

export function PollWidget({ id, question, options, open }: { id: number; question: string; options: { label: string; votes: number }[]; open: boolean }) {
  const [counts, setCounts] = useState(options.map((o) => o.votes))
  const [voted, setVoted] = useState(false)
  const [err, setErr] = useState('')
  const total = counts.reduce((a, b) => a + b, 0)
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
      <legend style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>{question}</legend>
      <div className="stack" style={{ gap: 8 }}>
        {options.map((o, i) => {
          const pct = total ? Math.round((counts[i] / total) * 100) : 0
          return voted || !open ? (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{o.label}</span>
                <span>{pct} %</span>
              </div>
              <div className="pixel-bar" style={{ '--pct': `${pct}%`, height: 20 } as React.CSSProperties} aria-hidden="true">
                <div className="pixel-bar__track">
                  <div className="pixel-bar__fill" />
                </div>
              </div>
            </div>
          ) : (
            <button
              key={i}
              type="button"
              className="candy-btn candy-btn--ghost"
              onClick={async () => {
                const r = await postJson('/api/site/community/vote', { poll: id, option: i })
                if (r.ok) {
                  setCounts(r.data.counts as number[])
                  playSound('pop')
                  setVoted(true)
                } else {
                  setErr(String(r.data.error ?? 'Erreur'))
                  if (r.data.error) setVoted(true)
                }
              }}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      {err && <p className="muted">{err}</p>}
      {(voted || !open) && <p className="muted" style={{ marginBottom: 0 }}>{total} vote(s){!open && ' · sondage fermé'}</p>}
    </fieldset>
  )
}

export function RedeemForm() {
  const [s, setS] = useState<Status>({ kind: 'idle' })
  return (
    <form
      className="stack"
      style={{ gap: 12 }}
      onSubmit={async (e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        setS({ kind: 'sending' })
        const r = await postJson('/api/site/community/redeem', { code: fd.get('code') })
        if (r.ok) {
          playSound('coin')
          const unlocked = (r.data.unlocked as string[]) ?? []
          setS({ kind: 'ok', msg: `${r.data.message ?? 'Débloqué !'}${unlocked.length ? ` — ${unlocked.join(', ')}` : ''}` })
          window.setTimeout(() => window.location.reload(), 1600)
        } else setS({ kind: 'error', msg: String(r.data.error ?? 'Code invalide') })
      }}
    >
      <div className="field">
        <label htmlFor="code">Code surprise</label>
        <input id="code" name="code" required maxLength={40} autoComplete="off" style={{ textTransform: 'uppercase', letterSpacing: '.1em' }} placeholder="BULLE-XXXX" />
      </div>
      <button className="candy-btn candy-btn--star" disabled={s.kind === 'sending'}>
        Débloquer ✦
      </button>
      <Msg s={s} />
    </form>
  )
}
