/**
 * Filtre automatique des textes envoyés par le public (livre d'or, fanarts, pseudos).
 * Logique pure, sans accès base, testée unitairement.
 *
 * Détecte :
 *  - insultes / propos haineux ou sexuels, y compris déguisés (l33t « s4l0p3 »,
 *    lettres espacées « p.u.t.e », lettres répétées « connnnard ») ;
 *  - liens (http, www, domaine.tld, « point com », invitations Discord, raccourcisseurs) ;
 *  - coordonnées personnelles (emails, numéros de téléphone) — public souvent mineur ;
 *  - spam (majuscules, caractères répétés, avalanche d'emojis, mots répétés, arnaques).
 *
 * Verdict : `block` (refusé immédiatement, message explicite à l'auteur·rice),
 * `review` (enregistré en attente, signalé aux modérateurs) ou `ok`.
 * Tout reste de toute façon soumis à la modération a priori.
 */

export type TextFlag = 'insult' | 'vulgar' | 'link' | 'personal' | 'spam' | 'caps' | 'custom'
export type Verdict = 'ok' | 'review' | 'block'

export type FilterOptions = {
  /** Que faire d'un lien vers un domaine non autorisé. */
  links?: 'block' | 'review' | 'allow'
  /** Domaines autorisés (ex. twitch.tv) — sous-domaines inclus. */
  allowedDomains?: string[]
  /** Mots ajoutés depuis l'admin : refus immédiat. */
  extraBlocked?: string[]
  /** Mots ajoutés depuis l'admin : simple signalement. */
  extraWatched?: string[]
  /** Refuser (true) ou seulement signaler (false) les emails / téléphones. */
  blockPersonal?: boolean
}

export type FilterResult = {
  verdict: Verdict
  flags: TextFlag[]
  /** Extraits problématiques, pour les surligner dans l'admin. */
  matches: string[]
  /** Message affiché à l'auteur·rice en cas de refus. */
  reason?: string
}

// --- Listes intégrées ---------------------------------------------------------
// Refus immédiat : insultes, haine, harcèlement, sexuel explicite (FR + EN).
const BLOCKED = [
  'connard', 'connasse', 'conasse', 'salope', 'salaud', 'pute', 'putes', 'enculé', 'encule', 'enculer', 'enculés', 'fdp', 'ntm', 'nique', 'niquer', 'niktamer',
  'batard', 'batards', 'pd', 'pede', 'pédé', 'tapette', 'gouine', 'negre', 'nègre', 'negro', 'bougnoule', 'youpin', 'bicot', 'chintok',
  'grosse vache', 'suicide toi', 'suicidetoi', 'va mourir', 'va crever', 'kys', 'bitch', 'fuck', 'fucking', 'motherfucker',
  'cunt', 'nigger', 'nigga', 'faggot', 'fag', 'whore', 'slut', 'dick', 'porn', 'porno', 'nudes', 'nude', 'hentai', 'bite', 'couilles', 'chatte',
]
/** Racines assez spécifiques pour être cherchées à l'intérieur d'un mot (jamais à cheval sur deux mots). */
const BLOCKED_ROOTS = ['nigg', 'encul', 'salop', 'connard', 'conard', 'connass', 'conass', 'bougnoul', 'suicidetoi', 'killyourself', 'motherfuck', 'niquetamere', 'niktamer']

// Signalement : vulgarités légères, mots ambigus (« je crève de faim », « désolé du retard »…)
// et vocabulaire typique du spam / des arnaques.
const WATCHED = [
  'putain', 'merde', 'chier', 'con', 'conne', 'cul', 'nichon', 'zizi', 'shit', 'wtf', 'stfu', 'sexe', 'creve', 'mongol', 'triso', 'attarde', 'debile',
  'crypto', 'bitcoin', 'nft', 'onlyfans', 'telegram', 'whatsapp', 'casino', 'viagra', 'robux', 'vbucks', 'giveaway', 'gratuit', 'free', 'promo', 'abonnez', 'abonne toi',
  'follow', 'snap', 'snapchat', 'dm moi', 'mp moi', 'clique ici', 'click here',
]

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '!': 'i', '|': 'i', '3': 'e', '€': 'e', '4': 'a', '@': 'a', '5': 's', $: 's', '7': 't', '8': 'b', '9': 'g', '+': 't' }

