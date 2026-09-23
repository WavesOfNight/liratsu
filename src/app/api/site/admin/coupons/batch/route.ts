import { z } from 'zod'
import { error, json, readJson, requireStaff } from '@/lib/api'
import { generateCodes } from '@/lib/shop/pricing'
import { randomInt } from 'node:crypto'

const schema = z.object({
  count: z.number().int().min(1).max(500),
  prefix: z
    .string()
    .trim()
    .max(12)
    .regex(/^[A-Za-z0-9-]*$/, 'Préfixe : lettres, chiffres et tirets uniquement.')
    .transform((s) => s.toUpperCase()),
  type: z.enum(['percent', 'fixed', 'freeShipping']),
  value: z.number().min(0).max(1000),
  batch: z.string().trim().max(60).optional(),
  endsAt: z.string().optional(),
})

/** Génère N codes promo uniques à usage unique (giveaway en live…). */
export async function POST(req: Request) {
  const auth = await requireStaff(req, 'editor')
  if (auth instanceof Response) return auth
  const body = await readJson(req, schema)
  if (!body.ok) return body.res
  const { payload } = auth
  const d = body.data
  if (d.type === 'percent' && d.value > 100) return error('Un pourcentage ne peut pas dépasser 100.')
  const batch = d.batch || `lot-${new Date().toISOString().slice(0, 10)}`
  const codes = generateCodes(d.count * 2, d.prefix, 8, () => randomInt(0, 1_000_000) / 1_000_000)
  const created: string[] = []
  for (const code of codes) {
    if (created.length >= d.count) break
    try {
      await payload.create({
        collection: 'coupons',
        data: {
          code,
          type: d.type,
          value: d.value,
          batch,
          maxUses: 1,
          maxUsesPerCustomer: 1,
          active: true,
          endsAt: d.endsAt ? new Date(`${d.endsAt}T23:59:59`).toISOString() : undefined,
          note: `Généré en lot (${batch})`,
        },
      })
      created.push(code)
    } catch {
      // collision improbable avec un code existant : on passe au suivant
    }
  }
  return json({ codes: created, batch })
}
