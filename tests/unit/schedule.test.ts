import { describe, expect, it } from 'vitest'
import { lastOccurrenceOf, scheduleChanged, scheduleSignature, sortedByDay, toDiscordItems, type ManualScheduleItem } from '@/lib/schedule'
import { parseYouTubeFeed } from '@/lib/youtube'

const item = (over: Partial<ManualScheduleItem> = {}): ManualScheduleItem => ({ day: 'Mardi', time: '20h30', title: 'Soirée dessin', kind: 'art', ...over })

describe('détection de changement de planning', () => {
  it('ignore l’ordre et les identifiants internes', () => {
    const a = [item({ id: '1' }), item({ id: '2', day: 'Jeudi', title: 'Jeu' })]
    const b = [item({ id: '99', day: 'Jeudi', title: 'Jeu' }), item({ id: '5' })]
    expect(scheduleChanged(a, b)).toBe(false)
    expect(scheduleSignature(a)).toBe(scheduleSignature(b))
  })
  it('détecte un vrai changement (heure, titre, jeu)', () => {
    expect(scheduleChanged([item()], [item({ time: '21h00' })])).toBe(true)
    expect(scheduleChanged([item()], [item({ title: 'Autre programme' })])).toBe(true)
    expect(scheduleChanged([item({ kind: 'game', game: 'Hollow Knight' })], [item({ kind: 'game', game: 'Celeste' })])).toBe(true)
    expect(scheduleChanged([], [item()])).toBe(true)
    expect(scheduleChanged([item()], [])).toBe(true)
  })
})

describe('tri par jour', () => {
  it('respecte l’ordre lundi → dimanche quelle que soit la saisie', () => {
    const days = sortedByDay([item({ day: 'Dimanche' }), item({ day: 'Lundi' }), item({ day: 'Mercredi' })]).map((i) => i.day)
    expect(days).toEqual(['Lundi', 'Mercredi', 'Dimanche'])
  })
})

describe('conversion pour l’image Discord', () => {
  it('choisit l’icône selon le type et trie par jour', () => {
    const out = toDiscordItems([item({ day: 'Jeudi', kind: 'music' }), item({ day: 'Lundi', kind: 'chat' })])
    expect(out.map((o) => o.day)).toEqual(['Lundi', 'Jeudi'])
    expect(out[0].icon).toBe('💬')
    expect(out[1].icon).toBe('🎵')
  })
})

describe('date de la dernière occurrence d’un jour', () => {
  it('retombe sur aujourd’hui si c’est le bon jour', () => {
    // 2026-09-24 est un jeudi
    const thursday = new Date('2026-09-24T15:00:00+02:00')
    expect(lastOccurrenceOf('Jeudi', thursday).slice(0, 10)).toBe('2026-09-24')
  })
  it('revient en arrière dans la même semaine sinon', () => {
    const thursday = new Date('2026-09-24T15:00:00+02:00')
    expect(lastOccurrenceOf('Mardi', thursday).slice(0, 10)).toBe('2026-09-22')
    expect(lastOccurrenceOf('Lundi', thursday).slice(0, 10)).toBe('2026-09-21')
  })
  it('remonte à la semaine précédente si le jour n’est pas encore passé cette semaine', () => {
    const monday = new Date('2026-09-21T09:00:00+02:00')
    expect(lastOccurrenceOf('Dimanche', monday).slice(0, 10)).toBe('2026-09-20')
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
