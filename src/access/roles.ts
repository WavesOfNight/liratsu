/**
 * Rôles et contrôle d'accès.
 * - admin : tout
 * - editor (Liratsu / éditrice) : contenu + boutique
 * - moderator : communauté uniquement
 *
 * Toutes les vérifications passent par `hasRole`, qui impose aussi la validation 2FA
 * pour les comptes l'ayant activée (voir src/lib/twoFactor.ts).
 */
import type { Access, FieldAccess, PayloadRequest } from 'payload'
import { isTwoFactorSatisfied } from '@/lib/twoFactor'

export type Role = 'admin' | 'editor' | 'moderator'

type MaybeUser = { collection?: string; roles?: Role[] | null } | null | undefined

export function userRoles(user: MaybeUser): Role[] {
  if (!user || (user.collection && user.collection !== 'users')) return []
  return user.roles ?? []
}

export function hasRole(req: PayloadRequest, ...roles: Role[]): boolean {
  const current = userRoles(req.user as MaybeUser)
  if (current.length === 0) return false
  if (!isTwoFactorSatisfied(req)) return false
  return current.includes('admin') || roles.some((r) => current.includes(r))
}

export const isAdmin: Access = ({ req }) => hasRole(req, 'admin')
export const isEditor: Access = ({ req }) => hasRole(req, 'editor')
export const isModerator: Access = ({ req }) => hasRole(req, 'moderator')
export const isStaff: Access = ({ req }) => hasRole(req, 'editor', 'moderator')
export const anyone: Access = () => true

export const adminFieldOnly: FieldAccess = ({ req }) => hasRole(req, 'admin')
export const editorFieldOnly: FieldAccess = ({ req }) => hasRole(req, 'editor')

/** Lecture publique des documents publiés, lecture complète pour l'équipe. */
export const publishedOrRole =
  (...roles: Role[]): Access =>
  ({ req }) => {
    if (hasRole(req, ...roles)) return true
    return { _status: { equals: 'published' } }
  }

/** Lecture publique des éléments approuvés uniquement (livre d'or, fanarts…). */
export const approvedOrModerator: Access = ({ req }) => {
  if (hasRole(req, 'moderator')) return true
  return { status: { equals: 'approved' } }
}
