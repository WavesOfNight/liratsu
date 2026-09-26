import type { CollectionConfig } from 'payload'
import { isAdmin, isModerator } from '@/access/roles'

/** Parties démarrées : sert à valider la durée réelle d'une partie (anti-triche basique). */
export const GameSessions: CollectionConfig = {
  slug: 'game-sessions',
  labels: { singular: 'Partie', plural: 'Parties' },
  admin: { group: 'Arcade', hidden: ({ user }) => !user?.roles?.includes('admin'), defaultColumns: ['game', 'seed', 'startedAt', 'used'] },
  access: { read: isAdmin, create: () => false, update: () => false, delete: isAdmin },
  fields: [
    { name: 'game', type: 'text', required: true },
    { name: 'seed', type: 'text', required: true },
    { name: 'daily', type: 'checkbox' },
    { name: 'startedAt', type: 'date', required: true },
    { name: 'used', type: 'checkbox', defaultValue: false },
    { name: 'ipHash', type: 'text' },
  ],
}

export const Scores: CollectionConfig = {
  slug: 'scores',
  labels: { singular: 'Score', plural: 'Classement' },
  admin: {
    group: 'Arcade',
    useAsTitle: 'nickname',
    defaultColumns: ['nickname', 'score', 'floor', 'daily', 'seed', 'hidden', 'createdAt'],
    components: { beforeList: ['@/components/admin/LeaderboardReset#LeaderboardReset'] },
  },
  access: {
    read: ({ req }) => (isModerator({ req }) ? true : { hidden: { not_equals: true } }),
    create: () => false,
    update: isModerator,
    delete: isModerator,
  },
  fields: [
    { name: 'game', type: 'text', required: true, defaultValue: 'the-ratsu', index: true },
    { name: 'nickname', label: 'Pseudo', type: 'text', required: true },
    { name: 'member', label: 'Membre (compte Twitch)', type: 'relationship', relationTo: 'members', admin: { readOnly: true } },
    { name: 'score', type: 'number', required: true, index: true },
    { name: 'floor', label: 'Étage', type: 'number', required: true },
    { name: 'won', label: 'Victoire', type: 'checkbox' },
    { name: 'durationMs', label: 'Durée (ms)', type: 'number' },
    { name: 'seed', type: 'text' },
    { name: 'daily', label: 'Défi du jour', type: 'checkbox', index: true },
    { name: 'hidden', label: 'Masqué (modération)', type: 'checkbox', defaultValue: false },
  ],
}

/** Journal d'activité : qui a modifié quoi dans l'admin. Alimenté automatiquement. */
export const ActivityLog: CollectionConfig = {
  slug: 'activity-log',
  labels: { singular: 'Activité', plural: 'Journal d’activité' },
  admin: { group: 'Réglages', useAsTitle: 'summary', defaultColumns: ['summary', 'user', 'createdAt'] },
  access: { read: isAdmin, create: () => false, update: () => false, delete: isAdmin },
  fields: [
    { name: 'summary', type: 'text', required: true },
    { name: 'user', type: 'relationship', relationTo: 'users' },
    { name: 'entity', type: 'text' },
    { name: 'entityId', type: 'text' },
    { name: 'operation', type: 'text' },
  ],
}

