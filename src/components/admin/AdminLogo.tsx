/** Logo et icône du panel admin (léger thème aero, sans nuire à l'ergonomie). */
import React from 'react'

export function AdminLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span
        style={{
          fontFamily: 'Fredoka, system-ui, sans-serif',
          fontWeight: 700,
          fontSize: 40,
          background: 'linear-gradient(180deg,#bfe8ff,#5cbcf7 45%,#2a86e0 70%,#1e6fd9)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          WebkitTextStroke: '1.5px #fff',
          filter: 'drop-shadow(0 4px 10px rgba(30,111,217,.35))',
        }}
      >
        Liratsu
      </span>
    </div>
  )
}

export function AdminIcon() {
  return <img src="/favicon.png" alt="Liratsu" width={26} height={26} style={{ borderRadius: '50%' }} />
}
