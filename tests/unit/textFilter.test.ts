import { describe, expect, it } from 'vitest'
import { analyzeText, parseList } from '@/lib/moderation/textFilter'

const opts = { allowedDomains: ['twitch.tv', 'liratsu.fr'] }
const verdict = (t: string, o = opts) => analyzeText(t, o).verdict

describe('filtre du livre d’or — messages normaux', () => {
  it.each([
    'Coucou Liratsu ! Tes lives dessin sont trop bien, merci pour tout ✦',
    'Désolé pour le retard, je découvre ta chaîne depuis hier soir',
    'De mon point de vue c’est le meilleur stream. Merci !',
    'C’est bien. Me voilà abonné, bravo pour la technique de dessin',
    'Le computer game d’hier était génial, 10/10',
    'Scénario : un poisson, des bulles et 3 étoiles. Vivement le prochain !',
    'On se retrouve sur twitch.tv/liratsu ce soir 🐟',
  ])('laisse passer : %s', (text) => {
    expect(verdict(text)).toBe('ok')
  })
})

describe('mots ambigus', () => {
  it('sont signalés à la modération mais jamais refusés automatiquement', () => {
    const r = analyzeText('Je crève de faim après ce live de 5 heures mdr', opts)
    expect(r.verdict).toBe('review')
  })
})

describe('insultes (y compris déguisées)', () => {
  it.each(['T’es une salope', 'bande de connards', 's4l0p3', 'p.u.t.e', 'c o n n a r d', 'connnnnnard', 'SALOOOPE', 'va crever', 'enculééé', 'N1gg4'])('bloque : %s', (text) => {
    const r = analyzeText(text, opts)
    expect(r.verdict).toBe('block')
    expect(r.flags).toContain('insult')
    expect(r.reason).toMatch(/bienveillant/)
  })
  it('signale sans bloquer les vulgarités légères', () => {
    const r = analyzeText('Putain ce dessin est trop beau', opts)
    expect(r.verdict).toBe('review')
    expect(r.flags).toEqual(['vulgar'])
  })
})

describe('liens', () => {
  it.each([
    'Viens voir https://arnaque.example.com',
    'va sur www.monsite.net',
    'mon site : super-promo.xyz',
    'gagne des robux sur freerobux point com',
    'rejoins discord.gg/abcdef',
    'bit.ly/3xYz',
    'monsite[.]fr',
  ])('bloque : %s', (text) => {
    const r = analyzeText(text, opts)
    expect(r.verdict).toBe('block')
    expect(r.flags).toContain('link')
  })
  it('autorise les domaines de confiance (et leurs sous-domaines)', () => {
    expect(verdict('https://www.twitch.tv/liratsu')).toBe('ok')
    expect(verdict('clips.twitch.tv/SuperClip')).toBe('ok')
  })
  it('mode « signaler » : le message passe en revue au lieu d’être refusé', () => {
    expect(analyzeText('va sur monsite.com', { links: 'review' }).verdict).toBe('review')
    expect(analyzeText('va sur monsite.com', { links: 'allow' }).verdict).toBe('ok')
  })
})

describe('coordonnées personnelles', () => {
  it.each(['écris-moi à lili.poisson@gmail.com', 'mon mail : lili (at) gmail point com', 'appelle moi 06 12 34 56 78', '+33 6 12 34 56 78'])('bloque : %s', (text) => {
    const r = analyzeText(text, opts)
    expect(r.flags).toContain('personal')
    expect(r.verdict).toBe('block')
  })
  it('ne confond pas un grand nombre avec un téléphone', () => {
    expect(verdict('1000000000000 bisous !')).toBe('ok')
  })
})

describe('spam', () => {
  it('signale majuscules, répétitions et avalanches d’emojis', () => {
    expect(analyzeText('TROP BIEN CE LIVE JE SUIS FAN', opts).flags).toContain('caps')
    expect(analyzeText('coucou coucou coucou coucou coucou coucou', opts).flags).toContain('spam')
    expect(analyzeText('🐟'.repeat(25), opts).flags).toContain('spam')
    expect(analyzeText('Crypto gratuite, clique ici !', opts).verdict).toBe('review')
  })
})

describe('listes personnalisées (admin)', () => {
  it('mots bloqués et surveillés ajoutés par l’équipe', () => {
    const o = { ...opts, extraBlocked: parseList('pseudo-du-troll\nmotinterdit'), extraWatched: parseList('spoiler, fin du jeu') }
    expect(analyzeText('coucou motinterdit', o).verdict).toBe('block')
    expect(analyzeText('attention spoiler sur la fin du jeu', o).verdict).toBe('review')
  })
  it('surligne les extraits problématiques', () => {
    expect(analyzeText('bande de connards, va sur arnaque.com', opts).matches).toEqual(expect.arrayContaining(['connard', 'arnaque.com']))
  })
})
