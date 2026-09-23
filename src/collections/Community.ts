/**
 * Espace communauté : livre d'or, fanarts, sondages, annonces, téléchargements,
 * codes surprise, inscriptions « préviens-moi » et membres connectés via Twitch.
 * Tout contenu envoyé par le public est modéré a priori (statut « en attente »).
 */
import type { CollectionConfig } from 'payload'
import { anyone, approvedOrModerator, hasRole, isAdmin, isModerator, isStaff } from '@/access/roles'
import { moderationFields, stampModeration } from '@/fields/moderation'
import { revalidateCollection } from '@/hooks/revalidate'

const moderationHint = 'Astuce : la file « 🛡️ Modération » (menu de gauche) permet de valider plus vite, avec aperçu et alertes.'

export const Guestbook: CollectionConfig = {
  slug: 'guestbook',
  labels: { singular: 'Message du livre d’or', plural: 'Livre d’or' },
  admin: { group: 'Communauté', useAsTitle: 'name', defaultColumns: ['name', 'message', 'status', 'flags', 'createdAt'], description: moderationHint },
  access: { read: approvedOrModerator, create: isModerator, update: isModerator, delete: isModerator },
  hooks: { beforeChange: [stampModeration], afterChange: [revalidateCollection] },
  fields: [
    ...moderationFields,
    { name: 'name', label: 'Pseudo', type: 'text', required: true, maxLength: 40 },
    { name: 'message', label: 'Message', type: 'textarea', required: true, maxLength: 600 },
    {
      name: 'mood',
      label: 'Humeur',
      type: 'select',
      defaultValue: 'star',
      options: ['star', 'heart', 'fish', 'bubble', 'music'].map((v) => ({ label: v, value: v })),
    },
    { name: 'reply', label: 'Réponse de Liratsu', type: 'textarea' },
    { name: 'ipHash', type: 'text', admin: { hidden: true }, access: { read: ({ req }) => hasRole(req, 'moderator') } },
  ],
}

export const Fanarts: CollectionConfig = {
  slug: 'fanarts',
  labels: { singular: 'Fanart', plural: 'Fanarts' },
  admin: { group: 'Communauté', useAsTitle: 'title', defaultColumns: ['title', 'artist', 'status', 'flags', 'createdAt'], description: moderationHint },
  access: { read: approvedOrModerator, create: isModerator, update: isModerator, delete: isModerator },
  hooks: {
    beforeChange: [stampModeration],
    afterChange: [
      revalidateCollection,
      async ({ doc, previousDoc, operation, req }) => {
        // Email à l'artiste lorsqu'un modérateur valide ou refuse son fanart.
        if (operation !== 'update' || previousDoc?.status === doc.status || doc.status === 'pending') return doc
        const { notifyArtist } = await import('@/lib/moderation/notify')
        await notifyArtist(req.payload, doc.id, req).catch((err) => req.payload.logger.error({ err }, 'notifyArtist'))
        return doc
      },
    ],
  },
  // Le fichier n'est servi publiquement qu'une fois le fanart approuvé (règle read ci-dessus).
  // À l'envoi, l'image est ré-encodée (métadonnées EXIF / GPS supprimées) — voir /api/site/community/fanart.
  upload: {
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    imageSizes: [
      { name: 'thumb', width: 480, height: 480, position: 'centre' },
      { name: 'preview', width: 1200 },
    ],
    adminThumbnail: 'thumb',
  },
  fields: [
    ...moderationFields,
    { name: 'fileHash', type: 'text', index: true, admin: { hidden: true }, access: { read: ({ req }) => hasRole(req, 'moderator') } },
    { name: 'title', label: 'Titre', type: 'text', required: true, maxLength: 80 },
    { name: 'artist', label: 'Artiste', type: 'text', required: true, maxLength: 40 },
    { name: 'artistLink', label: 'Lien de l’artiste', type: 'text' },
    {
      name: 'licenseAccepted',
      label: 'Licence d’affichage accordée par l’auteur (retrait sur simple demande)',
      type: 'checkbox',
      required: true,
    },
    { name: 'contactEmail', label: 'Email (retrait/contact, non publié)', type: 'email', access: { read: ({ req }) => hasRole(req, 'moderator') } },
  ],
}

export const Polls: CollectionConfig = {
  slug: 'polls',
  labels: { singular: 'Sondage', plural: 'Sondages' },
  admin: { group: 'Communauté', useAsTitle: 'question' },
  access: { read: anyone, create: isModerator, update: isModerator, delete: isModerator },
  hooks: { afterChange: [revalidateCollection] },
  fields: [
    { name: 'question', type: 'text', required: true },
    { name: 'active', label: 'Ouvert au vote', type: 'checkbox', defaultValue: true },
    { name: 'closesAt', label: 'Fermeture', type: 'date' },
    {
      name: 'options',
      type: 'array',
      minRows: 2,
      maxRows: 8,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'votes', type: 'number', defaultValue: 0, admin: { readOnly: true } },
      ],
    },
  ],
}