const TLDS = 'com|fr|net|org|io|gg|ly|xyz|ru|tk|me|co|be|ch|ca|info|biz|app|dev|link|site|shop|store|live|tv|to|cc|es|de|it|uk|us|eu|online|club|top|pw|su|cn'
// TLD reconnus sous forme épelée (« point com ») : liste courte pour ne pas piéger « un point de vue ».
const SPELLED_TLDS = 'com|fr|net|org|gg|io|xyz|tv|ru'
const URL_RE = new RegExp(
  [
    'https?:\\/\\/[^\\s]+',
    'www\\s*\\.\\s*[^\\s]+',
    // « site.com », « site[.]com », « site (.) com » — le point doit être collé :
    // « c’est bien. Me voilà » n’est pas un lien.
    `\\b[a-z0-9-]{2,}(?:\\.|\\s?\\[\\.\\]\\s?|\\s?\\(\\.\\)\\s?)(?:${TLDS})\\b(?:\\/[^\\s]*)?`,
    // « site point com », « site dot com »
    `\\b[a-z0-9-]{2,}\\s(?:dot|point)\\s(?:${SPELLED_TLDS})\\b`,
    'discord(?:app)?\\s*\\.\\s*(?:gg|com\\/invite)\\s*\\/?\\s*[a-z0-9]+',
  ].join('|'),
  'gi',
)
const EMAIL_RE = /[a-z0-9._%+-]+\s*(?:@|\(at\)|\[at\]|\sarobase\s)\s*[a-z0-9.-]+\s*(?:\.|\sdot\s|\spoint\s)\s*[a-z]{2,}/gi
const PHONE_RE = /(?<!\d)(?:\+|00)\s*\d{2,3}(?:[\s.-]*\d){8,11}|\b0\s*[1-9](?:[\s.-]*\d{2}){4}\b/g

/** Minuscules, sans accents, l33t décodé. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[0-9!|€@$+]/g, (c) => LEET[c] ?? c)
}

const squeeze = (w: string) => w.replace(/(.)\1{2,}/g, '$1$1') // « connnnard » → « connard »
const squeezeHard = (w: string) => w.replace(/(.)\1+/g, '$1') // « salooppe » → « salope »

/** Mots du texte, y compris ceux écrits lettre par lettre (« p . u . t . e »). */
export function tokens(text: string): string[] {
  const norm = normalize(text)
  const words = norm.split(/[^a-z]+/).filter(Boolean)
  const out = new Set<string>()
  for (const w of words) {
    out.add(w)
    out.add(squeeze(w))
    out.add(squeezeHard(w))
  }
  // Suites de lettres isolées séparées par des espaces/points/tirets → un mot
  const spaced = norm.match(/\b[a-z](?:[\s._*\-/]+[a-z]\b){2,}/g) ?? []
  for (const s of spaced) {
    const joined = s.replace(/[^a-z]/g, '')
    out.add(joined)
    out.add(squeezeHard(joined))
  }
  return [...out]
}

const plural = (w: string) => [w, `${w}s`, `${w}e`, `${w}es`, `${w}x`]

function findTerms(text: string, list: string[]): string[] {
  const toks = new Set(tokens(text))
  const norm = normalize(text)
  const found: string[] = []
  for (const raw of list) {
    const term = normalize(raw).trim()
    if (!term) continue
    if (term.includes(' ')) {
      // Expression : recherche dans le texte normalisé, espaces souples
      const re = new RegExp(`\\b${term.split(/\s+/).map((p) => p.replace(/[^a-z]/g, '')).join('[\\s._-]*')}\\b`)
      if (re.test(norm)) found.push(raw)
    } else if (plural(term).some((t) => toks.has(t) || toks.has(squeezeHard(t)))) {
      found.push(raw)
    }
  }
  return found
}

