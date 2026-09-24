/**
 * Rendu des blocs réordonnables (Accueil, Biographie) configurés dans l'admin.
 * Composant serveur : les données externes (Twitch, YouTube) sont chargées ici, avec cache.
 */
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import type { BiographyPage, HomePage, Media, SiteSetting } from '@/payload-types'
import { getClips, getLiveStatus, getSchedule } from '@/lib/twitch'
import { getLatestVideos } from '@/lib/youtube'
import { absoluteUrl, mediaUrl } from '@/lib/site'
import { displayTitle, formatScheduleDate, getUpcomingScheduleItems } from '@/lib/schedule'
import { AeroWindow } from '../AeroWindow'
import { LogoAero } from '../LogoAero'
import { RichText } from '../RichText'
import { SocialIcon, type SocialName } from '../SocialIcon'
import { LiveStatus } from './LiveStatus'
import { YouTubeList } from './YouTubeList'
import styles from './blocks.module.css'

type Block = NonNullable<HomePage['layout']>[number] | NonNullable<BiographyPage['layout']>[number]

const KIND_ICON: Record<string, string> = { game: '🎮', art: '🎨', music: '🎵', chat: '💬' }
const TIMELINE_ICON: Record<string, string> = { star: '⭐', bubble: '🫧', heart: '💖', pencil: '✏️', note: '🎵', gamepad: '🎮', fish: '🐟' }

export async function BlockRenderer({ blocks, site, h1 = false }: { blocks: Block[] | null | undefined; site: SiteSetting; h1?: boolean }) {
  if (!blocks?.length) return null
  const rendered = await Promise.all(blocks.map((b, i) => renderBlock(b, site, h1 && i === 0)))
  return (
    <div className="stack">
      {rendered.map((node, i) => (
        <React.Fragment key={blocks[i].id ?? i}>{node}</React.Fragment>
      ))}
    </div>
  )
}

