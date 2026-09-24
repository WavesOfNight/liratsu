import type { MetadataRoute } from 'next'
import { SECTION_KEYS } from '@/globals/SiteSettings'
import { absoluteUrl, getSiteData, SECTION_PATHS, sectionState } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { payload, site } = await getSiteData()
  const entries: MetadataRoute.Sitemap = SECTION_KEYS.filter((k) => sectionState(site, k).status === 'on').map((k) => ({
    url: absoluteUrl(site, SECTION_PATHS[k]),
    changeFrequency: k === 'home' ? 'daily' : 'weekly',
    priority: k === 'home' ? 1 : 0.7,
  }))
  const legal = await payload.find({ collection: 'legal-pages', where: { _status: { equals: 'published' } }, limit: 20, depth: 0 })
  legal.docs.forEach((l) => entries.push({ url: absoluteUrl(site, `/legal/${l.slug}`), lastModified: l.updatedAt, priority: 0.2 }))
  if (sectionState(site, 'shop').status === 'on') {
    const products = await payload.find({ collection: 'products', where: { _status: { equals: 'published' } }, limit: 500, depth: 0 })
    products.docs.forEach((p) => entries.push({ url: absoluteUrl(site, `/boutique/${p.slug}`), lastModified: p.updatedAt, priority: 0.6 }))
  }
  if (sectionState(site, 'arcade').status === 'on') {
    const games = await payload.find({ collection: 'games', where: { status: { equals: 'live' } }, limit: 100, depth: 0 })
    games.docs.forEach((g) => entries.push({ url: absoluteUrl(site, `/arcade/${g.slug}`), lastModified: g.updatedAt, priority: 0.5 }))
  }
  if (sectionState(site, 'home').status === 'on') entries.push({ url: absoluteUrl(site, '/planning-precedent'), priority: 0.3 })
  return entries
}
