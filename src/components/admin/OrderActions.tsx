'use client'
/** Actions sur une commande : facture PDF, remboursement, relance Gelato, renvoi d'email. */
import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

export function OrderActions() {
  const { id } = useDocumentInfo()
  const [msg, setMsg] = useState('')
  const [amount, setAmount] = useState('')
  if (!id) return null

  const post = async (path: string, body: object = {}) => {
    setMsg('…')
    const r = await fetch(`/api/site/admin/orders/${id}/${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const d = await r.json().catch(() => ({}))
    setMsg(r.ok ? d.message || 'OK — recharge la page pour voir les changements.' : d.error || 'Erreur')
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', margin: '8px 0 24px', padding: 12, borderRadius: 12, background: 'var(--theme-elevation-50)' }}>
      <a className="btn btn--style-secondary btn--size-small" href={`/api/site/invoice/${id}`} target="_blank" rel="noreferrer">
        📄 Facture PDF
      </a>
      <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => post('gelato')}>
        🖨️ (Re)transmettre à Gelato
      </button>
      <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => post('resend-email')}>
        ✉️ Renvoyer l’email de statut
      </button>
      <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
        <input
          placeholder="Montant € (vide = total)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: 170 }}
          aria-label="Montant à rembourser"
        />
        <button
          type="button"
          className="btn btn--style-primary btn--size-small"
          onClick={() => {
            if (confirm('Confirmer le remboursement ? Cette action est irréversible.')) post('refund', { amount: amount ? Number(amount.replace(',', '.')) : null })
          }}
        >
          💸 Rembourser
        </button>
      </span>
      {msg && <span role="status">{msg}</span>}
    </div>
  )
}
