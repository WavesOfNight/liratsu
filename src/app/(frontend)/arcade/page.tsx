import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { ComingSoon } from '@/components/ComingSoon'
import { getSection, getSiteData, mediaUrl } from '@/lib/site'
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
  const { payload } = await getSiteData()
  const games = await payload.find({ collection: 'games', where: { status: { not_equals: 'off' } }, sort: 'order', limit: 100, depth: 1 })

  return (
    <div className="container">
      <header className="page-head">
        <h1>Arcade</h1>
        <p>Glisse une pièce (imaginaire) et choisis ta borne ✦</p>
      </header>
      <ul className={styles.room}>
        {games.docs.map((g) => {
          const thumb = mediaUrl(g.thumbnail, 'card')
          return (
            <li key={g.id} className={styles.cabinet} style={{ '--cab': g.color || '#3FA9F5' } as React.CSSProperties}>
              <div className={styles.marquee}>{g.title}</div>
              <div className={styles.screen}>
                {thumb ? <Image src={thumb} alt="" width={220} height={220} className={styles.screenImg} /> : <p>{g.tagline}</p>}
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
          )
        })}
        {games.docs.length === 0 && <li className="muted">Les bornes arrivent bientôt…</li>}
      </ul>
    </div>
  )
}
