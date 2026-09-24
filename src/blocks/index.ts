/**
 * Blocs de contenu réordonnables utilisés par les pages Accueil et Biographie.
 * Chaque bloc a un rendu dédié dans src/components/blocks/.
 */
import type { Block, Field } from 'payload'

const windowTitle: Field = {
  name: 'windowTitle',
  label: 'Titre de la fenêtre',
  type: 'text',
  admin: { description: 'Texte de la barre de titre façon fenêtre aero (optionnel).' },
}

export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Heros' },
  fields: [
    { name: 'tagline', label: 'Accroche', type: 'text', defaultValue: 'Dessin · Musique · Jeu vidéo' },
    { name: 'intro', label: 'Présentation', type: 'textarea' },
    { name: 'ctaLabel', label: 'Bouton', type: 'text', defaultValue: 'Regarder le live' },
    { name: 'ctaUrl', label: 'Lien du bouton', type: 'text', defaultValue: 'https://www.twitch.tv/liratsu' },
    { name: 'showAvatar', label: 'Afficher l’avatar', type: 'checkbox', defaultValue: true },
  ],
}

export const LiveStatusBlock: Block = {
  slug: 'liveStatus',
  labels: { singular: 'Statut live Twitch', plural: 'Statuts live' },
  fields: [
    windowTitle,
    { name: 'showPlayer', label: 'Intégrer le player quand elle est en live', type: 'checkbox', defaultValue: true },
    { name: 'offlineText', label: 'Texte hors live', type: 'text', defaultValue: 'Liratsu n’est pas en live pour le moment… viens faire un tour sur le planning !' },
  ],
}

export const ScheduleBlock: Block = {
  slug: 'schedule',
  labels: { singular: 'Planning', plural: 'Plannings' },
  fields: [
    windowTitle,
    {
      name: 'source',
      label: 'Source',
      type: 'select',
      defaultValue: 'auto',
      options: [
        { label: 'Twitch, puis saisie manuelle si indisponible', value: 'auto' },
        { label: 'Saisie manuelle uniquement', value: 'manual' },
      ],
    },
    {
      name: 'discordAction',
      type: 'ui',
      admin: { components: { Field: '@/components/admin/SendScheduleToDiscord#SendScheduleToDiscord' } },
    },
    {
      name: 'manual',
      label: 'Planning manuel',
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'day',
              label: 'Jour',
              type: 'select',
              required: true,
              options: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((d) => ({ label: d, value: d })),
            },
            { name: 'time', label: 'Heure', type: 'text', required: true, admin: { placeholder: '20h30' } },
            { name: 'title', label: 'Programme', type: 'text', required: true },
            {
              name: 'kind',
              label: 'Type',
              type: 'select',
              defaultValue: 'game',
              options: [
                { label: 'Jeu vidéo', value: 'game' },
                { label: 'Dessin', value: 'art' },
                { label: 'Musique', value: 'music' },
                { label: 'Discussion', value: 'chat' },
              ],
            },
          ],
        },
        {
          type: 'row',
          admin: { condition: (_, siblingData) => siblingData?.kind === 'game' },
          fields: [
            {
              name: 'game',
              label: 'Jeu (recherche la miniature officielle)',
              type: 'text',
              admin: { width: '60%', components: { Field: '@/components/admin/GamePicker#GamePicker' } },
            },
            { name: 'boxArtUrl', label: 'Miniature (auto)', type: 'text', admin: { width: '40%', readOnly: true } },
          ],
        },
      ],
    },
  ],
}

export const ClipsBlock: Block = {
  slug: 'clips',
  labels: { singular: 'Derniers clips Twitch', plural: 'Clips Twitch' },
  fields: [windowTitle, { name: 'count', label: 'Nombre', type: 'number', defaultValue: 6, min: 1, max: 12 }],
}

export const YouTubeBlock: Block = {
  slug: 'youtube',
  labels: { singular: 'Dernières vidéos YouTube', plural: 'Vidéos YouTube' },
  fields: [windowTitle, { name: 'count', label: 'Nombre', type: 'number', defaultValue: 4, min: 1, max: 12 }],
}

export const SocialPostsBlock: Block = {
  slug: 'socialPosts',
  labels: { singular: 'Posts Instagram/TikTok', plural: 'Posts réseaux' },
  fields: [
    windowTitle,
    {
      name: 'posts',
      label: 'Posts mis en avant',
      type: 'array',
      maxRows: 12,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'network',
              label: 'Réseau',
              type: 'select',
              required: true,
              options: [
                { label: 'Instagram', value: 'instagram' },
                { label: 'TikTok', value: 'tiktok' },
              ],
            },
            { name: 'url', label: 'URL du post', type: 'text', required: true },
          ],
        },
        { name: 'thumbnail', label: 'Miniature', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', label: 'Légende', type: 'text' },
      ],
    },
  ],
}

