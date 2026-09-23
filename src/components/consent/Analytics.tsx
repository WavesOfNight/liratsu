'use client'
/** Charge l'outil de statistiques auto-hébergé (Umami/Plausible) uniquement après consentement. */
import { useEffect } from 'react'
import { useConsent } from './CookieConsent'

export function Analytics({ provider, scriptUrl, siteId }: { provider: 'none' | 'umami' | 'plausible'; scriptUrl: string; siteId: string }) {
  const { consent } = useConsent()
  useEffect(() => {
    if (!consent?.analytics || provider === 'none' || !scriptUrl || !/^https:\/\//.test(scriptUrl)) return
    if (document.querySelector('script[data-liratsu-analytics]')) return
    const s = document.createElement('script')
    s.defer = true
    s.src = scriptUrl
    s.dataset.liratsuAnalytics = '1'
    if (provider === 'umami') s.dataset.websiteId = siteId
    else s.dataset.domain = siteId
    document.head.appendChild(s)
  }, [consent, provider, scriptUrl, siteId])
  return null
}
