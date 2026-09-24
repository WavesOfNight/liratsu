/**
 * Champ texte chiffré pour les secrets (clés API, mots de passe SMTP…).
 *
 * - Enregistré chiffré (AES-256-GCM) en base.
 * - Jamais renvoyé en clair par l'API : l'admin voit « •••••••• (défini) ».
 * - Laisser le masque tel quel conserve la valeur existante ; vider le champ l'efface.
 * - Le code serveur lit la valeur en clair via `context: { revealSecrets: true }`.
 *
 * Piège corrigé ici : à l'enregistrement (ex. l'admin modifie juste un autre champ du même
 * onglet et sauvegarde sans toucher au secret), Payload fournit `previousValue`/`originalDoc`
 * déjà passés par `afterRead` — donc déjà MASQUÉS, puisqu'un enregistrement normal ne passe
 * pas `context: { revealSecrets: true }`. Renvoyer tel quel « garde le masque littéral »
 * écrasait donc le vrai secret chiffré par le texte « •••••••• (défini) » en clair dans la
 * base — silencieusement, sans erreur. Pour garder la valeur inchangée, on relit le document
 * avec un contexte dédié (`rawSecrets`) qui fait ressortir la chaîne chiffrée brute, jamais
 * la version affichée.
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
        async ({ value, originalDoc, path, req, global, collection }) => {
          if (value === SECRET_MASK || value === undefined) {
            // Valeur inchangée : on va chercher la vraie valeur chiffrée en base plutôt que
            // de faire confiance à previousValue/originalDoc (déjà masqués, voir plus haut).
            const id = (originalDoc as { id?: number | string } | undefined)?.id
            const raw = global
              ? await req.payload.findGlobal({ slug: global.slug, context: { rawSecrets: true }, depth: 0, req }).catch(() => null)
              : collection && id !== undefined
                ? await req.payload.findByID({ collection: collection.slug, id, context: { rawSecrets: true }, depth: 0, req }).catch(() => null)
                : null
            return raw ? getByPath(raw, path) : null
          }
          if (value === null || value === '') return null
          if (isEncrypted(value)) return value
          return encrypt(String(value).trim())
        },
      ],
      afterRead: [
        ({ value, context }) => {
          if (!value) return value
          // Usage interne uniquement (voir beforeChange ci-dessus) : ne jamais démasquer ni
          // masquer, juste renvoyer la chaîne chiffrée telle qu'enregistrée.
          if (context?.rawSecrets) return value
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
