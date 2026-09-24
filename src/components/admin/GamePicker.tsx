'use client'
/**
 * Champ « Jeu » du planning : recherche le nom officiel et la jaquette d'un jeu via
 * l'API Twitch (mêmes identifiants que le reste de l'intégration), et remplit
 * automatiquement le champ voisin `boxArtUrl` au clic sur un résultat.
 */
import React, { useEffect, useRef, useState } from 'react'
import { FieldDescription, FieldLabel, useForm, useField } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

type Result = { id: string; name: string; boxArtUrl: string }

export const GamePicker: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue } = useField<string>({ path })
  const { dispatchFields } = useForm()
  const label = typeof field.label === 'string' ? field.label : field.name
  const placeholder = (typeof field.admin?.placeholder === 'string' && field.admin.placeholder) || 'Ex. The Binding of Isaac, Just Chatting…'
  const description = typeof field.admin?.description === 'string' ? field.admin.description : undefined
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const boxArtPath = path.replace(/\.game$/, '.boxArtUrl')

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const search = (q: string) => {
    if (timer.current) clearTimeout(timer.current)
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    timer.current = setTimeout(async () => {
      setLoading(true)
      const r = await fetch(`/api/site/admin/games/search?q=${encodeURIComponent(q)}`, { credentials: 'include' }).catch(() => null)
      setLoading(false)
      if (r?.ok) {
        setResults(await r.json())
        setOpen(true)
      }
    }, 350)
  }

  const pick = (g: Result) => {
    setValue(g.name)
    dispatchFields({ type: 'UPDATE', path: boxArtPath, value: g.boxArtUrl })
    setOpen(false)
  }

  return (
    <div className="field-type text" style={{ position: 'relative' }}>
      <FieldLabel label={label} path={path} />
      <input
        type="text"
        value={value || ''}
        onChange={(e) => {
          setValue(e.target.value)
          search(e.target.value)
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {description && <FieldDescription path={path} description={description} />}
      {loading && <span style={{ position: 'absolute', right: 8, top: 34, fontSize: 12, opacity: 0.7 }}>…</span>}
      {open && results.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            zIndex: 20,
            top: '100%',
            left: 0,
            right: 0,
            margin: 0,
            padding: 4,
            listStyle: 'none',
            background: 'var(--theme-elevation-0)',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 8,
            boxShadow: '0 8px 20px rgba(0,0,0,.2)',
            maxHeight: 260,
            overflowY: 'auto',
          }}
        >
          {results.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => pick(g)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: 6, background: 'none', border: 0, cursor: 'pointer', textAlign: 'left' }}
              >
                { }
                <img src={g.boxArtUrl} alt="" width={28} height={37} style={{ borderRadius: 3, objectFit: 'cover' }} />
                <span>{g.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
