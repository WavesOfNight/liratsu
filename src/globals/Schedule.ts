import type { GlobalAfterChangeHook, GlobalConfig } from 'payload'
import { anyone, isEditor } from '@/access/roles'
import { revalidateAll } from '@/hooks/revalidate'
import { extractScheduleItems, scheduleChanged } from '@/lib/schedule'
import { getIntegrations } from '@/lib/settings'
import { findVodForDate } from '@/lib/youtube'

/**
 * À chaque enregistrement : archive les créneaux passés qui ont disparu de la liste (avec
 * tentative de retrouver la VOD automatiquement). L'envoi sur Discord n'est PAS automatique
 * (pour ne pas spammer le salon à chaque petit ajustement) : c'est le bouton « Envoyer sur
 * Discord » ci-dessous qui déclenche l'envoi, volontairement. N'importe quelle erreur ici est
 * journalisée mais ne doit jamais empêcher l'enregistrement.
 */
const onScheduleChange: GlobalAfterChangeHook = async ({ doc, previousDoc, req }) => {
  try {
    const prevItems = extractScheduleItems(previousDoc)
    const nextItems = extractScheduleItems(doc)
    if (!scheduleChanged(prevItems, nextItems)) return doc

    const nextIds = new Set(nextItems.map((i) => i.id).filter(Boolean))
    const removed = prevItems.filter((i) => !i.id || !nextIds.has(i.id))
    if (removed.length) {
      const { youtube } = await getIntegrations()
      for (const item of removed) {
        const archived = await req.payload.create({
          collection: 'schedule-archive',
          data: {
            date: item.date,
            title: item.title,
            game: item.game || undefined,
            boxArtUrl: item.boxArtUrl || undefined,
            kind: (item.kind || 'game') as 'game' | 'art' | 'music' | 'chat',
          },
          overrideAccess: true,
        })
        const found = await findVodForDate(youtube.vodChannelHandle, item.date, item.game).catch(() => null)
        if (found) await req.payload.update({ collection: 'schedule-archive', id: archived.id, data: { vodUrl: found.url, vodTitle: found.title, vodFound: true }, overrideAccess: true })
      }
    }
  } catch (err) {
    req.payload.logger.error({ err }, 'onScheduleChange')
  }
  return doc
}

export const Schedule: GlobalConfig = {
  slug: 'schedule',
  label: 'Planning',
  admin: {
    group: 'Pages',
    description: 'Les prochains streams, avec une vraie date (pas juste un jour de la semaine). Un créneau retiré de cette liste une fois sa date passée part automatiquement dans « Anciens plannings ».',
  },
  access: { read: anyone, update: isEditor },
  hooks: { afterChange: [revalidateAll, onScheduleChange] },
  fields: [
    {
      name: 'discordAction',
      type: 'ui',
      admin: { components: { Field: '@/components/admin/SendScheduleToDiscord#SendScheduleToDiscord' } },
    },
    {
      name: 'items',
      label: 'Prochains streams',
      type: 'array',
      admin: { description: 'Trié automatiquement par date (le plus proche en premier) sur le site.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'date', label: 'Date du stream', type: 'date', required: true, admin: { width: '35%', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } } },
            { name: 'time', label: 'Heure', type: 'text', required: true, admin: { width: '25%', placeholder: '20h30' } },
            {
              name: 'kind',
              label: 'Type',
              type: 'select',
              defaultValue: 'game',
              admin: { width: '40%' },
              options: [
                { label: 'Jeu vidéo', value: 'game' },
                { label: 'Dessin', value: 'art' },
                { label: 'Musique', value: 'music' },
                { label: 'Discussion', value: 'chat' },
              ],
            },
          ],
        },
        { name: 'title', label: 'Programme (affiché sur la carte)', type: 'text', required: true, admin: { placeholder: 'Ex. Soirée dessin chill' } },
        {
          type: 'row',
          fields: [
            {
              name: 'game',
              label: 'Catégorie Twitch (pour la miniature officielle)',
              type: 'text',
              admin: {
                width: '60%',
                placeholder: 'Ex. The Binding of Isaac, Just Chatting, Art…',
                description: 'Cherche n’importe quelle catégorie Twitch : un jeu, mais aussi « Just Chatting », « Art », « Music »… Laisse vide pour garder une simple icône.',
                components: { Field: '@/components/admin/GamePicker#GamePicker' },
              },
            },
            { name: 'boxArtUrl', label: 'Miniature (auto)', type: 'text', admin: { width: '40%', readOnly: true } },
          ],
        },
      ],
    },
  ],
}
