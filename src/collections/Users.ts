import type { CollectionConfig } from 'payload'
import { hasRole, isAdmin, userRoles } from '@/access/roles'

/** Comptes de l'équipe (admin, Liratsu/éditrice, modérateurs). Les viewers n'ont pas de compte ici. */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Membre de l’équipe', plural: 'Équipe' },
  admin: {
    useAsTitle: 'email',
    group: 'Réglages',
    defaultColumns: ['name', 'email', 'roles', 'totpEnabled'],
  },
  auth: {
    tokenExpiration: 60 * 60 * 12,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  access: {
    // L'interface admin reste accessible pour permettre la saisie du code 2FA.
    admin: ({ req }) => userRoles(req.user as never).length > 0,
    read: ({ req }) => {
      if (hasRole(req, 'admin')) return true
      if (!req.user) return false
      return { id: { equals: req.user.id } }
    },
    create: isAdmin,
    update: ({ req }) => {
      if (hasRole(req, 'admin')) return true
      if (!req.user) return false
      return { id: { equals: req.user.id } }
    },
    delete: isAdmin,
  },
  fields: [
    { name: 'name', label: 'Nom affiché', type: 'text' },
    {
      name: 'roles',
      label: 'Rôles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['editor'],
      saveToJWT: true,
      options: [
        { label: 'Admin (tout)', value: 'admin' },
        { label: 'Liratsu / Éditrice (contenu + boutique)', value: 'editor' },
        { label: 'Modérateur (communauté)', value: 'moderator' },
      ],
      access: { update: ({ req }) => hasRole(req, 'admin'), create: ({ req }) => hasRole(req, 'admin') },
    },
    {
      type: 'collapsible',
      label: 'Double authentification (2FA)',
      fields: [
        {
          name: 'twoFactorPanel',
          type: 'ui',
          admin: { components: { Field: '@/components/admin/TwoFactorSetup#TwoFactorSetup' } },
        },
        {
          name: 'totpEnabled',
          label: '2FA activée',
          type: 'checkbox',
          defaultValue: false,
          saveToJWT: true,
          admin: { readOnly: true },
          access: { update: () => false, create: () => false },
        },
        {
          name: 'totpEnabledAt',
          type: 'date',
          saveToJWT: true,
          admin: { hidden: true },
          access: { update: () => false, create: () => false },
        },
        // Secret TOTP chiffré, jamais exposé (hidden) ; modifié uniquement via /api/site/2fa/*.
        { name: 'totpSecret', type: 'text', hidden: true },
        { name: 'totpPendingSecret', type: 'text', hidden: true },
      ],
    },
  ],
}
