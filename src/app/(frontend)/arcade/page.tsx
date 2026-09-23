import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { ComingSoon } from '@/components/ComingSoon'
import { ARCADE_GAMES } from '@/game/registry'
import { getSection } from '@/lib/site'
import styles from './arcade.module.css'

export const metadata: Metadata = {
  title: 'Arcade',
  description: 'La salle d’arcade de Liratsu : mini-jeux originaux, défi du jour et classement.',
  alternates: { canonical: '/arcade' },
}

export default async function ArcadePage() {
  const section = await getSection('arcade')
  if (section.status === 'off') notFound()
  if (section.status === 'soon') return <ComingSoon title="Arcade" section="arcade" text={section.teaserText} notifyForm={section.notifyForm} />
  return (
    <div className="container">
      <header className="page-head">
        <h1>Arcade</h1>
        <p>Glisse une pièce (imaginaire) et choisis ta borne ✦</p>
      </header>
      <ul className={styles.room}>
        {ARCADE_GAMES.map((g) => (
          <li key={g.slug} className={styles.cabinet} style={{ '--cab': g.color } as React.CSSProperties}>
            <div className={styles.marquee}>{g.title}</div>
            <div className={styles.screen}>
              <p>{g.tagline}</p>
            </div>
            <div className={styles.panel}>
              <span className={styles.stick} aria-hidden="true" />
              <span className={styles.btnA} aria-hidden="true" />
              <span className={styles.btnB} aria-hidden="true" />
            </div>
            {g.status === 'live' ? (
              <Link href={`/arcade/${g.slug}`} className="candy-btn">
                ▶ Jouer
              </Link>
            ) : (
              <span className="sticker sticker--pink">bientôt ?</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
