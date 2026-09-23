/** Rendu du texte riche Payload (Lexical), avec substitution optionnelle de variables {{a.b}}. */
import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import React from 'react'

type Vars = Record<string, unknown>

function lookup(vars: Vars, path: string): string | null {
  let cur: unknown = vars
  for (const k of path.split('.')) {
    if (cur && typeof cur === 'object') cur = (cur as Record<string, unknown>)[k]
    else return null
  }
  return cur === null || cur === undefined || cur === '' ? null : String(cur)
}

/** Remplace {{editeur.nom}} etc. dans les nœuds texte ; les valeurs manquantes restent visibles « [à renseigner] ». */
export function substituteVars<T>(node: T, vars: Vars): T {
  if (Array.isArray(node)) return node.map((n) => substituteVars(n, vars)) as T
  if (node && typeof node === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(node)) {
      out[k] = k === 'text' && typeof v === 'string' ? v.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, p: string) => lookup(vars, p) ?? '[à renseigner]') : substituteVars(v, vars)
    }
    return out as T
  }
  return node
}

export function RichText({ data, vars, className = 'prose' }: { data: unknown; vars?: Vars; className?: string }) {
  if (!data || typeof data !== 'object' || !('root' in (data as object))) return null
  const content = (vars ? substituteVars(data, vars) : data) as SerializedEditorState
  return <LexicalRichText data={content} className={className} />
}
