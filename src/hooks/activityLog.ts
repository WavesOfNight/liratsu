/**
 * Journal d'activité : ajoute automatiquement des hooks afterChange/afterDelete à toutes
 * les collections et globals pour tracer « qui a modifié quoi ».
 * Seules les actions d'un membre de l'équipe connecté sont tracées (pas les webhooks ni le public).
 */
import type { CollectionConfig, GlobalConfig, PayloadRequest } from 'payload'

const IGNORED = new Set(['activity-log', 'webhook-events', 'game-sessions', 'poll-votes', 'payload-preferences', 'payload-migrations', 'payload-locked-documents'])

async function log(req: PayloadRequest, data: { summary: string; entity: string; entityId?: string; operation: string }) {
  if (!req.user || req.user.collection !== 'users') return
  try {
    await req.payload.create({
      collection: 'activity-log',
      data: { ...data, user: req.user.id },
      req, // même transaction
      overrideAccess: true,
    })
  } catch (err) {
    req.payload.logger.warn({ err }, 'activity-log: écriture impossible')
  }
}

const who = (req: PayloadRequest) => (req.user as { name?: string; email?: string } | null)?.name || req.user?.email || '?'

export function withActivityLog(collections: CollectionConfig[], globals: GlobalConfig[]) {
  for (const c of collections) {
    if (IGNORED.has(c.slug)) continue
    const label = typeof c.labels?.singular === 'string' ? c.labels.singular : c.slug
    const titleField = c.admin?.useAsTitle
    c.hooks = {
      ...c.hooks,
      afterChange: [
        ...(c.hooks?.afterChange ?? []),
        async ({ doc, operation, req }) => {
          const title = titleField ? doc[titleField] : doc.id
          await log(req, {
            summary: `${who(req)} a ${operation === 'create' ? 'créé' : 'modifié'} ${label} « ${title} »`,
            entity: c.slug,
            entityId: String(doc.id),
            operation,
          })
          return doc
        },
      ],
      afterDelete: [
        ...(c.hooks?.afterDelete ?? []),
        async ({ doc, req }) => {
          await log(req, { summary: `${who(req)} a supprimé ${label} #${doc.id}`, entity: c.slug, entityId: String(doc.id), operation: 'delete' })
          return doc
        },
      ],
    }
  }
  for (const g of globals) {
    const label = typeof g.label === 'string' ? g.label : g.slug
    g.hooks = {
      ...g.hooks,
      afterChange: [
        ...(g.hooks?.afterChange ?? []),
        async ({ doc, req }) => {
          await log(req, { summary: `${who(req)} a modifié « ${label} »`, entity: g.slug, operation: 'update' })
          return doc
        },
      ],
    }
  }
  return { collections, globals }
}
