/**
 * Double authentification (TOTP, compatible Google Authenticator, Aegis, 2FAS…).
 *
 * Fonctionnement : après la connexion Payload classique, un compte ayant activé la 2FA
 * doit saisir un code à 6 chiffres. Le serveur pose alors un cookie signé (HMAC) `l2fa`
 * lié à l'utilisateur. Tant que ce cookie est absent/invalide, toutes les règles d'accès
 * (src/access/roles.ts) refusent l'accès : la 2FA est donc appliquée côté API, pas
 * seulement dans l'interface.
 */
import { createHmac } from 'node:crypto'
import * as OTPAuth from 'otpauth'
import type { PayloadRequest } from 'payload'
import { safeEqual } from './crypto'

export const TWO_FACTOR_COOKIE = 'l2fa'
const TTL_SECONDS = 60 * 60 * 12 // 12 h

type TwoFactorUser = { id: string | number; totpEnabled?: boolean | null; totpEnabledAt?: string | null }

function sign(payload: string): string {
  return createHmac('sha256', process.env.PAYLOAD_SECRET || 'dev').update(payload).digest('base64url')
}

export function createTwoFactorCookieValue(user: TwoFactorUser, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + TTL_SECONDS
  const body = `${user.id}.${exp}.${user.totpEnabledAt ?? ''}`
  return `${user.id}.${exp}.${sign(body)}`
}

export function twoFactorCookieHeader(value: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${TWO_FACTOR_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TTL_SECONDS}${secure}`
}

export function readCookie(cookieHeader: string | null | undefined, name: string): string | null {
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return null
}

export function verifyTwoFactorCookie(user: TwoFactorUser, value: string | null, now = Date.now()): boolean {
  if (!value) return false
  const [id, expStr, sig] = value.split('.')
  if (!id || !expStr || !sig || id !== String(user.id)) return false
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || exp * 1000 < now) return false
  return safeEqual(sig, sign(`${id}.${exp}.${user.totpEnabledAt ?? ''}`))
}

/** Vrai si l'utilisateur n'a pas la 2FA, ou s'il l'a validée pour cette session. */
export function isTwoFactorSatisfied(req: Pick<PayloadRequest, 'user' | 'headers'>): boolean {
  const user = req.user as TwoFactorUser | null
  if (!user) return false
  if (!user.totpEnabled) return true
  return verifyTwoFactorCookie(user, readCookie(req.headers?.get('cookie'), TWO_FACTOR_COOKIE))
}

export function createTotp(secretBase32: string, label: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: 'Liratsu Admin',
    label,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  })
}

export function generateTotpSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32
}

export function checkTotp(secretBase32: string, token: string): boolean {
  const clean = token.replace(/\s/g, '')
  if (!/^\d{6}$/.test(clean)) return false
  return createTotp(secretBase32, 'check').validate({ token: clean, window: 1 }) !== null
}
