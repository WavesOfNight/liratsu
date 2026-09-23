/**
 * Champ texte chiffré pour les secrets (clés API, mots de passe SMTP…).
 *
 * - Enregistré chiffré (AES-256-GCM) en base.
 * - Jamais renvoyé en clair par l'API : l'admin voit « •••••••• (défini) ».
 * - Laisser le masque tel quel conserve la valeur existante ; vider le champ l'efface.
 * - Le code serveur lit la valeur en clair via `context: { revealSecrets: true }`.
 */
import type { TextField } from 'payload'
import { decrypt, encrypt, isEncrypted } from '@/lib/crypto'
import { adminFieldOnly } from '@/access/roles'

export const SECRET_MASK = '•••••••• (défini)'

type Options = { name: string; label: string; description?: string }

export function encryptedField({ name, label, description }: Options): TextField {
  return {
    name,
    label,
    type: 'text',
    access: { read: adminFieldOnly, update: adminFieldOnly, create: adminFieldOnly },
    admin: {
      description: `${description ? description + ' — ' : ''}Stocké chiffré, jamais affiché en clair. Laisser le masque pour conserver la valeur.`,
      autoComplete: 'off',
    },
    hooks: {
      beforeChange: [
        ({ value, previousValue, originalDoc, path }) => {
          if (value === SECRET_MASK || value === undefined) {
            // Valeur inchangée : on garde la valeur chiffrée existante.
            return previousValue ?? getByPath(originalDoc, path)
          }
          if (value === null || value === '') return null
          if (isEncrypted(value)) return value
          return encrypt(String(value).trim())
        },
      ],
      afterRead: [
        ({ value, context }) => {
          if (!value) return value
          if (context?.revealSecrets) {
            try {
              return decrypt(String(value))
            } catch {
              return null
            }
          }
          return SECRET_MASK
        },
      ],
    },
  }
}

function getByPath(doc: unknown, path: (string | number)[] | undefined): unknown {
  if (!path) return undefined
  let cur: unknown = doc
  for (const key of path) {
    if (cur && typeof cur === 'object') cur = (cur as Record<string | number, unknown>)[key]
    else return undefined
  }
  return cur
}
