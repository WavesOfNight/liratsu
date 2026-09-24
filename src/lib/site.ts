/** Données du site partagées par les pages (mémoïsées par requête avec React cache). */
import { cache } from 'react'
import type { Media, SiteSetting } from '@/payload-types'
import type { SectionKey } from '@/globals/SiteSettings'
import { cached } from './cache'
import { getPayloadClient } from './payload'
import { getIntegrations } from './settings'

export const getSiteData = cache(async () => {
  const payload = await getPayloadClient()
  const [site, theme, eggs, shop, integrations] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', depth: 1 }),
    payload.findGlobal({ slug: 'theme', depth: 0 }),
    payload.findGlobal({ slug: 'easter-eggs', depth: 0 }),
    payload.findGlobal({ slug: 'shop-settings', depth: 0 }),
    getIntegrations(),
  ])
  return { payload, site, theme, eggs, shop, integrations }
})

export type SectionState = { status: 'on' | 'off' | 'soon'; label: string; teaserText?: string | null; notifyForm: boolean; showInMenu: boolean }

export function sectionState(site: SiteSetting, key: SectionKey): SectionState {
  const s = site[key] as { status?: 'on' | 'off' | 'soon'; menuLabel?: string | null; teaserText?: string | null; notifyForm?: boolean | null; showInMenu?: boolean | null } | undefined
  return {
    status: s?.status ?? 'on',
    label: s?.menuLabel || key,
    teaserText: s?.teaserText,
    notifyForm: s?.notifyForm !== false,
    showInMenu: s?.showInMenu !== false,
  }
}

export async function getSection(key: SectionKey): Promise<SectionState> {
  const { site } = await getSiteData()
  return sectionState(site, key)
}

/**
 * État du mode maintenance, pour le proxy (voir src/proxy.ts). Volontairement séparé de
 * getSiteData() (mémoïsé par React, donc lié au cycle de rendu) : le proxy tourne en dehors
 * de ce cycle et a besoin d'un cache à durée de vie propre, léger et rafraîchi périodiquement.
 */
export async function getMaintenanceState(): Promise<{ enabled: boolean; message: string }> {
  return cached('maintenance-state', 15_000, async () => {
    const payload = await getPayloadClient()
    const site = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    return {
      enabled: Boolean(site.maintenanceMode),
      message: site.maintenanceMessage || 'Le site est en maintenance ✦ Repasse un peu plus tard !',
    }
  })
}

export const SECTION_PATHS: Record<SectionKey, string> = {
  home: '/',
  biography: '/biographie',
  community: '/communaute',
  shop: '/boutique',
  arcade: '/arcade',
  links: '/liens',
}

type UploadDoc = { url?: string | null; sizes?: Record<string, { url?: string | null } | null | undefined> }

/** Accepte un document de n'importe quelle collection upload (media, game-assets…). */
export function mediaUrl(m: number | Media | UploadDoc | null | undefined, size?: string): string | null {
  if (!m || typeof m !== 'object') return null
  const doc = m as UploadDoc
  const url = (size && doc.sizes?.[size]?.url) || doc.url
  // Payload renvoie des URL absolues (serverURL) : on les rend relatives pour next/image.
  return url ? url.replace(/^https?:\/\/[^/]+(?=\/api\/[\w-]+\/file\/)/, '') : null
}

export function absoluteUrl(site: SiteSetting, path = '/'): string {
  const base = (site.siteUrl || process.env.NEXT_PUBLIC_SERVER_URL || 'https://liratsu.fr').replace(/\/$/, '')
  return `${base}${path}`
}
