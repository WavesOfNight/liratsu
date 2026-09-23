import type { CollectionConfig } from 'payload'
import { hasRole, isAdmin } from '@/access/roles'
import { revalidateCollection } from '@/hooks/revalidate'

/**
 * Pages juridiques (mentions légales, CGU, CGV, confidentialité, cookies).
 * Textes saisis dans l'admin, avec historique des versions et brouillons.
 * Les variables {{editeur.nom}}, {{hebergeur.adresse}}… sont remplacées à l'affichage
 * par les valeurs du global « Identité légale ».
 */
export const LegalPages: CollectionConfig = {
  slug: 'legal-pages',
  labels: { singular: 'Page légale', plural: 'Pages légales' },
  admin: {
    group: 'Légal',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'lastUpdated', '_status'],
    description: 'Pages juridiques gérées par Reads Records. Chaque enregistrement crée une version consultable.',
  },
  access: {
    read: ({ req }) => (hasRole(req, 'editor') ? true : { _status: { equals: 'published' } }),
    create: isAdmin,
    update: ({ req }) => hasRole(req, 'editor'),
    delete: isAdmin,
  },
  versions: { maxPerDoc: 100, drafts: true },
  hooks: {
    afterChange: [revalidateCollection],
    beforeChange: [
      ({ data, originalDoc }) => {
        // Date de mise à jour automatique si le contenu change (modifiable manuellement).
        if (data && originalDoc && JSON.stringify(data.content) !== JSON.stringify(originalDoc.content) && !data.keepDate) {
          data.lastUpdated = new Date().toISOString()
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'title', label: 'Titre', type: 'text', required: true },
    {
      name: 'slug',
      label: 'Adresse',
      type: 'select',
      required: true,
      unique: true,
      options: [
        { label: '/legal/mentions-legales', value: 'mentions-legales' },
        { label: '/legal/cgu', value: 'cgu' },
        { label: '/legal/cgv', value: 'cgv' },
        { label: '/legal/confidentialite', value: 'confidentialite' },
        { label: '/legal/cookies', value: 'cookies' },
      ],
    },
    { name: 'lastUpdated', label: 'Dernière mise à jour', type: 'date', admin: { position: 'sidebar', date: { displayFormat: 'dd/MM/yyyy' } } },
    { name: 'keepDate', label: 'Ne pas changer la date (correction mineure)', type: 'checkbox', virtual: true, admin: { position: 'sidebar' } },
    { name: 'showIdentity', label: 'Afficher le bloc d’identification éditeur/hébergeur', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'content', label: 'Contenu', type: 'richText', required: true },
  ],
}

