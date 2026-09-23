/** Données structurées schema.org (JSON-LD). Échappe « < » pour éviter toute injection. */
import { headers } from 'next/headers'
import React from 'react'

export async function JsonLd({ data }: { data: object | object[] }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined
  return <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}
