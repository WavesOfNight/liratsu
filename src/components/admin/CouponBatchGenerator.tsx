'use client'
/** Génération de codes promo uniques en lot (ex. giveaway en live), au-dessus de la liste des bons. */
import React, { useState } from 'react'

export function CouponBatchGenerator() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ count: 20, prefix: 'LIVE-', type: 'percent', value: 10, batch: '', endsAt: '' })
  const [result, setResult] = useState<string[] | null>(null)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value })

  const submit = async () => {
    setError('')
    const r = await fetch('/api/site/admin/coupons/batch', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await r.json()
    if (!r.ok) setError(d.error || 'Erreur')
    else setResult(d.codes)
  }

  return (
    <div style={{ margin: '0 0 24px', padding: 16, borderRadius: 12, background: 'var(--theme-elevation-50)' }}>
      <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => setOpen(!open)}>
        🎁 Générer des codes uniques en lot
      </button>
      {open && (
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', marginTop: 12 }}>
          <label>
            Nombre
            <input type="number" min={1} max={500} value={form.count} onChange={set('count')} />
          </label>
          <label>
            Préfixe
            <input value={form.prefix} onChange={set('prefix')} />
          </label>
          <label>
            Type
            <select value={form.type} onChange={set('type')}>
              <option value="percent">%</option>
              <option value="fixed">€</option>
              <option value="freeShipping">Livraison offerte</option>
            </select>
          </label>
          <label>
            Valeur
            <input type="number" value={form.value} onChange={set('value')} />
          </label>
          <label>
            Nom du lot
            <input value={form.batch} onChange={set('batch')} placeholder="giveaway-octobre" />
          </label>
          <label>
            Fin de validité
            <input type="date" value={form.endsAt} onChange={set('endsAt')} />
          </label>
          <button type="button" className="btn btn--style-primary btn--size-small" onClick={submit}>
            Générer
          </button>
        </div>
      )}
      {error && <p style={{ color: 'var(--theme-error-500)' }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 12 }}>
          <p>{result.length} codes créés (usage unique chacun) :</p>
          <textarea readOnly rows={6} style={{ width: '100%', fontFamily: 'monospace' }} value={result.join('\n')} />
        </div>
      )}
    </div>
  )
}
