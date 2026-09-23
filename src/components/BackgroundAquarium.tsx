'use client'
/**
 * Fond animé discret : bulles qui montent lentement + poissons rouges qui traversent
 * de temps en temps. Canvas 2D en requestAnimationFrame, en pause quand l'onglet est
 * caché, coupé si le visiteur désactive les animations ou prefers-reduced-motion.
 *
 * Écoute l'événement `liratsu:rain` (Konami code) pour une pluie de poissons et de bulles.
 */
import React, { useEffect, useRef } from 'react'
import { usePrefs } from './prefs/PrefsProvider'

type Bubble = { x: number; y: number; r: number; vy: number; wobble: number; phase: number }
type Fish = { x: number; y: number; vx: number; size: number; phase: number; hue: number; vy?: number; falling?: boolean }

export function drawFish(ctx: CanvasRenderingContext2D, f: Pick<Fish, 'x' | 'y' | 'vx' | 'size' | 'phase' | 'hue'>, t: number) {
  const dir = f.vx >= 0 ? 1 : -1
  const s = f.size
  const tail = Math.sin(t * 8 + f.phase) * 0.35
  ctx.save()
  ctx.translate(f.x, f.y)
  ctx.scale(dir, 1)
  // queue
  ctx.fillStyle = `hsl(${f.hue} 95% 62%)`
  ctx.beginPath()
  ctx.moveTo(-s * 0.7, 0)
  ctx.lineTo(-s * 1.25, -s * (0.45 + tail))
  ctx.quadraticCurveTo(-s * 1.05, 0, -s * 1.25, s * (0.45 - tail))
  ctx.closePath()
  ctx.fill()
  // corps
  const g = ctx.createLinearGradient(0, -s * 0.5, 0, s * 0.5)
  g.addColorStop(0, `hsl(${f.hue + 12} 100% 72%)`)
  g.addColorStop(1, `hsl(${f.hue} 90% 52%)`)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(0, 0, s * 0.8, s * 0.48, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.8)'
  ctx.lineWidth = Math.max(1, s * 0.06)
  ctx.stroke()
  // nageoire
  ctx.fillStyle = `hsla(${f.hue + 20} 100% 80% / .85)`
  ctx.beginPath()
  ctx.ellipse(-s * 0.05, -s * 0.42, s * 0.28, s * 0.14, -0.4, 0, Math.PI * 2)
  ctx.fill()
  // reflet
  ctx.fillStyle = 'rgba(255,255,255,.55)'
  ctx.beginPath()
  ctx.ellipse(s * 0.1, -s * 0.2, s * 0.38, s * 0.1, -0.1, 0, Math.PI * 2)
  ctx.fill()
  // œil
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(s * 0.45, -s * 0.08, s * 0.14, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1b2240'
  ctx.beginPath()
  ctx.arc(s * 0.49, -s * 0.07, s * 0.07, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

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

export function BackgroundAquarium({ bubbles = true, fish = true }: { bubbles?: boolean; fish?: boolean }) {
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
      r: 3 + Math.random() * 12,
      vy: 10 + Math.random() * 22,
      wobble: 6 + Math.random() * 14,
      phase: Math.random() * 6,
    })
    let list: Bubble[] = bubbles ? Array.from({ length: count }, () => spawnBubble(true)) : []
    let fishes: Fish[] = []
    let nextFish = performance.now() + 4000
    let rainUntil = 0
    const hueFish = () => 8 + Math.random() * 22

    const onRain = () => {
      rainUntil = performance.now() + 6000
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

      if (now < rainUntil && Math.random() < 0.5) {
        fishes.push({ x: Math.random() * w, y: -30, vx: (Math.random() - 0.5) * 60, vy: 120 + Math.random() * 140, size: 12 + Math.random() * 14, phase: Math.random() * 6, hue: hueFish(), falling: true })
      }
      if (fish && now > nextFish && fishes.filter((f) => !f.falling).length < 2) {
        const ltr = Math.random() < 0.5
        fishes.push({ x: ltr ? -60 : w + 60, y: h * (0.25 + Math.random() * 0.6), vx: (ltr ? 1 : -1) * (40 + Math.random() * 40), size: 14 + Math.random() * 10, phase: Math.random() * 6, hue: hueFish() })
        nextFish = now + 9000 + Math.random() * 14000
      }
      for (const f of fishes) {
        f.x += f.vx * dt
        if (f.falling) f.y += (f.vy ?? 100) * dt
        else f.y += Math.sin(now / 900 + f.phase) * 0.3
        drawFish(ctx, f, now / 1000)
      }
      fishes = fishes.filter((f) => f.x > -100 && f.x < w + 100 && f.y < h + 60)
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
  }, [effectiveMotion, bubbles, fish])

  return <canvas ref={ref} aria-hidden="true" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none' }} />
}
