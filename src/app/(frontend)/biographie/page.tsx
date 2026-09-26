import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { ComingSoon } from '@/components/ComingSoon'
import { getSection, getSiteData, mediaUrl } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const { payload } = await getSiteData()
  const bio = await payload.findGlobal({ slug: 'biography-page', depth: 1 })
  const description = bio.seo?.description || bio.intro
  const img = mediaUrl(bio.seo?.image, 'wide')
  return {
    title: bio.seo?.title || bio.title || 'Biographie',
    ...(description ? { description } : {}),
    alternates: { canonical: '/biographie' },
    ...(img ? { openGraph: { images: [{ url: img }] } } : {}),
  }
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
