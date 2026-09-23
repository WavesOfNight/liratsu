/** Page teaser animée « Bientôt ? » pour une section désactivée temporairement. */
import React from 'react'
import { AeroWindow } from './AeroWindow'
import { NotifyForm } from './forms/NotifyForm'
import styles from './ComingSoon.module.css'

export function ComingSoon({ title, section, text, notifyForm }: { title: string; section: string; text?: string | null; notifyForm: boolean }) {
  return (
    <div className="container">
      <div className={styles.wrap}>
        <div className={styles.bubble} aria-hidden="true">
          <span>bientôt ?</span>
        </div>
        <h1 className={styles.title}>{title}</h1>
        <AeroWindow title="Chargement en cours…" icon="bubble" className={styles.window}>
          <p className={styles.text}>{text || 'Cette partie du site mijote encore… elle arrive bientôt, promis !'}</p>
          <div className="pixel-bar" style={{ '--pct': '62%' } as React.CSSProperties} role="img" aria-label="Progression : bientôt prêt">
            <div className="pixel-bar__track">
              <div className="pixel-bar__fill" />
            </div>
          </div>
          {notifyForm && (
            <div style={{ marginTop: 24 }}>
              <NotifyForm section={section} />
            </div>
          )}
        </AeroWindow>
      </div>
    </div>
  )
}
