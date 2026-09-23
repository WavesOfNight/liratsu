import type { GlobalConfig } from 'payload'
import { isModerator, isStaff } from '@/access/roles'

export const DEFAULT_REJECTION_REASONS = [
  'Contenu inapproprié',
  'Hors sujet / ce n’est pas un fanart',
  'Image illisible ou de trop mauvaise qualité',
  'L’œuvre ne semble pas être la tienne',
  'Doublon d’un envoi précédent',
  'Informations personnelles visibles',
]

/**
 * Réglages de la modération (livre d'or, fanarts) : filtre automatique de texte,
 * domaines autorisés, listes de mots, motifs de refus, notifications.
 */
export const ModerationSettings: GlobalConfig = {
  slug: 'moderation-settings',
  label: 'Réglages de modération',
  admin: {
    group: 'Communauté',
    description: 'Le filtre automatique bloque ou signale les messages ; les modérateurs valident ensuite dans « Modération ».',
  },
  access: { read: isStaff, update: isModerator },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Filtre de texte',
          fields: [
            {
              name: 'links',
              label: 'Liens vers des sites non autorisés',
              type: 'radio',
              defaultValue: 'block',
              options: [
                { label: 'Refuser le message', value: 'block' },
                { label: 'Accepter mais signaler aux modérateurs', value: 'review' },
                { label: 'Autoriser', value: 'allow' },
              ],
            },
            {
              name: 'allowedDomains',
              label: 'Domaines autorisés (un par ligne, sous-domaines inclus)',
              type: 'textarea',
              defaultValue: 'liratsu.fr\ntwitch.tv\nyoutube.com\nyoutu.be\ninstagram.com\ntiktok.com',
            },
            {
              name: 'blockPersonal',
              label: 'Refuser les emails et numéros de téléphone (protection des plus jeunes)',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'blockedWords',
              label: 'Mots / expressions interdits en plus de la liste intégrée (refus immédiat)',
              type: 'textarea',
              admin: { description: 'Un par ligne. Les variantes (majuscules, accents, l33t « s4l0p3 », lettres espacées) sont détectées automatiquement.' },
            },
            {
              name: 'watchedWords',
              label: 'Mots à surveiller (message accepté mais signalé)',
              type: 'textarea',
              admin: { description: 'Un par ligne. Pratique pour les spoilers, les pseudos de trolls connus, etc.' },
            },
            {
              name: 'autoApproveClean',
              label: 'Publier automatiquement les messages du livre d’or sans aucune alerte',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Désactivé par défaut : tous les messages passent par un modérateur (modération a priori).' },
            },
          ],
        },
        {
          label: 'Fanarts',
          fields: [
            { name: 'rejectDuplicates', label: 'Refuser automatiquement une image déjà envoyée', type: 'checkbox', defaultValue: true },
            {
              name: 'emailArtist',
              label: 'Prévenir l’artiste par email (s’il en a laissé un) quand son fanart est validé ou refusé',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'rejectionReasons',
              label: 'Motifs de refus proposés',
              type: 'array',
              defaultValue: DEFAULT_REJECTION_REASONS.map((label) => ({ label })),
              fields: [{ name: 'label', type: 'text', required: true }],
            },
          ],
        },
        {
          label: 'Notifications',
          fields: [
            { name: 'notify', label: 'Envoyer un email à chaque nouvel envoi à modérer', type: 'checkbox', defaultValue: true },
            {
              name: 'notifyEmails',
              label: 'Adresses à prévenir (séparées par des virgules)',
              type: 'text',
              admin: { description: 'Vide = adresse « Email de notification interne » des réglages SMTP.' },
            },
          ],
        },
      ],
    },
  ],
}
