import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { AeroWindow } from '@/components/AeroWindow'
import { KIND_ICON } from '@/lib/schedule'
import { getSection, getSiteData } from '@/lib/site'
import styles from './planning.module.css'

export const metadata: Metadata = {
  title: 'Anciens plannings',
  description: 'Retrouve les streams passés de Liratsu et leurs rediffs (VOD) sur la chaîne YouTube.',
  alternates: { canonical: '/planning-precedent' },
}

export default async function PastSchedulePage() {
  if ((await getSection('home')).status !== 'on') notFound()
  const { payload } = await getSiteData()
  const archive = await payload.find({ collection: 'schedule-archive', sort: '-date', limit: 60, depth: 0 })

  return (
    <div className="container">
      <header className="page-head">
        <h1>Anciens plannings</h1>
        <p>Les streams passés, avec leur rediff quand elle est en ligne ✦</p>
      </header>
      <AeroWindow title="Archive.txt" icon="star">
        {archive.docs.length ? (
          <ul className={styles.grid}>
            {archive.docs.map((it) => {
              const d = new Date(it.date)
              return (
                <li key={it.id} className={styles.card}>
                  {it.boxArtUrl ? (
                     
                    <img src={it.boxArtUrl} alt="" className={styles.art} />
                  ) : (
                    <div className={styles.fallback} aria-hidden="true">
                      <span>{KIND_ICON[it.kind ?? 'game'] ?? '🎮'}</span>
                    </div>
                  )}
                  <div className={styles.overlay}>
                    <span className={styles.date}>{d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Paris' })}</span>
                    <span className={styles.title}>{it.title}</span>
                    {it.vodUrl ? (
                      <a href={it.vodUrl} target="_blank" rel="noopener noreferrer" className={`candy-btn candy-btn--small ${styles.vodBtn}`}>
                        ▶ Voir la VOD
                      </a>
                    ) : (
                      <span className={`sticker sticker--pink ${styles.soon}`}>VOD à venir</span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="muted">Rien pour l’instant : reviens après le prochain changement de planning !</p>
        )}
        <p style={{ textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
          <Link href="/">← Retour à l’accueil</Link>
        </p>
      </AeroWindow>
    </div>
  )
}