export const SocialGridBlock: Block = {
  slug: 'socialGrid',
  labels: { singular: 'Grille réseaux (icônes de bureau)', plural: 'Grilles réseaux' },
  fields: [windowTitle],
}

export const CommunityGoalBlock: Block = {
  slug: 'communityGoal',
  labels: { singular: 'Objectif communautaire', plural: 'Objectifs communautaires' },
  fields: [
    windowTitle,
    { name: 'label', label: 'Objectif', type: 'text', required: true, defaultValue: 'Objectif subs' },
    {
      type: 'row',
      fields: [
        { name: 'current', label: 'Valeur actuelle', type: 'number', required: true, defaultValue: 0 },
        { name: 'target', label: 'Objectif', type: 'number', required: true, defaultValue: 100 },
      ],
    },
    { name: 'reward', label: 'Récompense annoncée', type: 'text' },
  ],
}

export const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'Texte', plural: 'Textes' },
  fields: [
    windowTitle,
    { name: 'content', label: 'Contenu', type: 'richText', required: true },
    { name: 'plain', label: 'Sans fenêtre (texte simple)', type: 'checkbox', defaultValue: false },
  ],
}

export const ImageBlock: Block = {
  slug: 'image',
  labels: { singular: 'Image', plural: 'Images' },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', label: 'Légende', type: 'text' },
    {
      name: 'style',
      label: 'Style',
      type: 'select',
      defaultValue: 'polaroid',
      options: [
        { label: 'Polaroid sticker', value: 'polaroid' },
        { label: 'Fenêtre aero', value: 'window' },
        { label: 'Pleine largeur', value: 'full' },
      ],
    },
  ],
}

export const GalleryBlock: Block = {
  slug: 'gallery',
  labels: { singular: 'Galerie', plural: 'Galeries' },
  fields: [
    windowTitle,
    {
      name: 'images',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', label: 'Légende', type: 'text' },
      ],
    },
  ],
}

export const TimelineBlock: Block = {
  slug: 'timeline',
  labels: { singular: 'Frise chronologique', plural: 'Frises' },
  fields: [
    windowTitle,
    {
      name: 'events',
      label: 'Étapes',
      type: 'array',
      minRows: 1,
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'date', label: 'Date / période', type: 'text', required: true },
            {
              name: 'icon',
              label: 'Icône',
              type: 'select',
              defaultValue: 'star',
              options: ['star', 'bubble', 'heart', 'pencil', 'note', 'gamepad', 'fish'].map((v) => ({ label: v, value: v })),
            },
          ],
        },
        { name: 'title', label: 'Titre', type: 'text', required: true },
        { name: 'text', label: 'Texte', type: 'textarea' },
      ],
    },
  ],
}

export const ProfileCardBlock: Block = {
  slug: 'profileCard',
  labels: { singular: 'Fiche perso (profil messagerie rétro)', plural: 'Fiches perso' },
  fields: [
    windowTitle,
    { name: 'displayName', label: 'Pseudo affiché', type: 'text', defaultValue: '✿ Liratsu ✿' },
    { name: 'mood', label: 'Humeur du moment', type: 'text', defaultValue: 'en train de dessiner avec un lo-fi dans les oreilles ♪' },
    {
      name: 'presence',
      label: 'Statut',
      type: 'select',
      defaultValue: 'online',
      options: [
        { label: 'En ligne', value: 'online' },
        { label: 'Occupée', value: 'busy' },
        { label: 'Absente', value: 'away' },
      ],
    },
    { name: 'avatar', type: 'upload', relationTo: 'media' },
    {
      name: 'facts',
      label: 'Infos',
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', label: 'Libellé', type: 'text', required: true, admin: { placeholder: 'Jeux préférés' } },
            { name: 'value', label: 'Valeur', type: 'text', required: true },
          ],
        },
      ],
    },
  ],
}

export const homeBlocks: Block[] = [
  HeroBlock,
  LiveStatusBlock,
  ScheduleBlock,
  ClipsBlock,
  YouTubeBlock,
  SocialPostsBlock,
  SocialGridBlock,
  CommunityGoalBlock,
  RichTextBlock,
  ImageBlock,
]

export const bioBlocks: Block[] = [RichTextBlock, ImageBlock, GalleryBlock, TimelineBlock, ProfileCardBlock, CommunityGoalBlock]
