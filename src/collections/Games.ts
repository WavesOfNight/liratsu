import type { CollectionConfig } from 'payload'
import { isEditor } from '@/access/roles'
import { revalidateCollection } from '@/hooks/revalidate'

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/**
 * Registre des bornes de l'Arcade. « The Ratsu » (moteur intégré) est une entrée comme
 * les autres ; on peut ajouter d'autres jeux « code personnalisé » : une page HTML/JS
 * autonome, collée ici, rendue dans une iframe isolée (sandbox, aucun accès aux cookies
 * ni au reste du site) — aucune installation, aucun accès serveur nécessaire.
 */
export const Games: CollectionConfig = {
  slug: 'games',
  labels: { singular: 'Jeu (borne d’arcade)', plural: 'Jeux (Arcade)' },
  admin: {
    group: 'Arcade',
    useAsTitle: 'title',
    defaultColumns: ['title', 'engine', 'status', 'order'],
    description:
      'Chaque jeu apparaît comme une borne sur /arcade. « Moteur intégré » = The Ratsu (réglages détaillés dans Réglages The Ratsu). « Code personnalisé » = ta propre page HTML/JS, injectée dans une iframe isolée.',
  },
  access: {
    read: ({ req }) => (isEditor({ req }) ? true : { status: { not_equals: 'off' } }),
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  hooks: { afterChange: [revalidateCollection] },
  fields: [
    { name: 'title', label: 'Titre', type: 'text', required: true },
    {
      name: 'slug',
      label: 'Adresse (/arcade/…)',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar' },
      hooks: { beforeValidate: [({ value, data }) => value || (data?.title ? slugify(data.title) : value)] },
    },
    {
      name: 'status',
      label: 'État',
      type: 'select',
      required: true,
      defaultValue: 'live',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Jouable', value: 'live' },
        { label: '« Bientôt ? »', value: 'soon' },
        { label: 'Masqué', value: 'off' },
      ],
    },
    { name: 'order', label: 'Ordre d’affichage', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    { name: 'tagline', label: 'Description courte (affichée sur la borne)', type: 'textarea' },
    { name: 'color', label: 'Couleur de la borne', type: 'text', defaultValue: '#3FA9F5', validate: (v: string | null | undefined) => !v || /^#[0-9a-fA-F]{6}$/.test(v) || 'Format : #RRGGBB' },
    { name: 'thumbnail', label: 'Vignette (optionnelle, sinon écran stylisé)', type: 'upload', relationTo: 'media' },
    {
      name: 'engine',
      label: 'Type de jeu',
      type: 'radio',
      required: true,
      defaultValue: 'ratsu',
      options: [
        { label: 'Moteur intégré — The Ratsu', value: 'ratsu' },
        { label: 'Code personnalisé (HTML/JS)', value: 'custom' },
      ],
    },
    {
      name: 'code',
      label: 'Code du jeu',
      type: 'code',
      admin: {
        language: 'html',
        condition: (data) => data?.engine === 'custom',
        description:
          'Page HTML autonome (balises <style>/<script> incluses). Rendue dans une iframe isolée : pas d’accès aux cookies ni aux données du site. Astuce : utilise window.parent.postMessage({type:\'liratsu:score\', score}, \'*\') si tu veux qu’on affiche le score (classement non certifié pour les jeux personnalisés).',
        editorOptions: { minimap: { enabled: false } },
      },
    },
  ],
}
