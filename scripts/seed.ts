/**
 * Seed de démonstration (idempotent : relançable sans doublons).
 *
 *   npm run seed
 *
 * Crée : un compte admin (si aucun), les contenus de base repris du site de maintenance,
 * les pages légales (depuis /legal-source/<slug>.md si présent, sinon les modèles de
 * src/seed/legal), des zones de livraison, des produits/codes promo DE TEST, des codes surprise.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

const payload: Payload = await getPayload({ config })
const editorConfig = await editorConfigFactory.default({ config: payload.config })
const md = (markdown: string) => convertMarkdownToLexical({ editorConfig, markdown }) as never
const log = (m: string) => console.log(`  ✦ ${m}`)

async function findOne(collection: Parameters<Payload['find']>[0]['collection'], where: Record<string, unknown>) {
  const r = await payload.find({ collection, where: where as never, limit: 1, depth: 0, overrideAccess: true })
  return r.docs[0] as { id: number } | undefined
}

/** Démonstration du système « jeu personnalisé » : une page HTML/JS autonome, à coller telle quelle
 * dans l'admin (Arcade > Jeux > Code du jeu). Rendue dans une iframe isolée sur le site public. */
const DEMO_CUSTOM_GAME = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;height:100%;background:linear-gradient(#8fd3ff,#1e6fd9);overflow:hidden;font-family:sans-serif}
  #score{position:fixed;top:8px;left:8px;color:#fff;font-weight:bold;font-size:20px;text-shadow:0 2px 4px rgba(0,0,0,.3)}
  .bubble{position:absolute;width:44px;height:44px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#fff,#bfe8ff 60%,#3fa9f5);border:2px solid #fff;cursor:pointer}
</style></head><body>
  <div id="score">Score : 0</div>
  <script>
    let score = 0;
    const scoreEl = document.getElementById('score');
    function spawn() {
      const b = document.createElement('div');
      b.className = 'bubble';
      b.style.left = Math.random() * (innerWidth - 44) + 'px';
      b.style.top = Math.random() * (innerHeight - 44) + 'px';
      b.onclick = () => { score++; scoreEl.textContent = 'Score : ' + score; b.remove(); spawn(); };
      document.body.appendChild(b);
      setTimeout(() => { if (b.isConnected) { b.remove(); spawn(); } }, 2200);
    }
    for (let i = 0; i < 5; i++) spawn();
    setInterval(() => window.parent.postMessage({ type: 'liratsu:score', score }, '*'), 1000);
  </script>
</body></html>`

console.log('🌊 Seed Liratsu…')

// ---- Compte admin -----------------------------------------------------------
const users = await payload.count({ collection: 'users' })
if (users.totalDocs === 0) {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@liratsu.local'
  const password = process.env.SEED_ADMIN_PASSWORD || randomBytes(9).toString('base64url')
  await payload.create({ collection: 'users', data: { email, password, name: 'Admin', roles: ['admin'] } })
  log(`Compte admin créé : ${email} / ${password}  (à changer + activer la 2FA !)`)
}

// ---- Médias ---------------------------------------------------------------
let avatarId = (await findOne('media', { filename: { like: 'liratsu-avatar' } }))?.id
if (!avatarId) {
  const avatar = await payload.create({
    collection: 'media',
    data: { alt: 'Portrait dessiné de Liratsu, lunettes et casque audio' },
    filePath: path.resolve('public/img/liratsu-avatar.png'),
  })
  avatarId = avatar.id
  log('Avatar importé')
}

// ---- Réglages ---------------------------------------------------------------
await payload.updateGlobal({ slug: 'site-settings', data: { avatar: avatarId, ogImage: avatarId } })

const bioText =
  "Salut, moi c'est Liratsu ! Streameuse passionnée de dessin, de musique et de jeu vidéo, toujours partante pour découvrir de nouvelles choses. Mon rêve ? Vivre un jour de mes passions. 🍓"

const home = await payload.findGlobal({ slug: 'home-page' })
if (!home.layout?.length) {
  await payload.updateGlobal({
    slug: 'home-page',
    data: {
      layout: [
        { blockType: 'hero', tagline: 'Dessin · Musique · Jeu vidéo', intro: bioText, ctaLabel: 'Regarder le live', ctaUrl: 'https://www.twitch.tv/liratsu', showAvatar: true },
        { blockType: 'liveStatus', windowTitle: 'Live Twitch', showPlayer: true, offlineText: 'Liratsu n’est pas en live pour le moment… viens jeter un œil au planning !' },
        {
          blockType: 'schedule',
          windowTitle: 'Planning des streams',
          source: 'auto',
          manual: [
            { day: 'Mardi', time: '20h30', title: 'Soirée dessin chill', kind: 'art' },
            { day: 'Jeudi', time: '20h30', title: 'Jeu indé découverte', kind: 'game' },
            { day: 'Samedi', time: '15h00', title: 'Musique & papotage', kind: 'music' },
          ],
        },
        { blockType: 'communityGoal', windowTitle: 'Objectif communautaire', label: 'Objectif followers', current: 420, target: 1000, reward: 'Un stream dessin spécial fanarts !' },
        { blockType: 'clips', windowTitle: 'Derniers clips', count: 6 },
        { blockType: 'youtube', windowTitle: 'Dernières vidéos', count: 4 },
        { blockType: 'socialGrid', windowTitle: 'Mes réseaux' },
      ],
    },
  })
  log('Page Accueil')
}

const bio = await payload.findGlobal({ slug: 'biography-page' })
if (!bio.layout?.length) {
  await payload.updateGlobal({
    slug: 'biography-page',
    data: {
      title: 'Biographie',
      intro: 'Le parcours, les passions et l’univers de Liratsu, racontés en détail.',
      layout: [
        {
          blockType: 'profileCard',
          windowTitle: 'Profil — Messagerie Bulle',
          displayName: '✿ Liratsu ✿',
          mood: 'en train de dessiner avec un lo-fi dans les oreilles',
          presence: 'online',
          avatar: avatarId,
          facts: [
            { label: 'Passions', value: 'Dessin, musique, jeu vidéo' },
            { label: 'Jeux préférés', value: '[à compléter dans l’admin]' },
            { label: 'Setup', value: '[à compléter dans l’admin]' },
            { label: 'Rêve', value: 'Vivre un jour de mes passions' },
          ],
        },
        {
          blockType: 'richText',
          windowTitle: 'À propos.txt',
          content: md(
            `${bioText}\n\nSur ma chaîne Twitch, on dessine, on joue à des jeux indés, on fait de la musique et surtout on papote ensemble. Ici, c’est un petit coin d’internet rien qu’à nous : fais comme chez toi ✦\n\n*Texte à compléter depuis l’admin (Pages > Page Biographie).*`,
          ),
        },
        {
          blockType: 'timeline',
          windowTitle: 'Mon parcours',
          events: [
            { date: 'Il était une fois…', title: 'Premiers dessins', text: 'À compléter dans l’admin.', icon: 'pencil' },
            { date: '[année]', title: 'Premier live sur Twitch', text: 'À compléter dans l’admin.', icon: 'star' },
            { date: '2026', title: 'Lancement du site officiel', text: 'Bienvenue ici !', icon: 'bubble' },
          ],
        },
      ],
    },
  })
  log('Page Biographie')
}

const links = await payload.findGlobal({ slug: 'links-page' })
if (!links.links?.length) {
  await payload.updateGlobal({
    slug: 'links-page',
    data: {
      links: [
        { label: 'Mes lives sur Twitch', url: 'https://www.twitch.tv/liratsu', icon: 'twitch', color: 'aero', highlight: true },
        { label: 'Le Discord de la commu', url: 'https://discord.gg/aHWbGZH6g2', icon: 'discord', color: 'lagoon' },
        { label: 'Instagram', url: 'https://www.instagram.com/liratsu/', icon: 'instagram', color: 'candy' },
        { label: 'TikTok', url: 'https://www.tiktok.com/@liratsu_', icon: 'tiktok', color: 'star' },
        { label: 'Jouer à The Ratsu', url: '/arcade/the-ratsu', icon: 'gamepad', color: 'lime' },
      ],
    },
  })
  log('Page Liens')
}

// ---- Pages légales -----------------------------------------------------------
const legal: { slug: 'mentions-legales' | 'cgu' | 'cgv' | 'confidentialite' | 'cookies'; title: string; identity?: boolean }[] = [
  { slug: 'mentions-legales', title: 'Mentions légales', identity: false },
  { slug: 'cgu', title: 'Conditions générales d’utilisation' },
  { slug: 'cgv', title: 'Conditions générales de vente' },
  { slug: 'confidentialite', title: 'Politique de confidentialité' },
  { slug: 'cookies', title: 'Politique cookies' },
]
for (const l of legal) {
  if (await findOne('legal-pages', { slug: { equals: l.slug } })) continue
  const fromSource = path.resolve('legal-source', `${l.slug}.md`)
  const file = existsSync(fromSource) ? fromSource : path.resolve('src/seed/legal', `${l.slug}.md`)
  await payload.create({
    collection: 'legal-pages',
    data: { title: l.title, slug: l.slug, content: md(readFileSync(file, 'utf8')), lastUpdated: new Date().toISOString(), showIdentity: l.identity ?? false, _status: 'published' },
  })
  log(`Page légale « ${l.title} » (${path.relative(process.cwd(), file)})`)
}

// ---- Boutique (données de TEST) ---------------------------------------------
const zones = [
  { name: 'France', countries: 'FR, MC', base: 4.9, perExtraItem: 1.5, freeFrom: 60, delay: '3 à 5 jours ouvrés après fabrication' },
  { name: 'Union européenne', countries: 'BE, LU, DE, ES, IT, NL, PT, AT, IE, FI, SE, DK, PL, CZ, SK, SI, HR, HU, RO, BG, GR, CY, MT, EE, LV, LT', base: 7.9, perExtraItem: 2, delay: '5 à 10 jours ouvrés' },
  { name: 'Suisse & Royaume-Uni', countries: 'CH, GB', base: 9.9, perExtraItem: 2.5, delay: '7 à 12 jours ouvrés' },
  { name: 'Reste du monde', countries: '*', base: 14.9, perExtraItem: 3, delay: '10 à 20 jours ouvrés' },
]
for (const z of zones) {
  if (!(await findOne('shipping-zones', { name: { equals: z.name } }))) await payload.create({ collection: 'shipping-zones', data: z })
}
log('Zones de livraison')

let catId = (await findOne('categories', { slug: { equals: 'demo' } }))?.id
if (!catId) catId = (await payload.create({ collection: 'categories', data: { title: 'Démo', slug: 'demo' } })).id

const products = [
  {
    title: '[TEST] Poster « Aquarium de nuit »',
    slug: 'test-poster-aquarium',
    fulfillment: 'gelato' as const,
    badge: 'produit test',
    price: 19.9,
    shortDescription: 'Produit de démonstration imprimé à la demande (Gelato). À supprimer avant la mise en ligne.',
    variants: [
      { label: 'A4', sku: 'TEST-POSTER-A4', gelatoProductUid: 'flat_210x297-mm-8x12-inch_170-gsm-65lb-uncoated_4-0_ver', gelatoFileUrl: 'https://liratsu.fr/img/liratsu-avatar.png' },
      { label: 'A3', sku: 'TEST-POSTER-A3', price: 27.9, gelatoProductUid: 'flat_297x420-mm-12x16-inch_170-gsm-65lb-uncoated_4-0_ver', gelatoFileUrl: 'https://liratsu.fr/img/liratsu-avatar.png' },
    ],
  },
  {
    title: '[TEST] Pack de stickers bulles',
    slug: 'test-stickers-bulles',
    fulfillment: 'stock' as const,
    badge: 'édition limitée',
    price: 6,
    shortDescription: 'Produit de démonstration en stock propre. À supprimer avant la mise en ligne.',
    variants: [{ label: 'Pack de 6', sku: 'TEST-STICK-6', stock: 25 }],
  },
]
for (const p of products) {
  if (await findOne('products', { slug: { equals: p.slug } })) continue
  await payload.create({
    collection: 'products',
    data: { ...p, categories: [catId], images: [{ image: avatarId }], vatKey: 'standard', _status: 'published' },
  })
}
log('Produits de test')

const coupons = [
  { code: 'TEST10', type: 'percent' as const, value: 10, note: 'Code de test : -10 %', maxUsesPerCustomer: 1 },
  { code: 'TESTPORT', type: 'freeShipping' as const, value: 0, note: 'Code de test : livraison offerte', minAmount: 15 },
  { code: 'TEST5', type: 'fixed' as const, value: 5, note: 'Code de test : -5 €', minAmount: 20 },
]
for (const c of coupons) {
  if (!(await findOne('coupons', { code: { equals: c.code } }))) await payload.create({ collection: 'coupons', data: { ...c, active: true } })
}
log('Codes promo de test')

// ---- Communauté & surprises ----------------------------------------------------
let wallpaper = (await findOne('downloads', { title: { equals: 'Fond d’écran Liratsu (démo)' } }))?.id
if (!wallpaper) {
  const file = await payload.create({ collection: 'protected-files', data: { label: 'Fond démo' }, filePath: path.resolve('public/img/liratsu-avatar.png') })
  wallpaper = (
    await payload.create({
      collection: 'downloads',
      data: { title: 'Fond d’écran Liratsu (démo)', kind: 'wallpaper', preview: avatarId, files: [{ format: 'phone', file: file.id }], locked: true },
    })
  ).id
}
{
  const dl = await payload.findByID({ collection: 'downloads', id: wallpaper, depth: 0 })
  if (!dl.files?.length) {
    const file = await payload.create({ collection: 'protected-files', data: { label: 'Fond démo' }, filePath: path.resolve('public/img/liratsu-avatar.png') })
    await payload.update({ collection: 'downloads', id: wallpaper, data: { files: [{ format: 'phone', file: file.id }] } })
  }
}
const codes = [
  { code: 'BULLE-DEMO', source: 'live' as const, message: 'Code donné en live : bravo !' },
  { code: 'GLOUGLOU-DEMO', source: 'easterEgg' as const, message: 'Tu as trouvé le poisson doré !' },
  { code: 'RATSU-DEMO', source: 'game' as const, message: 'Débloqué dans The Ratsu !' },
]
const codeIds: Record<string, number> = {}
for (const c of codes) {
  const existing = await findOne('surprise-codes', { code: { equals: c.code } })
  codeIds[c.code] = existing?.id ?? (await payload.create({ collection: 'surprise-codes', data: { ...c, unlocks: [wallpaper], active: true } })).id
}
await payload.updateGlobal({ slug: 'easter-eggs', data: { secretReward: codeIds['GLOUGLOU-DEMO'] } })
const game = await payload.findGlobal({ slug: 'game-settings' })
if (!game.ratsu?.unlocks?.length) {
  await payload.updateGlobal({
    slug: 'game-settings',
    data: { ratsu: { ...game.ratsu, unlocks: [{ condition: 'floor', threshold: 3, reward: codeIds['RATSU-DEMO'], message: 'Étage 3 atteint : un fond d’écran se débloque !' }] } },
  })
}
if (!(await findOne('polls', { question: { like: 'prochain stream' } }))) {
  await payload.create({
    collection: 'polls',
    data: { question: 'Quel type de prochain stream spécial ?', active: true, options: [{ label: 'Dessin de vos persos', votes: 0 }, { label: 'Jeu d’horreur mignon', votes: 0 }, { label: 'Karaoké', votes: 0 }] },
  })
}
if (!(await findOne('announcements', { title: { like: 'Bienvenue' } }))) {
  await payload.create({ collection: 'announcements', data: { title: 'Bienvenue sur le nouveau site !', pinned: true, body: md('Le site officiel est en ligne ✦ Explore, joue à **The Ratsu** et cherche les easter eggs…') } })
}
log('Communauté, codes surprise, sondage')

// ---- Arcade : registre des jeux -----------------------------------------------
if (!(await findOne('games', { slug: { equals: 'the-ratsu' } }))) {
  await payload.create({
    collection: 'games',
    data: {
      title: 'The Ratsu',
      slug: 'the-ratsu',
      status: 'live',
      order: 0,
      tagline: 'Die & retry aquatique : bulles, poissons rouges et pop-ups d’erreur.',
      color: '#3FA9F5',
      engine: 'ratsu',
    },
  })
}
if (!(await findOne('games', { slug: { equals: 'bulle-panik' } }))) {
  await payload.create({
    collection: 'games',
    data: {
      title: 'Bulle Panik',
      slug: 'bulle-panik',
      status: 'live',
      order: 1,
      tagline: 'Un mini-jeu de démonstration codé en HTML/JS, ajouté depuis l’admin.',
      color: '#FF7EB6',
      engine: 'custom',
      code: DEMO_CUSTOM_GAME,
    },
  })
}
log('Arcade : jeux')

console.log('✔ Seed terminé.')
process.exit(0)
