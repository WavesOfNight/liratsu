/**
 * Champs et hooks communs aux contenus modérés (livre d'or, fanarts) :
 * statut, alertes du filtre automatique, traçabilité (qui / quand), motif de refus.
 */
import type { CollectionBeforeChangeHook, Field } from 'payload'
import { hasRole } from '@/access/roles'

export const FLAG_OPTIONS = [
  { label: 'Insulte / propos interdit', value: 'insult' },
  { label: 'Vulgarité / mot surveillé', value: 'vulgar' },
  { label: 'Lien', value: 'link' },
  { label: 'Coordonnées perso', value: 'personal' },
  { label: 'Spam', value: 'spam' },
  { label: 'MAJUSCULES', value: 'caps' },
  { label: 'Mot personnalisé', value: 'custom' },
  { label: 'Doublon', value: 'duplicate' },
]

export const moderationFields: Field[] = [
  {
    name: 'status',
    label: 'Modération',
    type: 'select',
    required: true,
    defaultValue: 'pending',
    index: true,
    options: [
      { label: '⏳ En attente', value: 'pending' },
      { label: '✅ Approuvé', value: 'approved' },
      { label: '⛔ Refusé', value: 'rejected' },
    ],
    admin: { position: 'sidebar' },
  },
  {
    name: 'rejectionReason',
    label: 'Motif du refus',
    type: 'text',
    admin: { position: 'sidebar', condition: (data) => data?.status === 'rejected' },
  },
  {
    name: 'flags',
    label: 'Alertes automatiques',
    type: 'select',
    hasMany: true,
    options: FLAG_OPTIONS,
    admin: { position: 'sidebar', readOnly: true },
    access: { read: ({ req }) => hasRole(req, 'moderator') },
  },
  {
    name: 'flaggedTerms',
    label: 'Extraits signalés',
    type: 'text',
    admin: { position: 'sidebar', readOnly: true },
    access: { read: ({ req }) => hasRole(req, 'moderator') },
  },
  {
    name: 'moderatedBy',
    label: 'Modéré par',
    type: 'relationship',
    relationTo: 'users',
    admin: { position: 'sidebar', readOnly: true },
    access: { read: ({ req }) => hasRole(req, 'moderator') },
  },
  {
    name: 'moderatedAt',
    label: 'Modéré le',
    type: 'date',
    admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    access: { read: ({ req }) => hasRole(req, 'moderator') },
  },
]

/** Horodate la décision et note son auteur dès que le statut change (admin ou file de modération). */
export const stampModeration: CollectionBeforeChangeHook = ({ data, originalDoc, operation, req }) => {
  if (operation === 'update' && data.status && originalDoc?.status !== data.status && req.user?.collection === 'users') {
    data.moderatedBy = req.user.id
    data.moderatedAt = new Date().toISOString()
    if (data.status !== 'rejected') data.rejectionReason = null
  }
  return data
}
