import type { Field, GlobalConfig, GlobalAfterChangeHook } from 'payload'
import { anyone, isEditor } from '@/access/roles'
import { bioBlocks, homeBlocks } from '@/blocks'
import { revalidateAll } from '@/hooks/revalidate'
import { sendScheduleToDiscord } from '@/lib/discord'
import { extractManualSchedule, lastOccurrenceOf, scheduleChanged, toDiscordItems } from '@/lib/schedule'
import { getIntegrations } from '@/lib/settings'
import { findVodForDate } from '@/lib/youtube'

/**
 * À chaque enregistrement de la page Accueil : si le planning manuel a changé, on
 * (1) archive les anciennes cases (avec tentative de retrouver la VOD automatiquement)
 * et (2) envoie le nouveau planning sur Discord. N'importe quelle erreur ici est
 * journalisée mais ne doit jamais empêcher l'enregistrement de la page.
 */
const onScheduleChange: GlobalAfterChangeHook = async ({ doc, previousDoc, req }) => {
  try {
    const prevItems = extractManualSchedule(previousDoc)
    const nextItems = extractManualSchedule(doc)
    if (!scheduleChanged(prevItems, nextItems)) return doc

    if (prevItems.length) {
      const { youtube } = await getIntegrations()
      for (const item of prevItems) {
        const date = lastOccurrenceOf(item.day)
        const archived = await req.payload.create({
          collection: 'schedule-archive',
          data: { date, title: item.title, game: item.game || undefined, boxArtUrl: item.boxArtUrl || undefined, kind: (item.kind || 'game') as 'game' | 'art' | 'music' | 'chat' },
          overrideAccess: true,
        })
        const found = await findVodForDate(youtube.vodChannelHandle, date, item.game).catch(() => null)
        if (found) await req.payload.update({ collection: 'schedule-archive', id: archived.id, data: { vodUrl: found.url, vodTitle: found.title, vodFound: true }, overrideAccess: true })
      }
    }

    const discordItems = toDiscordItems(nextItems)
    if (discordItems.length) await sendScheduleToDiscord(discordItems)
  } catch (err) {
    req.payload.logger.error({ err }, 'onScheduleChange')
  }
  return doc
}

const seo: Field = {
  name: 'seo',
  label: 'SEO',
  type: 'group',
  fields: [
    { name: 'title', label: 'Titre (balise title)', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'image', label: 'Image de partage', type: 'upload', relationTo: 'media' },
  ],
}

const common = {
  access: { read: anyone, update: isEditor },
  hooks: { afterChange: [revalidateAll] },
  versions: { max: 30, drafts: false },
} satisfies Partial<GlobalConfig>

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Page Accueil',
  admin: { group: 'Pages' },
  ...common,
  hooks: { afterChange: [revalidateAll, onScheduleChange] },
  fields: [{ name: 'layout', label: 'Blocs', type: 'blocks', blocks: homeBlocks }, seo],
}

export const BiographyPage: GlobalConfig = {
  slug: 'biography-page',
  label: 'Page Biographie',
  admin: { group: 'Pages' },
  ...common,
  fields: [
    { name: 'title', label: 'Titre', type: 'text', defaultValue: 'Biographie' },
    { name: 'intro', label: 'Chapeau', type: 'textarea' },
    { name: 'layout', label: 'Blocs', type: 'blocks', blocks: bioBlocks },
    seo,
  ],
}

export const LinksPage: GlobalConfig = {
  slug: 'links-page',
  label: 'Page Liens',
  admin: { group: 'Pages' },
  ...common,
  fields: [
    { name: 'title', label: 'Titre', type: 'text', defaultValue: 'Tous mes liens' },
    { name: 'subtitle', label: 'Sous-titre', type: 'text', defaultValue: 'Viens dire coucou partout ✦' },
    {
      name: 'links',
      label: 'Liens',
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', label: 'Texte', type: 'text', required: true },
            { name: 'url', label: 'URL', type: 'text', required: true },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'icon',
              label: 'Icône',
              type: 'select',
              defaultValue: 'star',
              options: ['twitch', 'youtube', 'instagram', 'tiktok', 'discord', 'shop', 'star', 'bubble', 'heart', 'gamepad', 'mail'].map((v) => ({
                label: v,
                value: v,
              })),
            },
            {
              name: 'color',
              label: 'Couleur',
              type: 'select',
              defaultValue: 'aero',
              options: ['aero', 'lagoon', 'candy', 'lime', 'star', 'deep'].map((v) => ({ label: v, value: v })),
            },
            { name: 'highlight', label: 'Mis en avant', type: 'checkbox' },
          ],
        },
      ],
    },
    seo,
  ],
}
