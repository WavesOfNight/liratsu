import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { ComingSoon } from '@/components/ComingSoon'
import { getSection, getSiteData } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const { payload } = await getSiteData()
  const bio = await payload.findGlobal({ slug: 'biography-page', depth: 0 })
  return { title: bio.seo?.title || bio.title || 'Biographie', description: bio.seo?.description || bio.intro || undefined, alternates: { canonical: '/biographie' } }
}

export default async function BiographyPage() {
  const section = await getSection('biography')
  if (section.status === 'off') notFound()
  if (section.status === 'soon') return <ComingSoon title="Biographie" section="biography" text={section.teaserText} notifyForm={section.notifyForm} />
  const { payload, site } = await getSiteData()
  const bio = await payload.findGlobal({ slug: 'biography-page', depth: 1 })
  return (
    <div className="container">
      <header className="page-head">
        <h1>{bio.title || 'Biographie'}</h1>
        {bio.intro && <p>{bio.intro}</p>}
      </header>
      <BlockRenderer blocks={bio.layout} site={site} />
    </div>
  )
}
