/**
 * Chargement des sprites/tileset embarqués (public/Game/Asset The Ratsu) — plus configurable
 * depuis l'admin, ce sont les seuls visuels du jeu avec le pixel art procédural de repli
 * (src/game/ratsu/sprites.ts) pour tout ce qui n'a pas encore d'image dédiée.
 */
export type PlayerDir = 'up' | 'down' | 'left' | 'right'
export type SaacDir = 'downLeft' | 'downRight' | 'upLeft' | 'upRight'

export type RatsuAssets = {
  player: Record<PlayerDir, HTMLImageElement[]>
  blob: HTMLImageElement
  saac: Record<SaacDir, HTMLImageElement>
  floors: { shop: HTMLImageElement; itemroom: HTMLImageElement; normal: HTMLImageElement[] }
  bomb: { icon: HTMLImageElement; frames: HTMLImageElement[] }
  bombContainer: HTMLImageElement
  itemContainer: HTMLImageElement
  coin: HTMLImageElement
  heartFull: HTMLImageElement
}

const BASE = '/Game/Asset The Ratsu'

async function loadImage(path: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.decoding = 'sync'
  img.src = encodeURI(`${BASE}${path}`)
  await img.decode()
  return img
}

let cache: Promise<RatsuAssets> | null = null

export function loadRatsuAssets(): Promise<RatsuAssets> {
  if (!cache) {
    cache = (async () => {
      const playerFrames = (dir: string) => Promise.all([1, 2, 3, 4, 5].map((n) => loadImage(`/Sprite/Ratsu/${dir}/${n}.png`)))
      const [
        up,
        down,
        left,
        right,
        blob,
        downLeft,
        downRight,
        upLeft,
        upRight,
        red,
        stone,
        wood,
        bad,
        shop,
        itemroom,
        bombIcon,
        bomb1,
        bomb2,
        bombContainer,
        itemContainer,
        coin,
        heartFull,
      ] = await Promise.all([
        playerFrames('Up'),
        playerFrames('Down'),
        playerFrames('Left'),
        playerFrames('Right'),
        loadImage('/Sprite/Ennemi/blob/blob.png'),
        loadImage('/Sprite/Ennemi/the saac/down_left.png'),
        loadImage('/Sprite/Ennemi/the saac/down_right.png'),
        loadImage('/Sprite/Ennemi/the saac/UP_Left.png'),
        loadImage('/Sprite/Ennemi/the saac/up_right.png'),
        loadImage('/Tileset/Sol/RedFloor.png'),
        loadImage('/Tileset/Sol/Stone_Floor.png'),
        loadImage('/Tileset/Sol/Wood_Floor.png'),
        loadImage('/Tileset/Sol/bad_floor.png'),
        loadImage('/Tileset/Sol/Shop_Floor.png'),
        loadImage('/Tileset/Sol/itemroom_floor.png'),
        loadImage('/Item/Bomb.png'),
        loadImage('/Item/bombanimation/Bomb_1.png'),
        loadImage('/Item/bombanimation/Bomb_2png.png'),
        loadImage('/HUD/Bomb Contener.png'),
        loadImage('/HUD/Item Contener.png'),
        loadImage('/Item/Coin.png'),
        loadImage('/HUD/Completeheart.png'),
      ])
      const assets: RatsuAssets = {
        player: { up, down, left, right },
        blob,
        saac: { downLeft, downRight, upLeft, upRight },
        floors: { shop, itemroom, normal: [red, stone, wood, bad] },
        bomb: { icon: bombIcon, frames: [bomb1, bomb2] },
        bombContainer,
        itemContainer,
        coin,
        heartFull,
      }
      return assets
    })()
  }
  return cache
}

/** Redimensionne en conservant le ratio natif : la plus grande dimension vaut `maxDim`. */
export function fitSize(nativeW: number, nativeH: number, maxDim: number): { w: number; h: number } {
  const scale = maxDim / Math.max(nativeW, nativeH)
  return { w: nativeW * scale, h: nativeH * scale }
}

/** Pré-réduit une texture (ex. 120×120) à la taille d'une tuile de jeu pour un motif net et répétable. */
export function tileCanvas(img: HTMLImageElement, size: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, 0, 0, size, size)
  return c
}
