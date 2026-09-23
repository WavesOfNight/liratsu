import type { Field, GlobalConfig } from 'payload'
import { anyone, isEditor } from '@/access/roles'
import { revalidateAll } from '@/hooks/revalidate'

export const SECTION_KEYS = ['home', 'biography', 'community', 'shop', 'arcade', 'links'] as const
export type SectionKey = (typeof SECTION_KEYS)[number]

const SECTION_LABELS: Record<SectionKey, string> = {
  home: 'Accueil',
  biography: 'Biographie',
  community: 'Espace communauté',
  shop: 'Boutique',
  arcade: 'Arcade / mini-jeux',
  links: 'Liens',
}

const DEFAULT_STATUS: Record<SectionKey, 'on' | 'off' | 'soon'> = {
  home: 'on',
  biography: 'on',
  community: 'soon',
  shop: 'soon',
  arcade: 'on',
  links: 'on',
}

const sectionGroup = (key: SectionKey): Field => ({
  name: key,
  label: SECTION_LABELS[key],
  type: 'group',
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          label: 'État',
          type: 'select',
          required: true,
          defaultValue: DEFAULT_STATUS[key],
          options: [
            { label: 'Activée', value: 'on' },
            { label: 'Désactivée (404)', value: 'off' },
            { label: '« Bientôt ? » (page teaser)', value: 'soon' },
          ],
        },
        { name: 'showInMenu', label: 'Afficher dans le menu', type: 'checkbox', defaultValue: true },
      ],
    },
    { name: 'menuLabel', label: 'Libellé du menu', type: 'text', defaultValue: SECTION_LABELS[key] },
    { name: 'teaserText', label: 'Texte du teaser « Bientôt ? »', type: 'textarea' },
    { name: 'notifyForm', label: 'Formulaire « préviens-moi » sur le teaser', type: 'checkbox', defaultValue: true },
  ],
})

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Réglages du site',
  admin: { group: 'Réglages' },
  access: { read: anyone, update: isEditor },
  hooks: { afterChange: [revalidateAll] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Identité & SEO',
          fields: [
            { name: 'siteName', label: 'Nom du site', type: 'text', required: true, defaultValue: 'Liratsu' },
            { name: 'siteUrl', label: 'URL publique', type: 'text', required: true, defaultValue: 'https://liratsu.fr' },
            { name: 'tagline', label: 'Accroche', type: 'text', defaultValue: 'Dessin · Musique · Jeu vidéo' },
            {
              name: 'metaDescription',
              label: 'Description (SEO)',
              type: 'textarea',
              defaultValue:
                'Site officiel de Liratsu, streameuse Twitch passionnée de dessin, de musique et de jeu vidéo : lives, biographie, espace communauté, boutique et mini-jeux.',
            },
            { name: 'ogImage', label: 'Image de partage (Open Graph)', type: 'upload', relationTo: 'media' },
            { name: 'avatar', label: 'Avatar de Liratsu', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          label: 'Réseaux',
          fields: [
            { name: 'twitch', type: 'text', defaultValue: 'https://www.twitch.tv/liratsu' },
            { name: 'youtube', type: 'text', admin: { description: 'URL de la chaîne YouTube (à renseigner).' } },
            { name: 'instagram', type: 'text', defaultValue: 'https://www.instagram.com/liratsu/' },
            { name: 'tiktok', type: 'text', defaultValue: 'https://www.tiktok.com/@liratsu_' },
            { name: 'discord', type: 'text', defaultValue: 'https://discord.gg/aHWbGZH6g2' },
          ],
        },
        {
          label: 'Sections',
          description: 'Activer, désactiver ou passer chaque section en mode « Bientôt ? ».',
          fields: SECTION_KEYS.map(sectionGroup),
        },
        {
          label: 'Pied de page',
          fields: [
            { name: 'footerText', label: 'Texte du pied de page', type: 'text', defaultValue: '© Liratsu · Fait avec des bulles' },
            { name: 'devCredit', label: 'Crédit développeur', type: 'text', defaultValue: 'Codé par El Technico Lionel' },
            { name: 'publisherCredit', label: 'Mention éditeur', type: 'text', defaultValue: 'Site édité par Reads Records' },
          ],
        },
      ],
    },
  ],
}
