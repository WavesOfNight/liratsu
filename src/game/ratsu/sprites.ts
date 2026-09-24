/** Cœur pixel (plein, moitié ou vide) pour la barre de vie — HUD, dessiné à la volée. */
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
