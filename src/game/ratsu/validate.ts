/**
 * Validation serveur basique des scores (anti-triche) — logique pure, testée unitairement.
 * On vérifie la cohérence entre durée réelle (mesurée par le serveur), étage, score et
 * statistiques déclarées. Ce n'est pas infaillible, mais bloque les envois grossiers.
 */
export type ScoreClaim = { score: number; floor: number; won: boolean; durationMs: number; kills: number; rooms: number }
export type ScoreRules = { maxFloors: number; maxScorePerSecond: number }

/** Score maximal théorique d'après les stats déclarées (voir game.ts pour les barèmes). */
export function theoreticalMax(c: ScoreClaim): number {
  const boss = c.floor * 500
  const coinsUpper = c.kills * 5 + c.rooms * 5 // au plus ~1 pièce par ennemi + salle
  return c.kills * 10 + c.rooms * 25 + (c.floor - 1) * 200 + boss + coinsUpper + (c.won ? 1600 : 0)
}

export function validateScore(c: ScoreClaim, serverElapsedMs: number, rules: ScoreRules): { ok: true } | { ok: false; reason: string } {
  if (![c.score, c.floor, c.durationMs, c.kills, c.rooms].every((n) => Number.isFinite(n) && n >= 0)) return { ok: false, reason: 'valeurs invalides' }
  if (c.floor < 1 || c.floor > rules.maxFloors) return { ok: false, reason: 'étage impossible' }
  if (c.won && c.floor !== rules.maxFloors) return { ok: false, reason: 'victoire impossible à cet étage' }
  // La durée déclarée ne peut pas dépasser celle mesurée par le serveur (+ marge réseau).
  if (c.durationMs > serverElapsedMs + 5_000) return { ok: false, reason: 'durée incohérente' }
  const seconds = Math.max(1, Math.min(c.durationMs, serverElapsedMs) / 1000)
  // Temps minimum plausible : ~12 s par étage franchi.
  if (seconds < (c.floor - 1) * 12 + (c.won ? 12 : 0)) return { ok: false, reason: 'partie trop rapide' }
  if (c.score > rules.maxScorePerSecond * seconds + 1600) return { ok: false, reason: 'score trop élevé pour la durée' }
  if (c.score > theoreticalMax(c)) return { ok: false, reason: 'score incohérent avec la partie' }
  if (c.kills > seconds * 3) return { ok: false, reason: 'trop d’ennemis pour la durée' }
  return { ok: true }
}

const BANNED = ['admin', 'modo', 'liratsu', 'connard', 'pute', 'salope', 'encul', 'nazi', 'hitler', 'fdp', 'ntm', 'batard', 'nigg', 'pd']

export function cleanNickname(raw: string): string | null {
  const n = raw.normalize('NFKC').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 20)
  if (n.length < 2) return null
  const flat = n
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
  if (BANNED.some((b) => flat.includes(b))) return null
  return n
}
