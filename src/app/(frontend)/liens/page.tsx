import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'
import { ComingSoon } from '@/components/ComingSoon'
import { LogoAero } from '@/components/LogoAero'
import { SocialIcon, type SocialName } from '@/components/SocialIcon'
import { getSection, getSiteData, mediaUrl } from '@/lib/site'
import styles from './links.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const { payload } = await getSiteData()
  const p = await payload.findGlobal({ slug: 'links-page', depth: 0 })
  return { title: p.seo?.title || p.title || 'Liens', description: p.seo?.description || p.subtitle || undefined, alternates: { canonical: '/liens' } }
}

const EMOJI: Record<string, string> = { shop: '🛍️', star: '⭐', bubble: '🫧', heart: '💖', gamepad: '🎮', mail: '💌' }
const SOCIALS = ['twitch', 'youtube', 'instagram', 'tiktok', 'discord']

export default async function LinksPage() {
  const section = await getSection('links')
  if (section.status === 'off') notFound()
  if (section.status === 'soon') return <ComingSoon title="Liens" section="links" text={section.teaserText} notifyForm={section.notifyForm} />
  const { payload, site } = await getSiteData()
  const page = await payload.findGlobal({ slug: 'links-page', depth: 0 })
  const avatar = mediaUrl(site.avatar, 'thumb') ?? '/img/liratsu-avatar.png'

  return (
    <div className={`container ${styles.wrap}`}>
      <img src={avatar} alt="Avatar de Liratsu" width={120} height={120} className={styles.avatar} />
      <LogoAero size="lg" as="h1" text={site.siteName} />
      <p className={styles.subtitle}>{page.subtitle}</p>
      <ul className={styles.list}>
        {page.links?.map((l) => (
          <li key={l.id ?? l.url}>
            <a
              href={l.url}
              className={`candy-btn ${l.color && l.color !== 'aero' && l.color !== 'deep' ? `candy-btn--${l.color}` : ''} ${styles.link} ${l.highlight ? styles.highlight : ''}`}
              target={l.url.startsWith('/') ? undefined : '_blank'}
              rel={l.url.startsWith('/') ? undefined : 'noopener noreferrer'}
            >
              <span className={styles.icon} aria-hidden="true">
                {SOCIALS.includes(l.icon ?? '') ? <SocialIcon name={l.icon as SocialName} size={30} /> : EMOJI[l.icon ?? 'star']}
              </span>
              <span className={styles.label}>{l.label}</span>
              {l.highlight && <span className="sticker">nouveau !</span>}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
