import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { ComingSoon } from '@/components/ComingSoon'
import { JsonLd } from '@/components/JsonLd'
import { absoluteUrl, getSection, getSiteData, mediaUrl } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const { payload } = await getSiteData()
  const home = await payload.findGlobal({ slug: 'home-page', depth: 1 })
  const img = mediaUrl(home.seo?.image, 'wide')
  return {
    ...(home.seo?.title ? { title: { absolute: home.seo.title } } : {}),
    ...(home.seo?.description ? { description: home.seo.description } : {}),
    ...(img ? { openGraph: { images: [{ url: img }] } } : {}),
  }
}

export default async function HomePage() {
  const section = await getSection('home')
  if (section.status === 'off') notFound()
  const { payload, site } = await getSiteData()
  if (section.status === 'soon') return <ComingSoon title={site.siteName} section="home" text={section.teaserText} notifyForm={section.notifyForm} />
  const home = await payload.findGlobal({ slug: 'home-page', depth: 1 })
  const sameAs = [site.twitch, site.youtube, site.instagram, site.tiktok, site.discord].filter(Boolean)

  return (
    <div className="container">
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: site.siteName,
            description: site.metaDescription,
            url: absoluteUrl(site),
            image: mediaUrl(site.avatar) ? absoluteUrl(site, mediaUrl(site.avatar)!) : absoluteUrl(site, '/img/liratsu-avatar.png'),
            sameAs,
            jobTitle: 'Streameuse',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: site.siteName,
            url: absoluteUrl(site),
            publisher: { '@type': 'Organization', name: 'Reads Records', url: 'https://reads-records.com/' },
          },
        ]}
      />
      <BlockRenderer blocks={home.layout} site={site} h1 />
    </div>
  )
}
