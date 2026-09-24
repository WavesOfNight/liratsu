/**
 * Utilitaires partagés autour du planning des streams (global « schedule ») : extraction
 * des créneaux, détection de changement (pour l'envoi Discord et l'archivage), tri et
 * mise en forme pour l'affichage / l'image Discord.
 */
import { getPayloadClient } from './payload'
import { boxArtHiRes } from './twitch'
import type { ScheduleItemForDiscord } from './discord'

export const KIND_ICON: Record<string, string> = { game: '🎮', art: '🎨', music: '🎵', chat: '💬' }

export type ScheduleItem = {
  id?: string | null
  date: string
  time: string
  title?: string | null
  kind?: string | null
  game?: string | null
  boxArtUrl?: string | null
}

/** Le texte à afficher : le Programme s'il est renseigné, sinon le nom de la catégorie Twitch. */
export function displayTitle(item: Pick<ScheduleItem, 'title' | 'game'>): string {
  return item.title?.trim() || item.game?.trim() || ''
}

/** Extrait les créneaux d'un document du global « schedule » (ou de sa version précédente). */
export function extractScheduleItems(schedule: { items?: ScheduleItem[] | null } | null | undefined): ScheduleItem[] {
  return schedule?.items ?? []
}

/** Compare deux plannings en ignorant les identifiants internes (générés côté DB). */
export function scheduleSignature(items: ScheduleItem[]): string {
  return JSON.stringify(
    [...items]
      .map((i) => ({ date: (i.date ?? '').slice(0, 10), time: i.time, title: i.title, kind: i.kind ?? 'game', game: i.game ?? '' }))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
  )
}

export function scheduleChanged(prev: ScheduleItem[], next: ScheduleItem[]): boolean {
  return scheduleSignature(prev) !== scheduleSignature(next)
}

export function sortedByDate<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.date.localeCompare(b.date))
}

/** Ne garde que les créneaux dont la date n'est pas encore passée (fuseau Europe/Paris). */
export function upcoming<T extends { date: string }>(items: T[], from = new Date()): T[] {
  const todayIso = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())).toISOString().slice(0, 10)
  return items.filter((i) => i.date.slice(0, 10) >= todayIso)
}

/** Libellé jour + date en français, ex. « Jeudi 24 Septembre ». */
export function formatScheduleDate(dateIso: string): string {
  const raw = new Date(dateIso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })
  return raw.replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase())
}

export function toDiscordItems(items: ScheduleItem[]): ScheduleItemForDiscord[] {
  return sortedByDate(items).map((i) => ({
    day: formatScheduleDate(i.date),
    time: i.time,
    title: displayTitle(i),
    icon: KIND_ICON[i.kind ?? 'game'] ?? '🎮',
    boxArtUrl: i.boxArtUrl ? boxArtHiRes(i.boxArtUrl) : i.boxArtUrl,
  }))
}

/**
 * Créneaux à venir, triés, prêts pour l'affichage public. La jaquette est toujours remise en
 * haute résolution ici (voir boxArtHiRes) : ça rattrape aussi les créneaux enregistrés avant
 * ce correctif, sans besoin de re-choisir la catégorie dans l'admin.
 */
export async function getUpcomingScheduleItems(): Promise<ScheduleItem[]> {
  const payload = await getPayloadClient()
  const doc = await payload.findGlobal({ slug: 'schedule', depth: 0 })
  return sortedByDate(upcoming(extractScheduleItems(doc))).map((i) => ({ ...i, boxArtUrl: i.boxArtUrl ? boxArtHiRes(i.boxArtUrl) : i.boxArtUrl }))
}
