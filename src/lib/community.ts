/**
 * Espace communauté : cookies signés (HMAC) pour
 *  - les contenus débloqués par code surprise (sans compte) : `lunlock`
 *  - la session d'un membre connecté via Twitch : `lmember`
 */
import { createHmac } from 'node:crypto'
import { safeEqual } from './crypto'
import { readCookie } from './twoFactor'

const secret = () => process.env.PAYLOAD_SECRET || 'dev'
const sign = (v: string) => createHmac('sha256', secret()).update(`community:${v}`).digest('base64url')

export const UNLOCK_COOKIE = 'lunlock'
export const MEMBER_COOKIE = 'lmember'
const YEAR = 60 * 60 * 24 * 365

function packSigned(value: string): string {
  return `${Buffer.from(value).toString('base64url')}.${sign(value)}`
}
function unpackSigned(raw: string | null): string | null {
  if (!raw) return null
  const [b64, sig] = raw.split('.')
  if (!b64 || !sig) return null
  const value = Buffer.from(b64, 'base64url').toString('utf8')
  return safeEqual(sig, sign(value)) ? value : null
}

const cookie = (name: string, value: string, maxAge: number) =>
  `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`

/** Identifiants des téléchargements débloqués (codes surprise). */
export function readUnlocks(cookieHeader: string | null): number[] {
  const v = unpackSigned(readCookie(cookieHeader, UNLOCK_COOKIE))
  if (!v) return []
  return v
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
}

export function unlockCookie(ids: number[]): string {
  const unique = [...new Set(ids)].slice(-200)
  return cookie(UNLOCK_COOKIE, packSigned(unique.join(',')), YEAR)
}

export function readMemberId(cookieHeader: string | null): number | null {
  const v = unpackSigned(readCookie(cookieHeader, MEMBER_COOKIE))
  if (!v) return null
  const [id, exp] = v.split(':').map(Number)
  return id && exp > Date.now() / 1000 ? id : null
}

export function memberCookie(id: number): string {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
  return cookie(MEMBER_COOKIE, packSigned(`${id}:${exp}`), 60 * 60 * 24 * 30)
}

export const clearCookie = (name: string) => `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
export { packSigned, unpackSigned }
