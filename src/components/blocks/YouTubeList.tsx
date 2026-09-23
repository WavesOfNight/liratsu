'use client'
/** Vidéos YouTube : miniature (servie via notre serveur), lecture youtube-nocookie après consentement. */
import Image from 'next/image'
import React, { useState } from 'react'
import type { Video } from '@/lib/youtube'
import { EmbedGate } from '../consent/EmbedGate'
import styles from './blocks.module.css'

export function YouTubeList({ videos }: { videos: Video[] }) {
  const [playing, setPlaying] = useState<string | null>(null)
  return (
    <div className="stack" style={{ gap: 16 }}>
      {playing && (
        <EmbedGate id={`yt-${playing}`} provider="YouTube" label="Charger la vidéo YouTube">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${playing}?autoplay=1&rel=0`}
            title="Vidéo YouTube de Liratsu"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </EmbedGate>
      )}
      <ul className={styles.mediaGrid}>
        {videos.map((v) => (
          <li key={v.id}>
            <button type="button" className={styles.mediaCard} onClick={() => setPlaying(v.id)} aria-label={`Lire : ${v.title}`}>
              <Image src={v.thumbnail} alt="" width={480} height={360} sizes="(max-width: 600px) 100vw, 300px" />
              <span className={styles.mediaTitle}>{v.title}</span>
              <span className={styles.mediaMeta}>{new Date(v.published).toLocaleDateString('fr-FR')}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
