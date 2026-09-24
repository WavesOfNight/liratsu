/**
 * Utilitaires partagés autour du bloc « Planning » de la page Accueil : extraction des
 * dates saisies manuellement, détection de changement (pour l'envoi Discord et
 * l'archivage), conversion vers le format carte utilisé par l'image Discord.
 */
import type { HomePage } from '@/payload-types'
import type { ScheduleItemForDiscord } from './discord'

export const DAYS_ORDER = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const
export const KIND_ICON: Record<string, string> = { game: '🎮', art: '🎨', music: '🎵', chat: '💬' }

export type ManualScheduleItem = {
  id?: string | null
  day: string
  time: string
  title: string
  kind?: string | null
  game?: string | null
  boxArtUrl?: string | null
}

/** Le bloc « schedule » de la page Accueil, s'il existe. */
export function findScheduleBlock(home: Pick<HomePage, 'layout'> | null | undefined) {
  return home?.layout?.find((b): b is Extract<NonNullable<HomePage['layout']>[number], { blockType: 'schedule' }> => b.blockType === 'schedule') ?? null
}

export function extractManualSchedule(home: Pick<HomePage, 'layout'> | null | undefined): ManualScheduleItem[] {
  return findScheduleBlock(home)?.manual ?? []
}

/** Compare deux plannings en ignorant les identifiants internes (générés côté DB). */
export function scheduleSignature(items: ManualScheduleItem[]): string {
  return JSON.stringify(
    [...items]
      .map((i) => ({ day: i.day, time: i.time, title: i.title, kind: i.kind ?? 'game', game: i.game ?? '' }))
      .sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time)),
  )
}

export function scheduleChanged(prev: ManualScheduleItem[], next: ManualScheduleItem[]): boolean {
  return scheduleSignature(prev) !== scheduleSignature(next)
}

export function sortedByDay<T extends { day: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => DAYS_ORDER.indexOf(a.day as (typeof DAYS_ORDER)[number]) - DAYS_ORDER.indexOf(b.day as (typeof DAYS_ORDER)[number]))
}

export function toDiscordItems(items: ManualScheduleItem[]): ScheduleItemForDiscord[] {
  return sortedByDay(items).map((i) => ({ day: i.day, time: i.time, title: i.title, icon: KIND_ICON[i.kind ?? 'game'] ?? '🎮', boxArtUrl: i.boxArtUrl }))
}

/** Date (ISO, minuit Europe/Paris) de la dernière occurrence de ce jour de semaine, ≤ `from`. */
export function lastOccurrenceOf(day: string, from = new Date()): string {
  const idx = DAYS_ORDER.indexOf(day as (typeof DAYS_ORDER)[number])
  if (idx === -1) return from.toISOString()
  // getDay() : 0 = dimanche … 6 = samedi → on aligne sur notre liste (0 = lundi … 6 = dimanche)
  const todayIdx = (from.getDay() + 6) % 7
  let delta = todayIdx - idx
  if (delta < 0) delta += 7
  const d = new Date(from)
  d.setDate(d.getDate() - delta)
  // On repart des champs Y/M/D locaux pour construire un minuit UTC : un simple
  // setHours(0,0,0,0) + toISOString() ferait reculer d'un jour dans un fuseau
  // en avance sur UTC (Europe/Paris en été, par ex. minuit local = 22h UTC la veille).
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString()
}
