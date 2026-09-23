'use client'
/**
 * File de modération interactive : aperçu des images, alertes du filtre automatique
 * surlignées, validation / refus motivé / suppression, un par un ou par lot.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styles from './moderation.module.css'

type Type = 'fanarts' | 'guestbook'
type Status = 'pending' | 'approved' | 'rejected'
type Base = {
  id: number
  status: Status
  createdAt: string
  flags: string[]
  flaggedTerms: string
  rejectionReason: string
  moderatedAt: string | null
  moderatedBy: string | null
}
type Fanart = Base & {
  title: string
  artist: string
  artistLink: string
  contactEmail: string
  thumb: string
  full: string
  width?: number
  height?: number
  filesize?: number
}
type Message = Base & { name: string; message: string; mood: string; reply: string }
type Data = { counts: Record<Type, number>; items: (Fanart | Message)[] }

const FLAG_LABELS: Record<string, string> = {
  insult: 'Insulte',
  vulgar: 'Vulgarité / mot surveillé',
  link: 'Lien',
  personal: 'Coordonnées perso',
  spam: 'Spam',
  caps: 'MAJUSCULES',
  custom: 'Mot personnalisé',
  duplicate: 'Doublon',
}
const MOOD: Record<string, string> = {
  star: '⭐',
  heart: '💖',
  fish: '🐟',
  bubble: '🫧',
  music: '🎵',
}
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : ''
const fmtSize = (n?: number) => (n ? `${(n / 1024 / 1024).toFixed(1)} Mo` : '')

/** Surligne les extraits signalés par le filtre dans le texte. */
function Highlight({ text, terms }: { text: string; terms: string }) {
  const list = terms
    .split(' · ')
    .map((t) => t.trim())
    .filter((t) => t.length > 1)
  if (!list.length) return <>{text}</>
  const re = new RegExp(
    `(${list.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi',
  )
  return (
    <>
      {text.split(re).map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className={styles.mark}>
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  )
}

function Flags({ item }: { item: Base }) {
  return item.flags.length ? (
    <div className={styles.flags}>
      {item.flags.map((f) => (
        <span
          key={f}
          className={`${styles.flag} ${f === 'insult' || f === 'personal' ? styles.flagHot : ''}`}
        >
          ⚠️ {FLAG_LABELS[f] ?? f}
        </span>
      ))}
    </div>
  ) : null
}

function Decision({ item }: { item: Base }) {
  return item.status !== 'pending' ? (
    <p className={styles.meta}>
      {item.status === 'approved' ? 'Validé' : 'Refusé'}{' '}
      {item.moderatedBy ? `par ${item.moderatedBy}` : ''} {fmtDate(item.moderatedAt)}
      {item.rejectionReason && <> — « {item.rejectionReason} »</>}
    </p>
  ) : null
}

export function ModerationQueue({ reasons }: { reasons: string[] }) {
  const [type, setType] = useState<Type>('fanarts')
  const [status, setStatus] = useState<Status>('pending')
  const [data, setData] = useState<Data | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [rejecting, setRejecting] = useState<number[] | null>(null)
  const [reason, setReason] = useState(reasons[0] ?? '')
  const [customReason, setCustomReason] = useState('')
  const [replies, setReplies] = useState<Record<number, string>>({})
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [zoom, setZoom] = useState<Fanart | null>(null)

  const load = useCallback(async () => {
    const r = await fetch(`/api/site/admin/moderation?type=${type}&status=${status}`, {
      credentials: 'include',
    })
    const d = await r.json().catch(() => null)
    if (r.ok) {
      setData(d)
      setSelected(new Set())
    } else setMsg(d?.error ?? 'Chargement impossible')
  }, [type, status])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement asynchrone depuis l'API
    void load()
  }, [load])

  const act = async (
    ids: number[],
    action: 'approve' | 'reject' | 'delete' | 'pending',
    extra: { reason?: string; reply?: string } = {},
  ) => {
    if (
      action === 'delete' &&
      !confirm(
        `Supprimer définitivement ${ids.length > 1 ? `ces ${ids.length} éléments` : 'cet élément'} ?`,
      )
    )
      return
    setBusy(true)
    setMsg('')
    const r = await fetch('/api/site/admin/moderation', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ids, action, ...extra }),
    })
    const d = await r.json().catch(() => ({}))
    setBusy(false)
    setRejecting(null)
    setCustomReason('')
    const verb = {
      approve: 'validé(s)',
      reject: 'refusé(s)',
      delete: 'supprimé(s)',
      pending: 'remis en attente',
    }[action]
    setMsg(r.ok ? `${d.done} élément(s) ${verb}.` : (d.error ?? 'Erreur'))
    void load()
  }

  const items = useMemo(() => data?.items ?? [], [data])
  const allSelected = items.length > 0 && selected.size === items.length
  const toggle = (id: number) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const flaggedFirst = useMemo(
    () => [...items].sort((a, b) => (b.flags.length ? 1 : 0) - (a.flags.length ? 1 : 0)),
    [items],
  )

  const rejectBox = (ids: number[]) => (
    <div className={styles.rejectBox}>
      <label>
        Motif du refus
        <select value={reason} onChange={(e) => setReason(e.target.value)}>
          {reasons.map((r) => (
            <option key={r}>{r}</option>
          ))}
          <option value="__custom">Autre motif…</option>
        </select>
      </label>
      {reason === '__custom' && (
        <input
          autoFocus
          placeholder="Motif (envoyé à l’artiste s’il a laissé un email)"
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
        />
      )}
      <div className={styles.row}>
        <button
          type="button"
          className={styles.btnReject}
          disabled={busy || (reason === '__custom' && !customReason.trim())}
          onClick={() =>
            act(ids, 'reject', { reason: reason === '__custom' ? customReason.trim() : reason })
          }
        >
          Confirmer le refus
        </button>
        <button type="button" className={styles.btnGhost} onClick={() => setRejecting(null)}>
          Annuler
        </button>
      </div>
    </div>
  )

  const actions = (item: Fanart | Message) =>
    rejecting?.length === 1 && rejecting[0] === item.id ? (
      rejectBox([item.id])
    ) : (
      <div className={styles.row}>
        {item.status !== 'approved' && (
          <button
            type="button"
            className={styles.btnApprove}
            disabled={busy}
            onClick={() =>
              act(
                [item.id],
                'approve',
                type === 'guestbook' && replies[item.id] !== undefined
                  ? { reply: replies[item.id] }
                  : {},
              )
            }
          >
            ✅ Valider
          </button>
        )}
        {item.status !== 'rejected' && (
          <button
            type="button"
            className={styles.btnReject}
            disabled={busy}
            onClick={() => setRejecting([item.id])}
          >
            ⛔ Refuser
          </button>
        )}
        {item.status !== 'pending' && (
          <button
            type="button"
            className={styles.btnGhost}
            disabled={busy}
            onClick={() => act([item.id], 'pending')}
          >
            ↩︎ Remettre en attente
          </button>
        )}
        <button
          type="button"
          className={styles.btnGhost}
          disabled={busy}
          onClick={() => act([item.id], 'delete')}
          title="Supprimer définitivement"
        >
          🗑️
        </button>
      </div>
    )

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label="Type de contenu">
          {(['fanarts', 'guestbook'] as Type[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={type === t}
              className={type === t ? styles.tabOn : styles.tab}
              onClick={() => setType(t)}
            >
              {t === 'fanarts' ? '🎨 Fanarts' : '📖 Livre d’or'}
              {!!data?.counts[t] && <span className={styles.badge}>{data.counts[t]}</span>}
            </button>
          ))}
        </div>
        <div className={styles.tabs} role="tablist" aria-label="Statut">
          {(['pending', 'approved', 'rejected'] as Status[]).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={status === s}
              className={status === s ? styles.tabOn : styles.tab}
              onClick={() => setStatus(s)}
            >
              {{ pending: '⏳ En attente', approved: '✅ Validés', rejected: '⛔ Refusés' }[s]}
            </button>
          ))}
        </div>
      </div>

      {items.length > 0 && status === 'pending' && (
        <div className={styles.bulk}>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() =>
                setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)))
              }
            />{' '}
            Tout sélectionner
          </label>
          {selected.size > 0 &&
            (rejecting && rejecting.length > 1 ? (
              rejectBox(rejecting)
            ) : (
              <div className={styles.row}>
                <button
                  type="button"
                  className={styles.btnApprove}
                  disabled={busy}
                  onClick={() => act([...selected], 'approve')}
                >
                  ✅ Valider la sélection ({selected.size})
                </button>
                <button
                  type="button"
                  className={styles.btnReject}
                  disabled={busy}
                  onClick={() => setRejecting([...selected])}
                >
                  ⛔ Refuser la sélection
                </button>
              </div>
            ))}
        </div>
      )}

      {msg && (
        <p role="status" className={styles.msg}>
          {msg}
        </p>
      )}
      {!data && <p>Chargement…</p>}
      {data && items.length === 0 && (
        <p className={styles.empty}>
          {status === 'pending'
            ? '🫧 Rien à modérer pour le moment. Beau travail !'
            : 'Aucun élément.'}
        </p>
      )}

      {type === 'fanarts' ? (
        <ul className={styles.grid}>
          {(flaggedFirst as Fanart[]).map((f) => (
            <li key={f.id} className={`${styles.card} ${f.flags.length ? styles.cardFlagged : ''}`}>
              {status === 'pending' && (
                <input
                  type="checkbox"
                  className={styles.select}
                  checked={selected.has(f.id)}
                  onChange={() => toggle(f.id)}
                  aria-label={`Sélectionner ${f.title}`}
                />
              )}
              <button
                type="button"
                className={styles.imageBtn}
                onClick={() => setZoom(f)}
                aria-label={`Agrandir ${f.title}`}
              >
                <img src={f.thumb} alt={`Fanart « ${f.title} » par ${f.artist}`} loading="lazy" />
              </button>
              <div className={styles.body}>
                <strong>{f.title}</strong>
                <span>
                  par {f.artist}
                  {f.artistLink && (
                    <>
                      {' · '}
                      <a href={f.artistLink} target="_blank" rel="noopener noreferrer nofollow">
                        lien
                      </a>
                    </>
                  )}
                </span>
                <span className={styles.meta}>
                  {fmtDate(f.createdAt)} · {f.width}×{f.height} · {fmtSize(f.filesize)}
                  {f.contactEmail && <> · ✉️ {f.contactEmail}</>}
                </span>
                <Flags item={f} />
                {f.flaggedTerms && (
                  <span className={styles.meta}>
                    Signalé : <mark className={styles.mark}>{f.flaggedTerms}</mark>
                  </span>
                )}
                <Decision item={f} />
                {actions(f)}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className={styles.list}>
          {(flaggedFirst as Message[]).map((m) => (
            <li
              key={m.id}
              className={`${styles.card} ${styles.cardRow} ${m.flags.length ? styles.cardFlagged : ''}`}
            >
              {status === 'pending' && (
                <input
                  type="checkbox"
                  className={styles.selectInline}
                  checked={selected.has(m.id)}
                  onChange={() => toggle(m.id)}
                  aria-label={`Sélectionner le message de ${m.name}`}
                />
              )}
              <div className={styles.body}>
                <div>
                  <span aria-hidden="true">{MOOD[m.mood] ?? '⭐'}</span> <strong>{m.name}</strong>{' '}
                  <span className={styles.meta}>{fmtDate(m.createdAt)}</span>
                </div>
                <p className={styles.message}>
                  <Highlight text={m.message} terms={m.flaggedTerms} />
                </p>
                <Flags item={m} />
                <Decision item={m} />
                {m.status !== 'rejected' && (
                  <textarea
                    className={styles.reply}
                    rows={2}
                    placeholder="Réponse de Liratsu (optionnelle, publiée sous le message)"
                    value={replies[m.id] ?? m.reply}
                    onChange={(e) => setReplies((r) => ({ ...r, [m.id]: e.target.value }))}
                  />
                )}
                {actions(m)}
              </div>
            </li>
          ))}
        </ul>
      )}

      {zoom && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={zoom.title}
          onClick={() => setZoom(null)}
        >
          <img src={zoom.full} alt={`Fanart « ${zoom.title} » par ${zoom.artist}`} />
          <p>
            « {zoom.title} » par {zoom.artist} — clic pour fermer
          </p>
        </div>
      )}
    </div>
  )
}