async function renderBlock(block: Block, site: SiteSetting, isFirst: boolean): Promise<React.ReactNode> {
  switch (block.blockType) {
    case 'hero': {
      const avatar = mediaUrl(site.avatar as Media | null, 'card') ?? '/img/liratsu-avatar.png'
      const live = await getLiveStatus().catch(() => null)
      return (
        <section className={styles.hero} aria-label="Présentation">
          {block.showAvatar !== false && (
            <div className={styles.avatarWrap}>
              <div className={styles.avatarHalo} aria-hidden="true" />
              <Image src={avatar} alt="Portrait dessiné de Liratsu avec son casque" width={380} height={380} className={styles.avatar} priority />
              <div className={styles.avatarBubble} aria-hidden="true" />
            </div>
          )}
          <LogoAero size="xl" as={isFirst ? 'h1' : 'p'} text={site.siteName} />
          <p className={styles.tagline}>{block.tagline || site.tagline}</p>
          {block.intro && <p className={styles.intro}>{block.intro}</p>}
          <div className={styles.heroActions}>
            {live?.isLive && <span className="live-badge">EN LIVE</span>}
            <a className="candy-btn" href={block.ctaUrl || site.twitch || '#'} target="_blank" rel="noopener noreferrer">
              ▶ {block.ctaLabel || 'Regarder le live'}
            </a>
          </div>
        </section>
      )
    }
    case 'liveStatus': {
      const live = await getLiveStatus().catch(() => ({ configured: false, channel: 'liratsu', isLive: false }))
      const host = new URL(absoluteUrl(site)).hostname
      return (
        <AeroWindow title={block.windowTitle || 'Live Twitch'} icon="live">
          <LiveStatus initial={live} showPlayer={block.showPlayer !== false} offlineText={block.offlineText || 'Pas de live pour le moment.'} parentHost={host} />
        </AeroWindow>
      )
    }
    case 'schedule': {
      const twitch = block.source === 'manual' ? null : await getSchedule().catch(() => null)
      const manual = twitch?.length ? [] : await getUpcomingScheduleItems().catch(() => [])
      return (
        <AeroWindow title={block.windowTitle || 'Planning des streams'} icon="star">
          {twitch?.length ? (
            <ul className={styles.scheduleGrid}>
              {twitch.map((s) => {
                const d = new Date(s.start)
                return (
                  <ScheduleCard
                    key={s.start}
                    boxArtUrl={s.boxArtUrl}
                    icon="🎮"
                    cancelled={s.canceled}
                    day={d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Europe/Paris' })}
                    time={d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}
                    title={s.category ? `${s.title} · ${s.category}` : s.title}
                  />
                )
              })}
            </ul>
          ) : manual.length ? (
            <ul className={styles.scheduleGrid}>
              {manual.map((s) => (
                <ScheduleCard key={s.id ?? `${s.date}${s.time}`} boxArtUrl={s.boxArtUrl} icon={KIND_ICON[s.kind ?? 'game']} day={formatScheduleDate(s.date)} time={s.time} title={displayTitle(s)} />
              ))}
            </ul>
          ) : (
            <p className="muted">Le planning arrive bientôt… suis la chaîne pour être prévenu·e !</p>
          )}
          <p style={{ textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
            <Link href="/planning-precedent" className="candy-btn candy-btn--ghost candy-btn--small">
              📼 Voir les anciens plannings
            </Link>
          </p>
        </AeroWindow>
      )
    }
    case 'clips': {
      const clips = await getClips(block.count ?? 6).catch(() => [])
      if (!clips.length) return null
      return (
        <AeroWindow title={block.windowTitle || 'Derniers clips'} icon="live">
          <ul className={styles.mediaGrid}>
            {clips.map((c) => (
              <li key={c.id}>
                <a className={styles.mediaCard} href={c.url} target="_blank" rel="noopener noreferrer">
                  <Image src={c.thumbnail} alt="" width={480} height={272} sizes="(max-width: 600px) 100vw, 260px" />
                  <span className={styles.mediaTitle}>{c.title}</span>
                  <span className={styles.mediaMeta}>
                    {c.views.toLocaleString('fr-FR')} vues · {Math.round(c.duration)} s
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </AeroWindow>
      )
    }
    case 'youtube': {
      const videos = await getLatestVideos(block.count ?? 4).catch(() => [])
      if (!videos.length) return null
      return (
        <AeroWindow title={block.windowTitle || 'Dernières vidéos YouTube'} icon="note">
          <YouTubeList videos={videos} />
        </AeroWindow>
      )
    }
    case 'socialPosts': {
      if (!block.posts?.length) return null
      return (
        <AeroWindow title={block.windowTitle || 'Sur Instagram & TikTok'} icon="heart">
          <ul className={styles.mediaGrid}>
            {block.posts.map((p) => {
              const thumb = mediaUrl(p.thumbnail as Media, 'thumb')
              return (
                <li key={p.id ?? p.url}>
                  <a className={`${styles.mediaCard} ${styles.square}`} href={p.url} target="_blank" rel="noopener noreferrer">
                    {thumb && <Image src={thumb} alt={(p.thumbnail as Media)?.alt ?? ''} width={400} height={400} sizes="(max-width: 600px) 100vw, 220px" />}
                    <span className={styles.mediaMeta}>{p.network === 'tiktok' ? 'TikTok' : 'Instagram'}</span>
                    {p.caption && <span className={styles.mediaTitle}>{p.caption}</span>}
                  </a>
                </li>
              )
            })}
          </ul>
        </AeroWindow>
      )
    }
    case 'socialGrid': {
      const items = (['twitch', 'youtube', 'instagram', 'tiktok', 'discord'] as SocialName[]).filter((n) => site[n])
      const labels: Record<SocialName, string> = { twitch: 'Twitch', youtube: 'YouTube', instagram: 'Instagram', tiktok: 'TikTok', discord: 'Discord' }
      return (
        <AeroWindow title={block.windowTitle || 'Mes réseaux'} icon="bubble">
          <ul className={`${styles.desktop} checker`}>
            {items.map((n) => (
              <li key={n}>
                <a className={styles.desktopIcon} href={site[n] as string} target="_blank" rel="noopener noreferrer">
                  <SocialIcon name={n} size={52} />
                  <span>{labels[n]}</span>
                </a>
              </li>
            ))}
          </ul>
        </AeroWindow>
      )
    }
    case 'communityGoal': {
      const pct = Math.max(0, Math.min(100, block.target ? (block.current / block.target) * 100 : 0))
      return (
        <AeroWindow title={block.windowTitle || 'Objectif communautaire'} icon="heart">
          <div className={styles.goalHead}>
            <span>{block.label}</span>
            <span className={styles.goalValue}>
              {block.current.toLocaleString('fr-FR')} / {block.target.toLocaleString('fr-FR')}
            </span>
          </div>
          <div
            className="pixel-bar"
            style={{ '--pct': `${pct}%` } as React.CSSProperties}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={block.target}
            aria-valuenow={block.current}
            aria-label={block.label}
          >
            <div className="pixel-bar__track">
              <div className="pixel-bar__fill" />
            </div>
          </div>
          {block.reward && <p style={{ marginBottom: 0 }}>🎁 {block.reward}</p>}
        </AeroWindow>
      )
    }
    case 'richText':
      return block.plain ? (
        <RichText data={block.content} />
      ) : (
        <AeroWindow title={block.windowTitle || 'Note.txt'} icon="pencil">
          <RichText data={block.content} />
        </AeroWindow>
      )
    case 'image': {
      const img = block.image as Media
      const src = mediaUrl(img, block.style === 'full' ? 'wide' : 'card')
      if (!src) return null
      const el = <Image src={src} alt={img.alt} width={img.width ?? 900} height={img.height ?? 600} sizes="(max-width: 900px) 100vw, 900px" style={{ borderRadius: 12 }} />
      if (block.style === 'window')
        return (
          <AeroWindow title={block.caption || img.alt} icon="heart">
            {el}
          </AeroWindow>
        )
      if (block.style === 'full') return el
      return (
        <div style={{ textAlign: 'center' }}>
          <figure className={styles.polaroid}>
            {el}
            {block.caption && <figcaption>{block.caption}</figcaption>}
          </figure>
        </div>
      )
    }
    case 'gallery':
      return (
        <AeroWindow title={block.windowTitle || 'Galerie'} icon="heart">
          <ul className={styles.gallery}>
            {block.images?.map((it) => {
              const m = it.image as Media
              const src = mediaUrl(m, 'thumb')
              return src ? (
                <li key={it.id ?? src}>
                  <a href={mediaUrl(m) ?? src} target="_blank" rel="noopener noreferrer">
                    <Image src={src} alt={m.alt} width={400} height={400} sizes="(max-width: 600px) 50vw, 200px" />
                  </a>
                  {it.caption && <p className="muted" style={{ margin: '4px 0 0', fontSize: '.85rem' }}>{it.caption}</p>}
                </li>
              ) : null
            })}
          </ul>
        </AeroWindow>
      )
    case 'timeline':
      return (
        <AeroWindow title={block.windowTitle || 'Mon parcours'} icon="star">
          <ol className={styles.timeline}>
            {block.events?.map((e) => (
              <li key={e.id ?? e.title}>
                <span className={styles.timelineDot} aria-hidden="true">
                  {TIMELINE_ICON[e.icon ?? 'star']}
                </span>
                <div className={styles.timelineDate}>{e.date}</div>
                <strong>{e.title}</strong>
                {e.text && <p style={{ margin: '4px 0 0' }}>{e.text}</p>}
              </li>
            ))}
          </ol>
        </AeroWindow>
      )
    case 'profileCard': {
      const avatar = mediaUrl(block.avatar as Media | null, 'thumb') ?? mediaUrl(site.avatar as Media | null, 'thumb') ?? '/img/liratsu-avatar.png'
      const presence = { online: ['En ligne', '#4cc94c'], busy: ['Occupée', '#e0403a'], away: ['Absente', '#f0b020'] }[block.presence ?? 'online']
      return (
        <AeroWindow title={block.windowTitle || 'Profil — Messagerie Bulle'} icon="bubble">
          <div className={styles.profile}>
            <Image src={avatar} alt="" width={96} height={96} className={styles.profileAvatar} />
            <div>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>{block.displayName}</strong>
              <div className={styles.presence} style={{ '--dot': presence[1] } as React.CSSProperties}>
                {presence[0]}
              </div>
              {block.mood && <p className={styles.mood}>♪ {block.mood}</p>}
              {!!block.facts?.length && (
                <dl className={styles.facts}>
                  {block.facts.map((f) => (
                    <React.Fragment key={f.id ?? f.label}>
                      <dt>{f.label}</dt>
                      <dd>{f.value}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </AeroWindow>
      )
    }
    default:
      return null
  }
}

/** Carte carrée façon Frutiger Aero pour une case du planning (jaquette officielle en fond). */
function ScheduleCard({ boxArtUrl, icon, day, time, title, cancelled }: { boxArtUrl?: string | null; icon: string; day: string; time: string; title: string; cancelled?: boolean }) {
  return (
    <li className={`${styles.scheduleCard} ${cancelled ? styles.scheduleCancelled : ''}`}>
      {boxArtUrl ? (
        <Image src={boxArtUrl} alt="" fill sizes="(max-width: 600px) 45vw, 220px" className={styles.scheduleArt} />
      ) : (
        <div className={styles.scheduleFallback} aria-hidden="true">
          <span>{icon}</span>
        </div>
      )}
      <div className={styles.scheduleOverlay}>
        <span className={styles.scheduleDay}>{day}</span>
        <span className={styles.scheduleTime}>{time}</span>
        <span className={styles.scheduleTitle}>
          {title}
          {cancelled && ' · annulé'}
        </span>
      </div>
    </li>
  )
}
