/**
 * Petits sons « système » rétro synthétisés à la volée (Web Audio API) : aucun fichier,
 * aucun son repris d'un produit existant. Désactivés par défaut ; activés par le visiteur.
 */
type SoundName = 'click' | 'notify' | 'pop' | 'wizz' | 'coin' | 'hurt' | 'shoot'

let ctx: AudioContext | null = null
let enabled = false

export function setSoundsEnabled(on: boolean) {
  enabled = on
}
export function soundsEnabled() {
  return enabled
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.08) {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
  g.gain.setValueAtTime(0, ctx.currentTime + start)
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur)
  osc.connect(g).connect(ctx.destination)
  osc.start(ctx.currentTime + start)
  osc.stop(ctx.currentTime + start + dur + 0.02)
}

export function playSound(name: SoundName, force = false) {
  if ((!enabled && !force) || typeof window === 'undefined') return
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    switch (name) {
      case 'click':
        tone(1400, 0, 0.04, 'square', 0.03)
        break
      case 'notify': // petit « ding-dong » bulle, original
        tone(880, 0, 0.18)
        tone(1320, 0.12, 0.3)
        break
      case 'pop':
        tone(600, 0, 0.05, 'triangle', 0.1)
        tone(1200, 0.03, 0.08, 'sine', 0.06)
        break
      case 'wizz':
        for (let i = 0; i < 6; i++) tone(i % 2 ? 220 : 180, i * 0.06, 0.06, 'sawtooth', 0.05)
        break
      case 'coin':
        tone(988, 0, 0.08, 'square', 0.04)
        tone(1319, 0.08, 0.2, 'square', 0.04)
        break
      case 'hurt':
        tone(200, 0, 0.15, 'sawtooth', 0.05)
        break
      case 'shoot':
        tone(700, 0, 0.05, 'triangle', 0.03)
        break
    }
  } catch {
    // Audio indisponible : on ignore silencieusement.
  }
}
