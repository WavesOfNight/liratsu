import type { Metadata, Viewport } from 'next'
import { cookies, headers } from 'next/headers'
import React from 'react'
import '@/styles/aero.css'
import { AeroGlow } from '@/components/AeroGlow'
import { BackgroundAquarium } from '@/components/BackgroundAquarium'
import { Analytics } from '@/components/consent/Analytics'
import { ConsentProvider } from '@/components/consent/CookieConsent'
import { EasterEggs } from '@/components/eggs/EasterEggs'
import { DEFAULT_EGGS, EggsProvider, type EggFlags } from '@/components/eggs/EggsContext'
import { Footer } from '@/components/layout/Footer'
import { Header, type NavItem } from '@/components/layout/Header'
import { PrefsProvider } from '@/components/prefs/PrefsProvider'
import { MEMBER_COOKIE, readMemberId } from '@/lib/community'
import { themeInitScript, type ThemeMode } from '@/lib/themeScript'
import type { SocialName } from '@/components/SocialIcon'
import { SECTION_KEYS } from '@/globals/SiteSettings'
import { DEFAULT_PALETTE } from '@/globals/Theme'
import { fredoka, quicksand } from '@/lib/fonts'
import { absoluteUrl, getSiteData, mediaUrl, SECTION_PATHS, sectionState } from '@/lib/site'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getSiteData()
  const og = mediaUrl(site.ogImage, 'wide')
  return {
    metadataBase: new URL(absoluteUrl(site)),
    title: { default: `${site.siteName} — ${site.tagline ?? ''}`.trim(), template: `%s · ${site.siteName}` },
    description: site.metaDescription ?? undefined,
    icons: { icon: [{ url: '/favicon.png', type: 'image/png' }], apple: '/favicon.png' },
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      siteName: site.siteName,
      ...(og ? { images: [{ url: og }] } : {}),
    },
    twitter: { card: 'summary_large_image' },
    alternates: { canonical: '/' },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#8fd3ff' },
    { media: '(prefers-color-scheme: dark)', color: '#041030' },
  ],
}

const safeHex = (v: string | null | undefined, fallback: string) => (v && /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback)

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const { site, theme, eggs, integrations, payload } = await getSiteData()
  const nonce = (await headers()).get('x-nonce') ?? undefined

  const jar = await cookies()
  const memberCookie = jar.get(MEMBER_COOKIE)
  const memberId = integrations.twitch.oauthEnabled ? readMemberId(memberCookie ? `${MEMBER_COOKIE}=${memberCookie.value}` : null) : null
  const member = memberId ? await payload.findByID({ collection: 'members', id: memberId, depth: 0 }).catch(() => null) : null

  const p = theme.palette ?? {}
  const vars = (Object.keys(DEFAULT_PALETTE) as (keyof typeof DEFAULT_PALETTE)[])
    .map((k) => `--c-${k}:${safeHex((p as Record<string, string | null | undefined>)[k], DEFAULT_PALETTE[k])};`)
    .join('')

  const nav: NavItem[] = SECTION_KEYS.map((k) => ({ k, s: sectionState(site, k) }))
    .filter(({ s }) => s.status !== 'off' && s.showInMenu)
    .map(({ k, s }) => ({ href: SECTION_PATHS[k], label: s.label, soon: s.status === 'soon' }))

  const socials = (['twitch', 'youtube', 'instagram', 'tiktok', 'discord'] as SocialName[])
    .map((name) => ({ name, url: site[name] as string | null | undefined }))
    .filter((s): s is { name: SocialName; url: string } => Boolean(s.url))

  const eggFlags: EggFlags = { ...DEFAULT_EGGS, ...Object.fromEntries(Object.entries(eggs).filter(([, v]) => typeof v === 'boolean' || typeof v === 'string')) } as EggFlags
  const defaultTheme = (theme.effects?.defaultMode ?? 'auto') as ThemeMode

  return (
    <html lang="fr" className={`${fredoka.variable} ${quicksand.variable}`} data-cursors={theme.effects?.customCursors ? 'on' : 'off'} suppressHydrationWarning>
      <head>
        <style nonce={nonce} dangerouslySetInnerHTML={{ __html: `:root{${vars}}` }} />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeInitScript(defaultTheme) }} />
      </head>
      <body>
        <a href="#contenu" className="skip-link">
          Aller au contenu
        </a>
        <PrefsProvider defaultTheme={defaultTheme} soundsAvailable={theme.effects?.soundsAvailable !== false}>
          <EggsProvider value={eggFlags}>
            <ConsentProvider analyticsAvailable={integrations.analytics.provider !== 'none'}>
              {integrations.testMode && (
                <div role="note" style={{ background: 'repeating-linear-gradient(45deg,#ffd35c 0 16px,#ffe89c 16px 32px)', color: '#3a2a00', textAlign: 'center', fontWeight: 700, padding: '6px 12px', fontSize: '.9rem' }}>
                  🧪 Boutique en mode test : aucun paiement réel ne sera effectué.
                </div>
              )}
              <AeroGlow />
              <BackgroundAquarium bubbles={theme.effects?.bubbles !== false} fish={theme.effects?.fish !== false} />
              <Header items={nav} siteName={site.siteName} member={member ? { displayName: member.displayName, avatarUrl: member.avatarUrl ?? null } : null} />
              <main id="contenu" tabIndex={-1}>
                {children}
              </main>
              <Footer
                socials={socials}
                footerText={site.footerText ?? ''}
                devCredit={site.devCredit || 'Codé par El Technico Lionel'}
                publisherCredit={site.publisherCredit ?? ''}
                animateCredit={eggFlags.footerCredit}
              />
              <EasterEggs />
              <Analytics {...integrations.analytics} />
            </ConsentProvider>
          </EggsProvider>
        </PrefsProvider>
      </body>
    </html>
  )
}