export const PollVotes: CollectionConfig = {
  slug: 'poll-votes',
  labels: { singular: 'Vote', plural: 'Votes' },
  admin: { group: 'Communauté', hidden: ({ user }) => !user?.roles?.includes('admin') },
  access: { read: isAdmin, create: () => false, update: () => false, delete: isAdmin },
  indexes: [{ fields: ['poll', 'voterHash'], unique: true }],
  fields: [
    { name: 'poll', type: 'relationship', relationTo: 'polls', required: true },
    { name: 'voterHash', type: 'text', required: true },
    { name: 'option', type: 'number', required: true },
  ],
}

export const Announcements: CollectionConfig = {
  slug: 'announcements',
  labels: { singular: 'Annonce', plural: 'Annonces' },
  admin: { group: 'Communauté', useAsTitle: 'title' },
  access: { read: anyone, create: isStaff, update: isStaff, delete: isStaff },
  hooks: { afterChange: [revalidateCollection] },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'body', type: 'richText' },
    { name: 'pinned', label: 'Épinglée', type: 'checkbox' },
    { name: 'publishedAt', type: 'date', defaultValue: () => new Date().toISOString() },
  ],
}

export const Downloads: CollectionConfig = {
  slug: 'downloads',
  labels: { singular: 'Téléchargement', plural: 'Fonds d’écran & packs' },
  admin: { group: 'Communauté', useAsTitle: 'title', defaultColumns: ['title', 'kind', 'locked'] },
  access: { read: anyone, create: isStaff, update: isStaff, delete: isStaff },
  hooks: { afterChange: [revalidateCollection] },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'kind',
      label: 'Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Fond d’écran', value: 'wallpaper' },
        { label: 'Widget', value: 'widget' },
        { label: 'Pack d’emojis', value: 'emojis' },
        { label: 'Autre', value: 'other' },
      ],
    },
    { name: 'preview', label: 'Aperçu', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'files',
      label: 'Fichiers par format',
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'format',
              type: 'select',
              required: true,
              options: [
                { label: 'Téléphone', value: 'phone' },
                { label: 'Tablette', value: 'tablet' },
                { label: 'PC', value: 'desktop' },
                { label: 'Archive', value: 'zip' },
              ],
            },
            { name: 'file', type: 'upload', relationTo: 'protected-files', required: true },
          ],
        },
      ],
    },
    {
      name: 'locked',
      label: 'Contenu surprise (nécessite un code)',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}

export const SurpriseCodes: CollectionConfig = {
  slug: 'surprise-codes',
  labels: { singular: 'Code surprise', plural: 'Codes surprise' },
  admin: { group: 'Communauté', useAsTitle: 'code', defaultColumns: ['code', 'source', 'redemptions', 'active'] },
  access: { read: isModerator, create: isModerator, update: isModerator, delete: isModerator },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      hooks: { beforeValidate: [({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value)] },
    },
    {
      name: 'source',
      label: 'Origine',
      type: 'select',
      defaultValue: 'live',
      options: [
        { label: 'Donné en live', value: 'live' },
        { label: 'Easter egg', value: 'easterEgg' },
        { label: 'Mini-jeu', value: 'game' },
        { label: 'Autre', value: 'other' },
      ],
    },
    { name: 'unlocks', label: 'Débloque', type: 'relationship', relationTo: 'downloads', hasMany: true },
    { name: 'message', label: 'Message au déblocage', type: 'text', defaultValue: 'Bravo, tu as trouvé une surprise !' },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'expiresAt', label: 'Expire le', type: 'date' },
    { name: 'redemptions', label: 'Utilisations', type: 'number', defaultValue: 0, admin: { readOnly: true } },
  ],
}

export const NotifySignups: CollectionConfig = {
  slug: 'notify-signups',
  labels: { singular: 'Inscription « préviens-moi »', plural: 'Inscriptions « préviens-moi »' },
  admin: { group: 'Communauté', useAsTitle: 'email', defaultColumns: ['email', 'section', 'createdAt'] },
  access: { read: isStaff, create: () => false, update: () => false, delete: isStaff },
  fields: [
    { name: 'email', type: 'email', required: true },
    { name: 'section', type: 'text', required: true },
    { name: 'consentAt', type: 'date', required: true },
  ],
}

export const Members: CollectionConfig = {
  slug: 'members',
  labels: { singular: 'Membre (Twitch)', plural: 'Membres (Twitch)' },
  admin: { group: 'Communauté', useAsTitle: 'displayName' },
  access: { read: isModerator, create: () => false, update: isModerator, delete: isModerator },
  fields: [
    { name: 'twitchId', type: 'text', required: true, unique: true },
    { name: 'displayName', type: 'text', required: true },
    { name: 'avatarUrl', type: 'text' },
    { name: 'banned', label: 'Banni', type: 'checkbox' },
    { name: 'unlockedCodes', type: 'relationship', relationTo: 'surprise-codes', hasMany: true },
  ],
}

/**
 * Fichiers téléchargeables (fonds d'écran, packs…). Jamais servis directement :
 * le téléchargement passe par /api/site/download qui vérifie le déblocage éventuel.
 */
export const ProtectedFiles: CollectionConfig = {
  slug: 'protected-files',
  labels: { singular: 'Fichier protégé', plural: 'Fichiers téléchargeables' },
  admin: { group: 'Communauté', useAsTitle: 'filename' },
  access: { read: isStaff, create: isStaff, update: isStaff, delete: isStaff },
  upload: {
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/zip'],
  },
  fields: [{ name: 'label', type: 'text' }],
}
