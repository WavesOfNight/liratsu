/** Icônes des boutons de préférences (thème, animations, sons) — même style dessiné que WindowIcon. */
import React from 'react'

const common = { viewBox: '0 0 24 24', 'aria-hidden': true, width: 22, height: 22 } as const

export function SunIcon() {
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="5.5" fill="#ffd35c" stroke="#fff" strokeWidth="1.4" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line
          key={a}
          x1={12 + Math.cos((a * Math.PI) / 180) * 8}
          y1={12 + Math.sin((a * Math.PI) / 180) * 8}
          x2={12 + Math.cos((a * Math.PI) / 180) * 10.5}
          y2={12 + Math.sin((a * Math.PI) / 180) * 10.5}
          stroke="#ffb020"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

export function MoonIcon() {
  return (
    <svg {...common}>
      <path d="M17.5 14.5A8 8 0 0 1 9.5 6.5c0-.9.13-1.76.38-2.56A8 8 0 1 0 20.06 14.1c-.82.26-1.68.4-2.56.4Z" fill="#bfe8ff" stroke="#1e6fd9" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="9" cy="9" r="1" fill="#fff" opacity=".9" />
      <circle cx="13" cy="6.5" r=".6" fill="#fff" opacity=".8" />
    </svg>
  )
}

export function BubblesOnIcon() {
  return (
    <svg {...common}>
      <circle cx="9" cy="13" r="6" fill="#bfe8ff" stroke="#1e6fd9" strokeWidth="1.3" />
      <circle cx="6.5" cy="10.5" r="1.8" fill="#fff" opacity=".85" />
      <circle cx="17" cy="8" r="3.4" fill="#dff2ff" stroke="#3fa9f5" strokeWidth="1.1" />
      <circle cx="15.8" cy="6.8" r="1" fill="#fff" opacity=".9" />
    </svg>
  )
}

export function BubblesOffIcon() {
  return (
    <svg {...common}>
      <circle cx="9" cy="13" r="6" fill="#dbe4ee" stroke="#8fa3bd" strokeWidth="1.3" />
      <rect x="7.2" y="10" width="1.8" height="6" rx="0.9" fill="#5c6f8a" />
      <rect x="10.6" y="10" width="1.8" height="6" rx="0.9" fill="#5c6f8a" />
    </svg>
  )
}

export function SoundOnIcon() {
  return (
    <svg {...common}>
      <path d="M4 10v4h3.2L11 17V7L7.2 10Z" fill="#3fa9f5" stroke="#fff" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M14.5 9a4.2 4.2 0 0 1 0 6" fill="none" stroke="#1e6fd9" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17 6.5a8 8 0 0 1 0 11" fill="none" stroke="#1e6fd9" strokeWidth="1.6" strokeLinecap="round" opacity=".7" />
    </svg>
  )
}

export function SoundOffIcon() {
  return (
    <svg {...common}>
      <path d="M4 10v4h3.2L11 17V7L7.2 10Z" fill="#9aa8bb" stroke="#fff" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M15 9.5l4.5 5M19.5 9.5 15 14.5" stroke="#c0455b" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
