import type { CollectionConfig } from 'payload'
import { anyone, isStaff } from '@/access/roles'

/** Médiathèque (images du site, produits, fonds d'écran…). Uploads filtrés par type et taille. */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Média', plural: 'Médias' },
  admin: { group: 'Contenu' },
  access: { read: anyone, create: isStaff, update: isStaff, delete: isStaff },
  upload: {
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml', 'application/pdf', 'application/zip'],
    imageSizes: [
      { name: 'thumb', width: 400, height: 400, position: 'centre' },
      { name: 'card', width: 900 },
      { name: 'wide', width: 1800 },
    ],
    adminThumbnail: 'thumb',
  },
  fields: [
    { name: 'alt', label: 'Texte alternatif (accessibilité)', type: 'text', required: true },
    { name: 'credit', label: 'Crédit / auteur', type: 'text' },
  ],
}
