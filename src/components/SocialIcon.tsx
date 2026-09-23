/**
 * Icônes réseaux originales (formes simples dessinées à la main, pas les logos officiels),
 * dans des pastilles glossy.
 */
import React from 'react'

export type SocialName = 'twitch' | 'youtube' | 'instagram' | 'tiktok' | 'discord'

const COLORS: Record<SocialName, [string, string]> = {
  twitch: ['#b58cff', '#7a3fe0'],
  youtube: ['#ff8a8a', '#e0303a'],
  instagram: ['#ffb36b', '#e0428f'],
  tiktok: ['#4a4f6b', '#101320'],
  discord: ['#8f9bff', '#4c5be0'],
}

export function SocialIcon({ name, size = 44 }: { name: SocialName; size?: number }) {
  const [a, b] = COLORS[name]
  const id = `g-${name}`
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <circle cx="22" cy="22" r="20" fill={`url(#${id})`} stroke="#fff" strokeWidth="2" />
      <g fill="#fff" stroke="#fff">{GLYPHS[name]}</g>
      <ellipse cx="22" cy="13" rx="13" ry="7" fill="#fff" opacity=".28" />
    </svg>
  )
}

const GLYPHS: Record<SocialName, React.ReactNode> = {
  twitch: (
    <>
      <path d="M13 12h18v12l-5 5h-5l-3 3v-3h-5Z" strokeWidth="0" />
      <rect x="19" y="16" width="2.4" height="6" fill="#7a3fe0" strokeWidth="0" />
      <rect x="25" y="16" width="2.4" height="6" fill="#7a3fe0" strokeWidth="0" />
    </>
  ),
  youtube: (
    <>
      <rect x="11" y="14" width="22" height="16" rx="5" strokeWidth="0" />
      <path d="M20 18v8l7-4Z" fill="#e0303a" strokeWidth="0" />
    </>
  ),
  instagram: (
    <>
      <rect x="13" y="13" width="18" height="18" rx="6" fill="none" strokeWidth="2.4" />
      <circle cx="22" cy="22" r="4.5" fill="none" strokeWidth="2.4" />
      <circle cx="27.5" cy="16.5" r="1.3" strokeWidth="0" />
    </>
  ),
  tiktok: (
    <>
      <circle cx="18.5" cy="26" r="4.5" fill="none" strokeWidth="2.6" />
      <path d="M23 26V12c1 3 3.5 5 7 5" fill="none" strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),
  discord: (
    <>
      <path d="M13 17c3-3 15-3 18 0l2 10c-2 2-5 3-7 3l-1-2h-6l-1 2c-2 0-5-1-7-3Z" strokeWidth="0" />
      <circle cx="18.5" cy="23" r="2" fill="#4c5be0" strokeWidth="0" />
      <circle cx="25.5" cy="23" r="2" fill="#4c5be0" strokeWidth="0" />
    </>
  ),
}
