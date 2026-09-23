'use client'
/**
 * Carte « fenêtre Windows Aero » réutilisable : barre de titre glossy, boutons
 * réduire/agrandir décoratifs, bouton fermer → easter egg (la fenêtre revient).
 */
import React, { useState } from 'react'
import { playSound } from './prefs/sounds'
import { useEggs } from './eggs/EggsContext'

type Props = {
  title?: string
  icon?: 'star' | 'bubble' | 'heart' | 'fish' | 'note' | 'gamepad' | 'pencil' | 'shop' | 'live'
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  as?: 'section' | 'article' | 'div' | 'aside'
  id?: string
  headingLevel?: 2 | 3
}

export function AeroWindow({ title, icon = 'star', children, className = '', bodyClassName = '', as: Tag = 'section', id, headingLevel = 2 }: Props) {
  const [closing, setClosing] = useState(false)
  const [toast, setToast] = useState(false)
  const eggs = useEggs()
  const H = `h${headingLevel}` as 'h2' | 'h3'

  const onClose = () => {
    if (!eggs.windowClose) return
    playSound('pop')
    setClosing(true)
    window.setTimeout(() => {
      setClosing(false)
      setToast(true)
      playSound('notify')
      window.setTimeout(() => setToast(false), 2600)
    }, 350)
  }

  return (
    <Tag className={`aero-window ${toast ? 'is-bouncing' : ''} ${className}`} id={id} style={closing ? { transform: 'scale(.2)', opacity: 0, transition: 'all .35s ease-in' } : undefined}>
      {title !== undefined && (
        <div className="aero-window__bar">
          <WindowIcon name={icon} />
          <H className="aero-window__title" style={{ margin: 0, font: 'inherit' }}>
            {title}
          </H>
          <div className="aero-window__controls" aria-hidden={!eggs.windowClose}>
            <span className="aero-window__ctrl" aria-hidden="true">
              <svg viewBox="0 0 10 10">
                <rect x="1" y="7" width="8" height="2" fill="currentColor" />
              </svg>
            </span>
            <span className="aero-window__ctrl" aria-hidden="true">
              <svg viewBox="0 0 10 10">
                <rect x="1.5" y="1.5" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </span>
            {eggs.windowClose ? (
              <button type="button" className="aero-window__ctrl aero-window__ctrl--close" onClick={onClose} aria-label="Fermer la fenêtre (enfin… essaie)">
                <svg viewBox="0 0 10 10">
                  <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            ) : (
              <span className="aero-window__ctrl aero-window__ctrl--close" aria-hidden="true">
                <svg viewBox="0 0 10 10">
                  <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
            )}
          </div>
        </div>
      )}
      {toast && (
        <div role="status" className="window-toast">
          Tu croyais vraiment pouvoir me fermer ? ✦
        </div>
      )}
      <div className={`aero-window__body ${bodyClassName}`}>{children}</div>
    </Tag>
  )
}

export function WindowIcon({ name }: { name: NonNullable<Props['icon']> }) {
  const common = { className: 'aero-window__icon', viewBox: '0 0 24 24', 'aria-hidden': true } as const
  switch (name) {
    case 'bubble':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" fill="#bfe8ff" stroke="#1e6fd9" strokeWidth="1.5" />
          <circle cx="9" cy="9" r="2.5" fill="#fff" />
        </svg>
      )
    case 'heart':
      return (
        <svg {...common}>
          <path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11Z" fill="#ff7eb6" stroke="#fff" strokeWidth="1.5" />
        </svg>
      )
    case 'fish':
      return (
        <svg {...common}>
          <path d="M3 12c3-5 10-6 14-2l4-3v10l-4-3c-4 4-11 3-14-2Z" fill="#ff8a3d" stroke="#fff" strokeWidth="1.2" />
          <circle cx="7" cy="11" r="1.2" fill="#1b2240" />
        </svg>
      )
    case 'note':
      return (
        <svg {...common}>
          <path d="M9 18V5l11-2v13" fill="none" stroke="#1e6fd9" strokeWidth="2" />
          <circle cx="6.5" cy="18" r="3" fill="#2ec4c9" />
          <circle cx="17.5" cy="16" r="3" fill="#2ec4c9" />
        </svg>
      )
    case 'gamepad':
      return (
        <svg {...common}>
          <rect x="2" y="7" width="20" height="11" rx="5.5" fill="#9be15d" stroke="#fff" strokeWidth="1.5" />
          <path d="M7 10v5M4.5 12.5h5" stroke="#1b2240" strokeWidth="1.8" />
          <circle cx="16" cy="11" r="1.3" fill="#1b2240" />
          <circle cx="18.5" cy="13.5" r="1.3" fill="#1b2240" />
        </svg>
      )
    case 'pencil':
      return (
        <svg {...common}>
          <path d="M4 20l1-5L16 4l4 4L9 19Z" fill="#ffd35c" stroke="#1b2240" strokeWidth="1.3" />
        </svg>
      )
    case 'shop':
      return (
        <svg {...common}>
          <path d="M5 8h14l-1 12H6Z" fill="#ff7eb6" stroke="#fff" strokeWidth="1.3" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="#1b2240" strokeWidth="1.5" />
        </svg>
      )
    case 'live':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="12" rx="3" fill="#3fa9f5" stroke="#fff" strokeWidth="1.3" />
          <circle cx="12" cy="11" r="3" fill="#ff5a7a" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path d="M12 2l2.9 6.5 7.1.6-5.4 4.7 1.6 7L12 17l-6.2 3.8 1.6-7L2 9.1l7.1-.6z" fill="#ffd35c" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      )
  }
}
