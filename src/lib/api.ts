/**
 * Outils communs aux routes API publiques : limitation de débit, validation zod,
 * protection CSRF (vérification d'origine), identification de l'équipe.
 */
import type { Payload } from 'payload'
import { z } from 'zod'
import type { Role } from '@/access/roles'
import { isTwoFactorSatisfied } from './twoFactor'
import { getPayloadClient } from './payload'

// Messages de validation en français.
z.config(z.locales.fr())

// ---- Limitation de débit (mémoire du process ; suffisant pour une instance unique Plesk/PM2) ----
const buckets = new Map<string, { count: number; reset: number }>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    if (buckets.size > 50_000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k)
    return true
  }
  b.count++
  return b.count <= limit
}

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
}

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } })

export const error = (message: string, status = 400) => json({ error: message }, status)

/** CSRF : les requêtes qui modifient des données doivent venir de notre propre origine. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return req.headers.get('sec-fetch-site') === 'same-origin'
  const allowed = new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').origin
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  return origin === allowed || (host !== null && new URL(origin).host === host)
}

export async function readJson<T extends z.ZodType>(req: Request, schema: T, maxBytes = 20_000): Promise<{ ok: true; data: z.infer<T> } | { ok: false; res: Response }> {
  const len = Number(req.headers.get('content-length') ?? 0)
  if (len > maxBytes) return { ok: false, res: error('Requête trop volumineuse.', 413) }
  let body: unknown
  try {
    const text = await req.text()
    if (text.length > maxBytes) return { ok: false, res: error('Requête trop volumineuse.', 413) }
    body = JSON.parse(text || '{}')
  } catch {
    return { ok: false, res: error('JSON invalide.') }
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return { ok: false, res: error(parsed.error.issues[0]?.message ?? 'Données invalides.', 422) }
  return { ok: true, data: parsed.data }
}

/** Garde commune : origine + limite de débit. Renvoie une Response d'erreur ou null. */
export function guard(req: Request, name: string, limit: number, windowMs: number): Response | null {
  if (req.method !== 'GET' && !sameOrigin(req)) return error('Origine non autorisée.', 403)
  if (!rateLimit(`${name}:${clientIp(req)}`, limit, windowMs)) return error('Doucement ! Réessaie dans un petit moment.', 429)
  return null
}

export type StaffUser = { id: number | string; email: string; roles: Role[]; totpEnabled?: boolean | null; totpEnabledAt?: string | null; name?: string | null }

/** Authentifie un membre de l'équipe (cookie Payload + 2FA) et vérifie ses rôles. */
export async function requireStaff(req: Request, ...roles: Role[]): Promise<{ payload: Payload; user: StaffUser } | Response> {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: req.headers })
  if (!user || user.collection !== 'users') return error('Non connecté.', 401)
  const u = user as unknown as StaffUser
  if (!isTwoFactorSatisfied({ user: u as never, headers: req.headers })) return error('Validation 2FA requise.', 401)
  const has = u.roles?.includes('admin') || roles.length === 0 || roles.some((r) => u.roles?.includes(r))
  if (!has) return error('Accès refusé.', 403)
  if (req.method !== 'GET' && !sameOrigin(req)) return error('Origine non autorisée.', 403)
  return { payload, user: u }
}
