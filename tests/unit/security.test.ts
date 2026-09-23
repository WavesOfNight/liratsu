import { describe, expect, it } from 'vitest'
import { packSigned, readUnlocks, unlockCookie, unpackSigned } from '@/lib/community'
import { decrypt, encrypt, isEncrypted, safeEqual } from '@/lib/crypto'
import { checkTotp, createTotp, createTwoFactorCookieValue, generateTotpSecret, isTwoFactorSatisfied, verifyTwoFactorCookie } from '@/lib/twoFactor'
import { parseYouTubeFeed } from '@/lib/youtube'

describe('chiffrement des secrets', () => {
  it('chiffre / déchiffre, avec IV aléatoire', () => {
    const a = encrypt('sk_test_123')
    const b = encrypt('sk_test_123')
    expect(isEncrypted(a)).toBe(true)
    expect(a).not.toBe(b)
    expect(a).not.toContain('sk_test_123')
    expect(decrypt(a)).toBe('sk_test_123')
  })
  it('détecte une altération (GCM)', () => {
    const a = encrypt('secret')
    const tampered = a.slice(0, -4) + (a.endsWith('AAAA') ? 'BBBB' : 'AAAA')
    expect(() => decrypt(tampered)).toThrow()
  })
  it('compare en temps constant', () => {
    expect(safeEqual('abc', 'abc')).toBe(true)
    expect(safeEqual('abc', 'abd')).toBe(false)
  })
})

describe('double authentification', () => {
  it('valide un code TOTP courant et refuse un code faux', () => {
    const secret = generateTotpSecret()
    const code = createTotp(secret, 'test').generate()
    expect(checkTotp(secret, code)).toBe(true)
    expect(checkTotp(secret, '000000') && checkTotp(secret, '111111')).toBe(false)
    expect(checkTotp(secret, 'abc')).toBe(false)
  })
  it('cookie 2FA signé, lié à l’utilisateur et expirant', () => {
    const user = { id: 7, totpEnabled: true, totpEnabledAt: '2026-01-01' }
    const now = Date.now()
    const v = createTwoFactorCookieValue(user, now)
    expect(verifyTwoFactorCookie(user, v, now)).toBe(true)
    expect(verifyTwoFactorCookie({ ...user, id: 8 }, v, now)).toBe(false)
    expect(verifyTwoFactorCookie({ ...user, totpEnabledAt: '2026-02-02' }, v, now)).toBe(false) // 2FA réinitialisée
    expect(verifyTwoFactorCookie(user, v, now + 13 * 3600_000)).toBe(false)
    expect(verifyTwoFactorCookie(user, v.replace(/.$/, 'x'), now)).toBe(false)
  })
  it('les règles d’accès exigent la 2FA quand elle est activée', () => {
    const user = { id: 1, totpEnabled: true, totpEnabledAt: 'x' }
    const headers = new Headers()
    expect(isTwoFactorSatisfied({ user, headers } as never)).toBe(false)
    headers.set('cookie', `l2fa=${createTwoFactorCookieValue(user)}`)
    expect(isTwoFactorSatisfied({ user, headers } as never)).toBe(true)
    expect(isTwoFactorSatisfied({ user: { id: 2, totpEnabled: false }, headers: new Headers() } as never)).toBe(true)
  })
})

describe('cookies communauté', () => {
  it('signe et refuse les valeurs falsifiées', () => {
    const packed = packSigned('1,2,3')
    expect(unpackSigned(packed)).toBe('1,2,3')
    const forged = `${Buffer.from('1,2,3,99').toString('base64url')}.${packed.split('.')[1]}`
    expect(unpackSigned(forged)).toBeNull()
  })
  it('relit les déblocages depuis l’en-tête Cookie', () => {
    const header = unlockCookie([4, 5, 5]).split(';')[0]
    expect(readUnlocks(header)).toEqual([4, 5])
    expect(readUnlocks('lunlock=abc.def')).toEqual([])
  })
})

describe('flux RSS YouTube', () => {
  it('extrait identifiant, titre (entités décodées) et date', () => {
    const xml = `<feed><entry><yt:videoId>abc123DEF45</yt:videoId><title>Dessin &amp; musique</title><published>2026-09-01T10:00:00+00:00</published></entry><entry><title>sans id</title></entry></feed>`
    const v = parseYouTubeFeed(xml)
    expect(v).toHaveLength(1)
    expect(v[0]).toMatchObject({ id: 'abc123DEF45', title: 'Dessin & musique' })
  })
})
