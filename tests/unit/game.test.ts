import { describe, expect, it } from 'vitest'
import { generateFloor } from '@/game/saac/dungeon'
import { createRng, dailySeed } from '@/game/saac/rng'
import { cleanNickname, validateScore } from '@/game/saac/validate'

const rules = { maxFloors: 5, maxScorePerSecond: 60 }

describe('génération procédurale', () => {
  it('est déterministe pour une même seed', () => {
    const a = generateFloor(createRng('seed-1'), 0)
    const b = generateFloor(createRng('seed-1'), 0)
    expect([...a.rooms.keys()]).toEqual([...b.rooms.keys()])
  })
  it('contient toujours départ, boss, trésor et boutique, tous accessibles', () => {
    for (let i = 0; i < 30; i++) {
      const floor = generateFloor(createRng(`s${i}`), i % 5)
      const kinds = [...floor.rooms.values()].map((r) => r.kind)
      expect(kinds.filter((k) => k === 'boss')).toHaveLength(1)
      expect(kinds).toContain('treasure')
      expect(kinds).toContain('shop')
      // Chaque porte a sa porte réciproque
      for (const r of floor.rooms.values()) {
        if (r.doors.right) expect(floor.rooms.get(`${r.x + 1},${r.y}`)?.doors.left).toBe(true)
        if (r.doors.down) expect(floor.rooms.get(`${r.x},${r.y + 1}`)?.doors.up).toBe(true)
      }
    }
  })
  it('la seed du jour change chaque jour (heure de Paris)', () => {
    expect(dailySeed(new Date('2026-09-23T10:00:00Z'))).toBe('daily-2026-09-23')
    expect(dailySeed(new Date('2026-09-23T22:30:00Z'))).toBe('daily-2026-09-24')
  })
})

describe('validation anti-triche des scores', () => {
  const ok = { score: 400, floor: 2, won: false, durationMs: 90_000, kills: 20, rooms: 8 }
  it('accepte une partie plausible', () => {
    expect(validateScore(ok, 95_000, rules)).toEqual({ ok: true })
  })
  it('refuse une durée déclarée supérieure à la durée réelle', () => {
    expect(validateScore(ok, 30_000, rules).ok).toBe(false)
  })
  it('refuse un score trop élevé pour la durée ou les statistiques', () => {
    expect(validateScore({ ...ok, score: 50_000 }, 95_000, rules).ok).toBe(false)
    expect(validateScore({ ...ok, score: 4000, kills: 1, rooms: 1 }, 95_000, rules).ok).toBe(false)
  })
  it('refuse les étages impossibles et les victoires trop rapides', () => {
    expect(validateScore({ ...ok, floor: 9 }, 95_000, rules).ok).toBe(false)
    expect(validateScore({ ...ok, won: true, floor: 5, durationMs: 20_000 }, 21_000, rules).ok).toBe(false)
    expect(validateScore({ ...ok, won: true, floor: 3 }, 95_000, rules).ok).toBe(false)
  })
})

describe('pseudos', () => {
  it('nettoie et filtre', () => {
    expect(cleanNickname('  Bulle<3  ')).toBe('Bulle3')
    expect(cleanNickname('a')).toBeNull()
    expect(cleanNickname('Admin')).toBeNull()
    expect(cleanNickname('L.i.r.a.t.s.u')).toBeNull()
    expect(cleanNickname('Poisson Rouge 2000 et plus encore')?.length).toBe(20)
  })
})
