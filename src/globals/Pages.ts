import type { Field, GlobalConfig } from 'payload'
import { anyone, isEditor } from '@/access/roles'
import { bioBlocks, homeBlocks } from '@/blocks'
import { revalidateAll } from '@/hooks/revalidate'

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