function hostOf(url: string): string {
  const cleaned = url
    .toLowerCase()
    .replace(/\s+(?:dot|point)\s+/g, '.')
    .replace(/\[\.\]|\(\.\)/g, '.')
    .replace(/\s+/g, '')
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
  return cleaned.split(/[/?#]/)[0]
}

export function analyzeText(text: string, opts: FilterOptions = {}): FilterResult {
  const flags = new Set<TextFlag>()
  const matches: string[] = []
  let block: string | undefined

  // 1. Insultes et propos interdits
  const toks = tokens(text)
  const blocked = [...findTerms(text, BLOCKED), ...BLOCKED_ROOTS.filter((r) => toks.some((t) => t.includes(r)))]
  if (blocked.length) {
    flags.add('insult')
    matches.push(...blocked)
    block ??= 'Ton message contient des mots qui ne sont pas autorisés ici. Reste bienveillant·e ✦'
  }
  const custom = findTerms(text, opts.extraBlocked ?? [])
  if (custom.length) {
    flags.add('custom')
    matches.push(...custom)
    block ??= 'Ton message contient des mots qui ne sont pas autorisés ici. Reste bienveillant·e ✦'
  }
  const watched = [...findTerms(text, WATCHED), ...findTerms(text, opts.extraWatched ?? [])]
  if (watched.length) {
    flags.add('vulgar')
    matches.push(...watched)
  }

  // 2. Liens
  const allowed = (opts.allowedDomains ?? []).map((d) => d.trim().toLowerCase().replace(/^www\./, '')).filter(Boolean)
  const urls = (text.match(URL_RE) ?? []).filter((u) => !/@/.test(u))
  const forbidden = urls.filter((u) => {
    const host = hostOf(u)
    return !allowed.some((d) => host === d || host.endsWith(`.${d}`))
  })
  const linkMode = opts.links ?? 'block'
  if (forbidden.length && linkMode !== 'allow') {
    flags.add('link')
    matches.push(...forbidden)
    if (linkMode === 'block') block ??= 'Les liens ne sont pas autorisés ici (seuls quelques sites connus le sont).'
  }

  // 3. Coordonnées personnelles
  const personal = [...(text.match(EMAIL_RE) ?? []), ...(text.match(PHONE_RE) ?? [])]
  if (personal.length) {
    flags.add('personal')
    matches.push(...personal)
    if (opts.blockPersonal !== false) block ??= 'Pour ta sécurité, ne partage pas d’adresse email ni de numéro de téléphone ici.'
  }

  // 4. Spam
  const letters = text.replace(/[^A-Za-zÀ-ÿ]/g, '')
  if (letters.length >= 12 && letters.replace(/[^A-ZÀ-Þ]/g, '').length / letters.length > 0.7) flags.add('caps')
  const emojis = text.match(/\p{Extended_Pictographic}/gu)?.length ?? 0
  const words = normalize(text).split(/[^a-z]+/).filter((w) => w.length > 2)
  const counts = new Map<string, number>()
  words.forEach((w) => counts.set(w, (counts.get(w) ?? 0) + 1))
  if (/([^\d\s])\1{9,}/u.test(text) || emojis > 20 || [...counts.values()].some((n) => n >= 6)) flags.add('spam')

  const verdict: Verdict = block ? 'block' : flags.size ? 'review' : 'ok'
  return { verdict, flags: [...flags], matches: [...new Set(matches)], reason: block }
}

/** Découpe une liste saisie dans l'admin (une entrée par ligne ou séparées par des virgules). */
export const parseList = (raw: string | null | undefined): string[] =>
  (raw ?? '')
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
