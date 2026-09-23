/**
 * Chiffrement symétrique des secrets stockés en base (clés API saisies dans l'admin).
 * AES-256-GCM, clé dérivée de ENCRYPTION_KEY (ou, à défaut, de PAYLOAD_SECRET).
 *
 * Format stocké : `enc:v1:<iv b64>:<tag b64>:<data b64>`
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const PREFIX = 'enc:v1:'
let cachedKey: Buffer | null = null

function getKey(): Buffer {
  if (cachedKey) return cachedKey
  const raw = process.env.ENCRYPTION_KEY || process.env.PAYLOAD_SECRET
  if (!raw) throw new Error('ENCRYPTION_KEY (ou PAYLOAD_SECRET) doit être défini pour chiffrer les secrets.')
  cachedKey = scryptSync(raw, 'liratsu:secrets:v1', 32)
  return cachedKey
}

export function isEncrypted(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(PREFIX)
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${data.toString('base64')}`
}

export function decrypt(value: string): string {
  if (!isEncrypted(value)) return value
  const [ivB64, tagB64, dataB64] = value.slice(PREFIX.length).split(':')
  const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8')
}

/** Comparaison en temps constant de deux chaînes (tokens, signatures). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

/** Hash non réversible (IP, email) pour limiter les données personnelles stockées. */
export function hashIdentifier(value: string): string {
  return createHash('sha256').update(`${process.env.PAYLOAD_SECRET ?? ''}:${value}`).digest('hex').slice(0, 32)
}
