import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'
import { AeroWindow } from '@/components/AeroWindow'
import { RichText } from '@/components/RichText'
import { getSiteData } from '@/lib/site'

type Props = { params: Promise<{ slug: string }> }

async function load(slug: string) {
  const { payload } = await getSiteData()
  const r = await payload.find({ collection: 'legal-pages', where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: false, overrideAccess: false })
  return r.docs[0] ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await load(slug)
  return page ? { title: page.title, alternates: { canonical: `/legal/${slug}` } } : {}
}

export default async function LegalPage({ params }: Props) {
  const { slug } = await params
  const page = await load(slug)
  if (!page) notFound()
  const { payload, site } = await getSiteData()
  const identity = await payload.findGlobal({ slug: 'legal-identity', depth: 0 })
  const vars = { ...identity, site: { nom: site.siteName, url: site.siteUrl } }
  const e = identity.editeur ?? {}
  const h = identity.hebergeur ?? {}

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <header className="page-head">
        <h1>{page.title}</h1>
        {page.lastUpdated && <p>Dernière mise à jour : {new Date(page.lastUpdated).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
      </header>
      <div className="stack">
        {page.showIdentity && (
          <AeroWindow title="Identification" icon="star">
            <div className="grid-2">
              <div>
                <h2 style={{ fontSize: '1.2rem' }}>Éditeur du site</h2>
                <p style={{ whiteSpace: 'pre-line', margin: 0 }}>
                  {[
                    `${e.nom ?? '[à renseigner]'}${e.forme ? `, ${e.forme}` : ''}${e.capital ? ` au capital de ${e.capital}` : ''}`,
                    e.siege,
                    e.rcs && `RCS : ${e.rcs}`,
                    e.siren && `SIREN/SIRET : ${e.siren}`,
                    e.tva && `TVA intracommunautaire : ${e.tva}`,
                    e.directeur && `Directeur·rice de la publication : ${e.directeur}`,
                    e.email && `Contact : ${e.email}`,
                    e.telephone && `Téléphone : ${e.telephone}`,
                  ]
                    .filter(Boolean)
                    .join('\n')}
                </p>
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem' }}>Hébergeur</h2>
                <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{[h.nom, h.adresse, h.telephone, h.site].filter(Boolean).join('\n')}</p>
              </div>
            </div>
          </AeroWindow>
        )}
        <AeroWindow title={`${page.title}.txt`} icon="pencil" as="article">
          <RichText data={page.content} vars={vars} />
        </AeroWindow>
        <p className="muted" style={{ textAlign: 'center' }}>
          Pages juridiques gérées par Reads Records · {identity.developpeur}
        </p>
      </div>
    </div>
  )
}
