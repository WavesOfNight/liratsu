import type { CollectionConfig } from 'payload'
import { anyone, isEditor } from '@/access/roles'

/**
 * Fichiers dédiés aux mini-jeux : sprites/tileset (images) et musiques d'ambiance (audio).
 * Séparé de la médiathèque générale pour garder « Médias » propre au contenu du site.
 */
export const GameAssets: CollectionConfig = {
  slug: 'game-assets',
  labels: { singular: 'Ressource de jeu', plural: 'Sprites & musiques (jeux)' },
  admin: { group: 'Arcade', useAsTitle: 'label', defaultColumns: ['label', 'kind', 'createdAt'] },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  upload: {
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'audio/mpeg', 'audio/ogg', 'audio/wav'],
    imageSizes: [{ name: 'thumb', width: 200, height: 200, position: 'centre' }],
    adminThumbnail: ({ doc }) => {
      const d = doc as { mimeType?: string; url?: string; sizes?: { thumb?: { url?: string } } }
      return String(d.mimeType ?? '').startsWith('image/') ? (d.sizes?.thumb?.url ?? d.url ?? null) : null
    },
  },
  fields: [
    { name: 'label', label: 'Nom', type: 'text', required: true },
    {
      name: 'kind',
      label: 'Type',
      type: 'select',
      required: true,
      defaultValue: 'sprite',
      options: [
        { label: 'Sprite / tileset (image)', value: 'sprite' },
        { label: 'Musique d’ambiance (audio)', value: 'music' },
      ],
    },
  ],
}
