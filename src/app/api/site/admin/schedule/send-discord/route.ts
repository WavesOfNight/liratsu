import { error, json, requireStaff } from '@/lib/api'
import { sendScheduleToDiscord } from '@/lib/discord'
import { extractScheduleItems, toDiscordItems } from '@/lib/schedule'

/** Envoi (ou renvoi) manuel du planning actuel sur Discord, depuis l'admin. */
export async function POST(req: Request) {
  const auth = await requireStaff(req, 'editor')
  if (auth instanceof Response) return auth
  const { payload } = auth
  const schedule = await payload.findGlobal({ slug: 'schedule', depth: 0 })
  const items = toDiscordItems(extractScheduleItems(schedule))
  if (!items.length) return error('Le planning est vide.')
  const r = await sendScheduleToDiscord(items)
  return r.ok ? json({ message: 'Planning envoyé sur Discord ✦' }) : error(r.error ?? 'Échec de l’envoi.', 502)
}
