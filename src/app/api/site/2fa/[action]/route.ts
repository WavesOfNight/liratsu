/**
 * Double authentification de l'équipe :
 *  GET  status  → la 2FA est-elle requise pour cette session ?
 *  POST setup   → génère un secret en attente + QR code
 *  POST enable  → valide le premier code et active la 2FA
 *  POST verify  → valide un code et pose le cookie de session 2FA
 *  POST disable → désactive (code actuel requis)
 *  POST reset   → un admin réinitialise la 2FA d'un autre compte
 */
import QRCode from 'qrcode'
import { z } from 'zod'
import { error, json, rateLimit, readJson, requireStaff, sameOrigin } from '@/lib/api'
import { decrypt, encrypt } from '@/lib/crypto'
import { getPayloadClient } from '@/lib/payload'
import {
  checkTotp,
  createTotp,
  createTwoFactorCookieValue,
  generateTotpSecret,
  isTwoFactorSatisfied,
  twoFactorCookieHeader,
} from '@/lib/twoFactor'

type Params = { params: Promise<{ action: string }> }
type RawUser = { id: number; email: string; totpEnabled?: boolean | null; totpEnabledAt?: string | null; totpSecret?: string | null; totpPendingSecret?: string | null; roles?: string[] }

async function currentUser(req: Request) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: req.headers })
  if (!user || user.collection !== 'users') return { payload, user: null }
  // Relecture complète (champs cachés inclus) via l'API locale.
  const full = (await payload.findByID({ collection: 'users', id: user.id, showHiddenFields: true, depth: 0 })) as unknown as RawUser
  return { payload, user: full }
}

export async function GET(req: Request, { params }: Params) {
  const { action } = await params
  if (action !== 'status') return error('Introuvable', 404)
  const { user } = await currentUser(req)
  if (!user) return json({ required: false })
  return json({ required: Boolean(user.totpEnabled) && !isTwoFactorSatisfied({ user: user as never, headers: req.headers }) })
}

const codeSchema = z.object({ code: z.string().min(6).max(8) })

export async function POST(req: Request, { params }: Params) {
  const { action } = await params
  if (!sameOrigin(req)) return error('Origine non autorisée.', 403)
  const { payload, user } = await currentUser(req)
  if (!user) return error('Non connecté.', 401)
  if (!rateLimit(`2fa:${user.id}`, 10, 5 * 60_000)) return error('Trop de tentatives, patiente quelques minutes.', 429)

  switch (action) {
    case 'setup': {
      if (user.totpEnabled) return error('La 2FA est déjà active.')
      const secret = generateTotpSecret()
      await payload.update({ collection: 'users', id: user.id, data: { totpPendingSecret: encrypt(secret) } as never })
      const uri = createTotp(secret, user.email).toString()
      return json({ secret, qr: await QRCode.toDataURL(uri, { margin: 1, width: 220 }) })
    }
    case 'enable': {
      const body = await readJson(req, codeSchema)
      if (!body.ok) return body.res
      if (!user.totpPendingSecret) return error('Lance d’abord la configuration.')
      const secret = decrypt(user.totpPendingSecret)
      if (!checkTotp(secret, body.data.code)) return error('Code invalide.')
      const enabledAt = new Date().toISOString()
      await payload.update({
        collection: 'users',
        id: user.id,
        data: { totpSecret: encrypt(secret), totpPendingSecret: null, totpEnabled: true, totpEnabledAt: enabledAt } as never,
        overrideAccess: true,
      })
      return json({ ok: true }, 200, { 'Set-Cookie': twoFactorCookieHeader(createTwoFactorCookieValue({ id: user.id, totpEnabledAt: enabledAt })) })
    }
    case 'verify': {
      const body = await readJson(req, codeSchema)
      if (!body.ok) return body.res
      if (!user.totpEnabled || !user.totpSecret) return json({ ok: true })
      if (!checkTotp(decrypt(user.totpSecret), body.data.code)) return error('Code invalide.')
      return json({ ok: true }, 200, { 'Set-Cookie': twoFactorCookieHeader(createTwoFactorCookieValue(user)) })
    }
    case 'disable': {
      const body = await readJson(req, codeSchema)
      if (!body.ok) return body.res
      if (!user.totpEnabled || !user.totpSecret) return error('La 2FA n’est pas active.')
      if (!checkTotp(decrypt(user.totpSecret), body.data.code)) return error('Code invalide.')
      await payload.update({
        collection: 'users',
        id: user.id,
        data: { totpSecret: null, totpEnabled: false, totpEnabledAt: null } as never,
        overrideAccess: true,
      })
      return json({ ok: true })
    }
    case 'reset': {
      const staff = await requireStaff(req, 'admin')
      if (staff instanceof Response) return staff
      const body = await readJson(req, z.object({ userId: z.union([z.string(), z.number()]) }))
      if (!body.ok) return body.res
      await payload.update({
        collection: 'users',
        id: body.data.userId,
        data: { totpSecret: null, totpPendingSecret: null, totpEnabled: false, totpEnabledAt: null } as never,
        overrideAccess: true,
      })
      return json({ ok: true })
    }
    default:
      return error('Introuvable', 404)
  }
}
