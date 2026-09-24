import { z } from 'zod'
import { error, json, readJson, requireStaff } from '@/lib/api'
import { getIntegrations } from '@/lib/settings'
import { findVodForDate } from '@/lib/youtube'

/** Cherche (ou re-cherche) la VOD d'un ancien créneau, sur demande depuis l'admin. */
export async function POST(req: Request) {
  const auth = await requireStaff(req, 'editor')
  if (auth instanceof Response) return auth
  const { payload } = auth
  const body = await readJson(req, z.object({ id: z.union([z.number(), z.string()]) }))
  if (!body.ok) return body.res

  const doc = await payload.findByID({ collection: 'schedule-archive', id: body.data.id, depth: 0 }).catch(() => null)
  if (!doc) return error('Introuvable.', 404)
  const { youtube } = await getIntegrations()
  const found = await findVodForDate(youtube.vodChannelHandle, doc.date, doc.game).catch(() => null)
  if (!found) return json({ found: false, message: 'Aucune VOD correspondante trouvée pour l’instant (elle n’est peut-être pas encore en ligne, ou trop ancienne pour le flux). Tu peux coller le lien à la main.' })

  await payload.update({ collection: 'schedule-archive', id: doc.id, data: { vodUrl: found.url, vodTitle: found.title, vodFound: true } })
  return json({ found: true, url: found.url, title: found.title })
}
