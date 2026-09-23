import type { MetadataRoute } from 'next'
import { absoluteUrl, getSiteData } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { site } = await getSiteData()
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/panier', '/commande'] }],
    sitemap: absoluteUrl(site, '/sitemap.xml'),
  }
}
