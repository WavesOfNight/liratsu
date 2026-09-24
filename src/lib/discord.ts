/**
 * Envoi du planning sur Discord : une image carrée façon Frutiger Aero (jaquettes des
 * jeux, jour/heure/titre), postée sur le webhook configuré dans l'admin (Clés API >
 * Discord). Aucune dépendance externe : composition d'image avec sharp (SVG + rasterisation).
 */
import sharp from 'sharp'
import { getIntegrations } from './settings'

export type ScheduleItemForDiscord = { day: string; time: string; title: string; icon: string; boxArtUrl?: string | null; cancelled?: boolean }

// Rendu en haute résolution (les jaquettes sont maintenant récupérées en 564×752, voir
// searchGameBoxArt) : une image nette même agrandie ou vue sur un écran haute densité.
const TILE = 360
const GAP = 20
const PAD = 32
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

/** Icône étoile à 4 branches (même silhouette que le sticker du site), centrée sur (cx, cy). */
function starPath(cx: number, cy: number, r: number): string {
  const r2 = r * 0.38
  const pts = [
    [cx, cy - r],
    [cx + r2, cy - r2],
    [cx + r, cy],
    [cx + r2, cy + r2],
    [cx, cy + r],
    [cx - r2, cy + r2],
    [cx - r, cy],
    [cx - r2, cy - r2],
  ]
  return `M ${pts.map((p) => p.join(',')).join(' L ')} Z`
}

