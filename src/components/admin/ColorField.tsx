'use client'
/** Champ couleur avec pastille et sélecteur natif, pour la palette du thème. */
import React from 'react'
import { FieldLabel, useField } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

export const ColorField: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue } = useField<string>({ path })
  const label = typeof field.label === 'string' ? field.label : field.name
  return (
    <div className="field-type" style={{ flex: '1 1 25%', minWidth: 160 }}>
      <FieldLabel label={label} path={path} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="color" value={value || '#000000'} onChange={(e) => setValue(e.target.value.toUpperCase())} aria-label={label} />
        <input type="text" value={value || ''} onChange={(e) => setValue(e.target.value)} style={{ width: 110, fontFamily: 'monospace' }} />
      </div>
    </div>
  )
}
