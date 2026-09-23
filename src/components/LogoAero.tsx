'use client'
/**
 * Logo « Liratsu » version Frutiger Aero : Fredoka 700, dégradé bleu, contour blanc 2 px,
 * reflet glossy sur la moitié haute, halo bleuté, bulles et étoiles scintillantes.
 *
 * Easter egg : 7 clics → le logo éclate comme une bulle puis se reforme.
 */
import React, { useRef, useState } from 'react'
import { playSound } from './prefs/sounds'
import styles from './LogoAero.module.css'

type Props = {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  as?: 'h1' | 'span' | 'p'
  text?: string
  decorations?: boolean
  popEgg?: boolean
}

export function LogoAero({ size = 'md', as: Tag = 'span', text = 'Liratsu', decorations = true, popEgg = true }: Props) {
  const [popped, setPopped] = useState(false)
  const clicks = useRef<number[]>([])

  const onClick = () => {
    if (!popEgg || popped) return
    const now = Date.now()
    clicks.current = [...clicks.current.filter((t) => now - t < 3000), now]
    if (clicks.current.length >= 7) {
      clicks.current = []
      setPopped(true)
      playSound('pop')
      window.setTimeout(() => setPopped(false), 2200)
    }
  }

  return (
    <Tag className={`${styles.logo} ${styles[size]} ${popped ? styles.popped : ''}`} data-egg="logo">
      <span className={styles.word} onClick={onClick} data-text={text}>
        {text}
      </span>
      {decorations && (
        <span className={styles.decor} aria-hidden="true">
          <i className={`${styles.bubble} ${styles.b1}`} />
          <i className={`${styles.bubble} ${styles.b2}`} />
          <i className={`${styles.bubble} ${styles.b3}`} />
          <Star className={`${styles.star} ${styles.s1}`} />
          <Star className={`${styles.star} ${styles.s2}`} />
        </span>
      )}
      {popped && (
        <span className={styles.splash} aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} style={{ '--a': `${i * 36}deg` } as React.CSSProperties} />
          ))}
        </span>
      )}
    </Tag>
  )
}

function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="24" height="24">
      <path d="M12 1.5l2.6 6.6 7 .6-5.3 4.6 1.6 6.9L12 16.5l-5.9 3.7 1.6-6.9L2.4 8.7l7-.6z" fill="#FFD35C" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}