/** Rend l'image PNG du planning : une fenêtre « Aero » (même look que le site), avec les cartes des streams. */
export async function renderScheduleImage(items: ScheduleItemForDiscord[]): Promise<Buffer> {
  const list = items.slice(0, 8)
  const cols = Math.min(COLS_MAX, Math.max(1, list.length))
  const rows = Math.ceil(list.length / cols) || 1
  const barH = 64
  const margin = 24
  const winPad = PAD
  const W = margin * 2 + winPad * 2 + cols * TILE + (cols - 1) * GAP
  const H = margin * 2 + barH + winPad * 2 + rows * TILE + (rows - 1) * GAP
  const winX = margin
  const winY = margin
  const winW = W - margin * 2

  const boxArts = await Promise.all(
    list.map(async (it) => {
      const buf = it.boxArtUrl ? await fetchImageBuffer(it.boxArtUrl) : null
      if (!buf) return null
      try {
        return await sharp(buf).resize(TILE, TILE, { fit: 'cover', position: 'attention', kernel: 'lanczos3' }).sharpen({ sigma: 0.5 }).png().toBuffer()
      } catch {
        return null
      }
    }),
  )

  const positions = list.map((_, i) => ({
    x: winX + winPad + (i % cols) * (TILE + GAP),
    y: winY + barH + winPad + Math.floor(i / cols) * (TILE + GAP),
  }))

  // Barre de titre façon fenêtre Aero du site : dégradé bleu clair, étoile, titre, 3 boutons
  // décoratifs (réduire / agrandir / fermer, mêmes couleurs que .aero-window__ctrl en CSS).
  const ctrlH = 28
  const ctrlY = winY + (barH - ctrlH) / 2
  const ctrlBtn = (x: number, kind: 'min' | 'max' | 'close') => {
    const w = kind === 'close' ? 38 : 28
    const fill = kind === 'close' ? 'url(#ctrlClose)' : 'url(#ctrlNeutral)'
    const stroke = kind === 'close' ? 'rgba(140,20,50,.45)' : 'rgba(15,42,92,.35)'
    const icon =
      kind === 'min'
        ? `<rect x="${x + 8}" y="${ctrlY + 18}" width="12" height="2.5" fill="#0f2a5c"/>`
        : kind === 'max'
          ? `<rect x="${x + 8}" y="${ctrlY + 8}" width="12" height="12" fill="none" stroke="#0f2a5c" stroke-width="2"/>`
          : `<path d="M ${x + 10} ${ctrlY + 9} L ${x + w - 10} ${ctrlY + 19} M ${x + w - 10} ${ctrlY + 9} L ${x + 10} ${ctrlY + 19}" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>`
    return `<rect x="${x}" y="${ctrlY}" width="${w}" height="${ctrlH}" rx="7" fill="${fill}" stroke="${stroke}"/>${icon}`
  }
  const closeX = winX + winW - 16 - 38
  const maxX = closeX - 10 - 28
  const minX = maxX - 10 - 28

  const backgroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8fd3ff"/>
        <stop offset="1" stop-color="#eaf5ff"/>
      </linearGradient>
      <linearGradient id="titlebar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e6f6ff"/>
        <stop offset="0.48" stop-color="#b5e2ff"/>
        <stop offset="0.5" stop-color="#86cdfb"/>
        <stop offset="1" stop-color="#a9dcff"/>
      </linearGradient>
      <linearGradient id="ctrlNeutral" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="0.48" stop-color="#dff2ff"/>
        <stop offset="0.5" stop-color="#b9e1fb"/>
        <stop offset="1" stop-color="#d6efff"/>
      </linearGradient>
      <linearGradient id="ctrlClose" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffc2cf"/>
        <stop offset="0.48" stop-color="#ff8aa5"/>
        <stop offset="0.5" stop-color="#f0577c"/>
        <stop offset="1" stop-color="#ff8fab"/>
      </linearGradient>
      <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#bfe8ff"/>
        <stop offset="1" stop-color="#3fa9f5"/>
      </linearGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#0b1a3a" flood-opacity="0.25"/>
      </filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#sky)"/>
    <g filter="url(#softShadow)">
      <rect x="${winX}" y="${winY}" width="${winW}" height="${H - margin * 2}" rx="18" fill="#ffffff"/>
      <path d="M ${winX} ${winY + 18} a 18 18 0 0 1 18 -18 h ${winW - 36} a 18 18 0 0 1 18 18 v ${barH - 18} h -${winW} Z" fill="url(#titlebar)"/>
      <path d="${starPath(winX + 32, winY + barH / 2, 14)}" fill="#ffd35c" stroke="#ffffff" stroke-width="2"/>
      <text x="${winX + 58}" y="${winY + barH / 2 + 8}" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#0f2a5c">Planning de la semaine</text>
      ${ctrlBtn(minX, 'min')}
      ${ctrlBtn(maxX, 'max')}
      ${ctrlBtn(closeX, 'close')}
    </g>
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
        const barH = 92
        const opacity = it.cancelled ? 0.55 : 1
        return `<g opacity="${opacity}">
          <rect x="${p.x}" y="${p.y}" width="${TILE}" height="${TILE}" rx="18" fill="none" stroke="#ffffff" stroke-width="5"/>
          ${boxArts[i] ? '' : `<rect x="${p.x}" y="${p.y}" width="${TILE}" height="${TILE}" rx="18" fill="#1e6fd9"/><text x="${p.x + TILE / 2}" y="${p.y + TILE / 2 + 30}" text-anchor="middle" font-size="88">${escXml(it.icon)}</text>`}
          <rect x="${p.x}" y="${p.y + TILE - barH}" width="${TILE}" height="${barH}" rx="0" fill="rgba(11,26,58,0.85)"/>
          <text x="${p.x + 16}" y="${p.y + TILE - barH + 30}" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#ffffff">${escXml(truncate(it.day, 22))}</text>
          <text x="${p.x + TILE - 16}" y="${p.y + TILE - barH + 30}" text-anchor="end" font-family="Arial, sans-serif" font-size="16" fill="#eaf5ff">${escXml(it.time)}</text>
          <text x="${p.x + 16}" y="${p.y + TILE - 16}" font-family="Arial, sans-serif" font-size="17" fill="#ffffff">${escXml(truncate(it.cancelled ? `${it.title} (annulé)` : it.title, 28))}</text>
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
