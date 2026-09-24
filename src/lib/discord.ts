/**
 * Envoi du planning sur Discord : une image carrée façon Frutiger Aero (jaquettes des
 * jeux, jour/heure/titre), postée sur le webhook configuré dans l'admin (Clés API >
 * Discord). Aucune dépendance externe : composition d'image avec sharp (SVG + rasterisation).
 */
import sharp from 'sharp'
import { getIntegrations } from './settings'

export type ScheduleItemForDiscord = { day: string; time: string; title: string; icon: string; boxArtUrl?: string | null; cancelled?: boolean }

const TILE = 260
const GAP = 16
const PAD = 28
const COLS_MAX = 4

const escXml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c] as string)

/** Coupe un texte à `max` caractères pour qu'il tienne sur une ligne de la carte. */
function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!r.ok) return null
    return Buffer.from(await r.arrayBuffer())
  } catch {
    return null
  }
}

/** Rend l'image PNG du planning (carte carrée par jour de stream). */
export async function renderScheduleImage(items: ScheduleItemForDiscord[]): Promise<Buffer> {
  const list = items.slice(0, 8)
  const cols = Math.min(COLS_MAX, Math.max(1, list.length))
  const rows = Math.ceil(list.length / cols) || 1
  const headerH = 74
  const W = PAD * 2 + cols * TILE + (cols - 1) * GAP
  const H = headerH + PAD + rows * TILE + (rows - 1) * GAP + PAD

  const boxArts = await Promise.all(
    list.map(async (it) => {
      const buf = it.boxArtUrl ? await fetchImageBuffer(it.boxArtUrl) : null
      if (!buf) return null
      try {
        return await sharp(buf).resize(TILE, TILE, { fit: 'cover', position: 'attention' }).png().toBuffer()
      } catch {
        return null
      }
    }),
  )

  const positions = list.map((_, i) => ({ x: PAD + (i % cols) * (TILE + GAP), y: headerH + PAD + Math.floor(i / cols) * (TILE + GAP) }))

  const backgroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8fd3ff"/>
        <stop offset="1" stop-color="#eaf5ff"/>
      </linearGradient>
      <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#bfe8ff"/>
        <stop offset="1" stop-color="#3fa9f5"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#sky)"/>
    <text x="${W / 2}" y="46" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#1e6fd9" stroke="#ffffff" stroke-width="2" paint-order="stroke">✦ Planning de la semaine ✦</text>
    ${positions.map((p) => `<rect x="${p.x - 3}" y="${p.y - 3}" width="${TILE + 6}" height="${TILE + 6}" rx="18" fill="url(#card)"/>`).join('')}
  </svg>`

  let img = sharp(Buffer.from(backgroundSvg))
  const artComposites = boxArts
    .map((buf, i) => (buf ? { input: buf, top: positions[i].y, left: positions[i].x } : null))
    .filter((c): c is { input: Buffer; top: number; left: number } => c !== null)
  if (artComposites.length) img = img.composite(artComposites)
  const withArt = await img.png().toBuffer()

  const overlaySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    ${list
      .map((it, i) => {
        const p = positions[i]
        const barH = 74
        const opacity = it.cancelled ? 0.55 : 1
        return `<g opacity="${opacity}">
          <rect x="${p.x}" y="${p.y}" width="${TILE}" height="${TILE}" rx="14" fill="none" stroke="#ffffff" stroke-width="4"/>
          ${boxArts[i] ? '' : `<rect x="${p.x}" y="${p.y}" width="${TILE}" height="${TILE}" rx="14" fill="#1e6fd9"/><text x="${p.x + TILE / 2}" y="${p.y + TILE / 2 + 24}" text-anchor="middle" font-size="64">${escXml(it.icon)}</text>`}
          <rect x="${p.x}" y="${p.y + TILE - barH}" width="${TILE}" height="${barH}" rx="0" fill="rgba(11,26,58,0.82)"/>
          <text x="${p.x + 12}" y="${p.y + TILE - barH + 24}" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#ffffff">${escXml(truncate(it.day, 16))}</text>
          <text x="${p.x + TILE - 12}" y="${p.y + TILE - barH + 24}" text-anchor="end" font-family="Arial, sans-serif" font-size="13" fill="#eaf5ff">${escXml(it.time)}</text>
          <text x="${p.x + 12}" y="${p.y + TILE - 12}" font-family="Arial, sans-serif" font-size="14" fill="#ffffff">${escXml(truncate(it.cancelled ? `${it.title} (annulé)` : it.title, 24))}</text>
        </g>`
      })
      .join('')}
  </svg>`

  return sharp(withArt)
    .composite([{ input: Buffer.from(overlaySvg) }])
    .png()
    .toBuffer()
}

/** Poste le planning (image + court message) sur le webhook Discord configuré. Ne jette jamais. */
export async function sendScheduleToDiscord(items: ScheduleItemForDiscord[]): Promise<{ ok: boolean; error?: string }> {
  const { discord } = await getIntegrations()
  if (!discord.scheduleWebhookUrl) return { ok: false, error: 'Webhook Discord non configuré.' }
  if (!items.length) return { ok: false, error: 'Planning vide.' }
  try {
    const png = await renderScheduleImage(items)
    const form = new FormData()
    form.append('payload_json', JSON.stringify({ content: '✦ **Nouveau planning de la semaine !** Voici les prochains streams ✦' }))
    form.append('files[0]', new Blob([new Uint8Array(png)], { type: 'image/png' }), 'planning.png')
    const r = await fetch(discord.scheduleWebhookUrl, { method: 'POST', body: form })
    if (!r.ok) return { ok: false, error: `Discord a répondu ${r.status}` }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur inconnue' }
  }
}
