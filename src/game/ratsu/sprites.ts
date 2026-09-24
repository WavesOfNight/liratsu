/**
 * Pixel art original, défini en texte puis pré-rendu sur des canvas hors-écran.
 * Liratsu chibi : cheveux châtains, mèche rouge, lunettes, casque audio.
 */
const PALETTE: Record<string, string> = {
  h: '#7a4428',
  H: '#4a2616',
  s: '#ffe2cc',
  g: '#6b3f26',
  e: '#7fb8e6',
  p: '#2c2c3a',
  P: '#55556a',
  r: '#d8323c',
  b: '#26263a',
  B: '#3a3a55',
  w: '#ffffff',
  m: '#f08070',
  c: '#ff9bb5',
}

const PLAYER = [
  '...hhhhhh...',
  '..hhhhhhhh..',
  '.phhhhhhhhp.',
  'pPhHhhhhHhPp',
  'pPhsssssshPp',
  'pPgegsgegsPp',
  '.phssssssrp.',
  '..hscssmch..',
  '..hhssssrh..',
  '...bbbbbb...',
  '..sbBbbBbs..',
  '..sbbbbbbs..',
  '...bb..bb...',
  '...HH..HH...',
]

export function spriteCanvas(rows: string[], palette = PALETTE): HTMLCanvasElement {
  const h = rows.length
  const w = Math.max(...rows.map((r) => r.length))
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const col = palette[ch]
      if (!col) return
      ctx.fillStyle = col
      ctx.fillRect(x, y, 1, 1)
    }),
  )
  return c
}

let cache: Record<string, HTMLCanvasElement> | null = null
export function sprites() {
  if (cache) return cache
  const flip = (src: HTMLCanvasElement) => {
    const c = document.createElement('canvas')
    c.width = src.width
    c.height = src.height
    const ctx = c.getContext('2d')!
    ctx.translate(src.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(src, 0, 0)
    return c
  }
  const player = spriteCanvas(PLAYER)
  cache = { player, playerLeft: flip(player) }
  return cache
}

/** Cœur pixel (plein, moitié ou vide) pour la barre de vie. */
export function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, fill: 0 | 0.5 | 1) {
  const shape = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...']
  shape.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (ch !== 'X') return
      const full = fill === 1 || (fill === 0.5 && i < 4)
      ctx.fillStyle = full ? (j === 1 && i === 1 ? '#ffc2cf' : '#ff3d6a') : '#3b2a44'
      ctx.fillRect(x + i, y + j, 1, 1)
    }),
  )
  ctx.fillStyle = '#1b2240'
}
