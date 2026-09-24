import { describe, expect, it } from 'vitest'
import { formatScheduleDate, scheduleChanged, scheduleSignature, sortedByDate, toDiscordItems, upcoming, type ScheduleItem } from '@/lib/schedule'
import { parseYouTubeFeed } from '@/lib/youtube'

const item = (over: Partial<ScheduleItem> = {}): ScheduleItem => ({ date: '2026-09-22', time: '20h30', title: 'Soirée dessin', kind: 'art', ...over })

describe('détection de changement de planning', () => {
  it('ignore l’ordre et les identifiants internes', () => {
    const a = [item({ id: '1' }), item({ id: '2', date: '2026-09-24', title: 'Jeu' })]
    const b = [item({ id: '99', date: '2026-09-24', title: 'Jeu' }), item({ id: '5' })]
    expect(scheduleChanged(a, b)).toBe(false)
    expect(scheduleSignature(a)).toBe(scheduleSignature(b))
  })
  it('détecte un vrai changement (date, heure, titre, jeu)', () => {
    expect(scheduleChanged([item()], [item({ time: '21h00' })])).toBe(true)
    expect(scheduleChanged([item()], [item({ title: 'Autre programme' })])).toBe(true)
    expect(scheduleChanged([item()], [item({ date: '2026-09-23' })])).toBe(true)
    expect(scheduleChanged([item({ kind: 'game', game: 'Hollow Knight' })], [item({ kind: 'game', game: 'Celeste' })])).toBe(true)
    expect(scheduleChanged([], [item()])).toBe(true)
    expect(scheduleChanged([item()], [])).toBe(true)
  })
})

describe('tri par date', () => {
  it('trie du plus proche au plus lointain, quelle que soit la saisie', () => {
    const dates = sortedByDate([item({ date: '2026-10-01' }), item({ date: '2026-09-22' }), item({ date: '2026-09-25' })]).map((i) => i.date)
    expect(dates).toEqual(['2026-09-22', '2026-09-25', '2026-10-01'])
  })
})

describe('filtre des créneaux à venir', () => {
  it('exclut les dates déjà passées', () => {
    const today = new Date('2026-09-24T12:00:00+02:00')
    const items = [item({ date: '2026-09-20' }), item({ date: '2026-09-24' }), item({ date: '2026-09-30' })]
    expect(upcoming(items, today).map((i) => i.date)).toEqual(['2026-09-24', '2026-09-30'])
  })
})

describe('conversion pour l’image Discord', () => {
  it('choisit l’icône selon le type et trie par date', () => {
    const out = toDiscordItems([item({ date: '2026-09-25', kind: 'music' }), item({ date: '2026-09-22', kind: 'chat' })])
    expect(out.map((o) => o.day)).toEqual([formatScheduleDate('2026-09-22'), formatScheduleDate('2026-09-25')])
    expect(out[0].icon).toBe('💬')
    expect(out[1].icon).toBe('🎵')
  })
})

describe('mise en forme d’une date de planning', () => {
  it('inclut le jour de semaine et la date', () => {
    // 2026-09-24 est un jeudi
    expect(formatScheduleDate('2026-09-24')).toContain('24')
    expect(formatScheduleDate('2026-09-24').toLowerCase()).toContain('jeudi')
  })
})

describe('correspondance de VOD dans le flux RSS', () => {
  it('reconnaît le format « Rediff DD/MM/YYYY » observé sur la chaîne', () => {
    const xml = `<feed><entry><yt:videoId>abc</yt:videoId><title>The Binding Of Isaac - Rediff 24/08/2026 Jtmaless &amp; Koshi &amp; Capitaine Cascroute</title><published>2026-08-25T10:00:00+00:00</published></entry></feed>`
    const videos = parseYouTubeFeed(xml)
    expect(videos[0].title).toContain('24/08/2026')
    expect(videos[0].title).toContain('The Binding Of Isaac')
  })
})
