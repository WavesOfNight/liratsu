'use client'
/**
 * Fond animé discret : bulles qui montent lentement devant la photo de fond (public/Background).
 * Canvas 2D en requestAnimationFrame, en pause quand l'onglet est caché, coupé si le visiteur
 * désactive les animations ou prefers-reduced-motion.
 *
 * Écoute l'événement `liratsu:rain` (Konami code) pour une pluie de bulles.
 */
import React, { useEffect, useRef } from 'react'
import { usePrefs } from './prefs/PrefsProvider'

type Bubble = { x: number; y: number; r: number; vy: number; wobble: number; phase: number }

export function drawBubble(ctx: CanvasRenderingContext2D, b: Pick<Bubble, 'x' | 'y' | 'r'>, dark: boolean) {
  const g = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.1, b.x, b.y, b.r)
  g.addColorStop(0, 'rgba(255,255,255,.85)')
  g.addColorStop(0.4, dark ? 'rgba(126,231,236,.10)' : 'rgba(255,255,255,.12)')
  g.addColorStop(0.85, dark ? 'rgba(46,196,201,.22)' : 'rgba(63,169,245,.18)')
  g.addColorStop(1, 'rgba(255,255,255,.55)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
  ctx.fill()
}

export function BackgroundAquarium({ bubbles = true }: { bubbles?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { effectiveMotion } = usePrefs()

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    let running = true
    let w = 0
    let h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const count = Math.round(Math.min(26, (w * h) / 45000))
    const spawnBubble = (initial = false): Bubble => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + 20,
      r: 4 + Math.random() * 20,
      vy: 10 + Math.random() * 22,
      wobble: 6 + Math.random() * 14,
      phase: Math.random() * 6,
    })
    let list: Bubble[] = bubbles ? Array.from({ length: count }, () => spawnBubble(true)) : []

    const onRain = () => {
      for (let i = 0; i < 60; i++) list.push({ ...spawnBubble(), y: h + Math.random() * 200, vy: 60 + Math.random() * 80 })
    }
    window.addEventListener('liratsu:rain', onRain)

    // Mode statique (animations coupées) : un seul rendu figé, très léger.
    const dark = () => document.documentElement.dataset.theme === 'dark'
    if (!effectiveMotion) {
      ctx.clearRect(0, 0, w, h)
      list.forEach((b) => drawBubble(ctx, b, dark()))
      return () => window.removeEventListener('liratsu:rain', onRain)
    }

    let last = performance.now()
    const frame = (now: number) => {
      if (!running) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      ctx.clearRect(0, 0, w, h)
      const isDark = dark()

      if (bubbles) {
        for (const b of list) {
          b.y -= b.vy * dt
          b.phase += dt
          drawBubble(ctx, { x: b.x + Math.sin(b.phase) * b.wobble, y: b.y, r: b.r }, isDark)
        }
        list = list.filter((b) => b.y > -30)
        while (list.length < count) list.push(spawnBubble())
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const onVis = () => {
      running = !document.hidden
      if (running) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      } else cancelAnimationFrame(raf)
    }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('resize', resize)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('resize', resize)
      window.removeEventListener('liratsu:rain', onRain)
    }
  }, [effectiveMotion, bubbles])

  return <canvas ref={ref} aria-hidden="true" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none' }} />
}
