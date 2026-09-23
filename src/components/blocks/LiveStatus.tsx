'use client'
/**
 * Statut live Twitch en temps réel (rafraîchi toutes les 60 s via /api/site/live, lui-même
 * mis en cache 60 s côté serveur). Player intégré derrière le consentement cookies.
 */
import React, { useEffect, useState } from 'react'
import type { LiveStatus as Live } from '@/lib/twitch'
import { EmbedGate } from '../consent/EmbedGate'
import { playSound } from '../prefs/sounds'
import styles from './blocks.module.css'

export function LiveStatus({ initial, showPlayer, offlineText, parentHost }: { initial: Live; showPlayer: boolean; offlineText: string; parentHost: string }) {
  const [live, setLive] = useState(initial)

  useEffect(() => {
    let prev = initial.isLive
    const t = window.setInterval(async () => {
      if (document.hidden) return
      const r = await fetch('/api/site/live').catch(() => null)
      if (!r?.ok) return
      const d = (await r.json()) as Live
      if (d.isLive && !prev) playSound('notify')
      prev = d.isLive
      setLive(d)
    }, 60_000)
    return () => window.clearInterval(t)
  }, [initial.isLive])

  const channelUrl = `https://www.twitch.tv/${live.channel}`
  if (!live.isLive) {
    return (
      <div className={styles.offline}>
        <span className={styles.sleep} aria-hidden="true">
          💤
        </span>
        <p>{offlineText}</p>
        <a className="candy-btn candy-btn--ghost" href={channelUrl} target="_blank" rel="noopener noreferrer">
          Suivre sur Twitch
        </a>
      </div>
    )
  }
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className={styles.liveHead}>
        <span className="live-badge">EN LIVE</span>
        <strong className={styles.liveTitle}>{live.title}</strong>
      </div>
      <p className="muted" style={{ margin: 0 }}>
        {live.game && <>🎮 {live.game} · </>}👀 {live.viewers?.toLocaleString('fr-FR')} viewers
      </p>
      {showPlayer && (
        <EmbedGate id="twitch-player" provider="Twitch" label="Cliquer pour charger le live" thumbnail={live.thumbnail ? `/_next/image?url=${encodeURIComponent(live.thumbnail)}&w=640&q=70` : null}>
          <iframe
            src={`https://player.twitch.tv/?channel=${encodeURIComponent(live.channel)}&parent=${encodeURIComponent(parentHost)}&muted=true`}
            title={`Live Twitch de ${live.channel}`}
            allowFullScreen
            allow="autoplay; fullscreen"
          />
        </EmbedGate>
      )}
      <a className="candy-btn" href={channelUrl} target="_blank" rel="noopener noreferrer">
        Regarder sur Twitch
      </a>
    </div>
  )
}
