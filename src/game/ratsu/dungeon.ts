/**
 * Génération procédurale d'un étage : grille de salles reliées, avec une salle de départ,
 * une salle de boss (la plus éloignée), une salle trésor et une boutique (culs-de-sac).
 */
import type { Rng } from './rng'

export type RoomKind = 'start' | 'normal' | 'treasure' | 'shop' | 'boss'
export type Dir = 'up' | 'down' | 'left' | 'right'
export const DIRS: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }
export const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' }

export type Room = {
  x: number
  y: number
  kind: RoomKind
  doors: Partial<Record<Dir, true>>
  cleared: boolean
  visited: boolean
  rocks: [number, number][] // tuiles bloquantes
  pickupsTaken: boolean
}

export type Floor = { rooms: Map<string, Room>; start: Room; index: number; floorTheme: number }

export const COLS = 13 // tuiles jouables en largeur
export const ROWS = 7 // tuiles jouables en hauteur
const GRID = 9
const key = (x: number, y: number) => `${x},${y}`

export function generateFloor(rng: Rng, index: number): Floor {
  const target = Math.min(18, 7 + index * 2 + rng.int(0, 2))
  for (let attempt = 0; attempt < 50; attempt++) {
    const rooms = new Map<string, Room>()
    const make = (x: number, y: number, kind: RoomKind = 'normal'): Room => ({ x, y, kind, doors: {}, cleared: false, visited: false, rocks: [], pickupsTaken: false })
    const start = make(4, 4, 'start')
    start.cleared = true
    rooms.set(key(4, 4), start)
    const frontier = [start]
    while (rooms.size < target && frontier.length) {
      const from = rng.pick(frontier)
      const dir = rng.pick(Object.keys(DIRS) as Dir[])
      const [dx, dy] = DIRS[dir]
      const nx = from.x + dx
      const ny = from.y + dy
      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID || rooms.has(key(nx, ny))) continue
      // Évite les blocs trop compacts : au plus 1 voisin existant.
      const neighbours = (Object.values(DIRS) as [number, number][]).filter(([ax, ay]) => rooms.has(key(nx + ax, ny + ay))).length
      if (neighbours > 1 && rng.chance(0.8)) continue
      const room = make(nx, ny)
      rooms.set(key(nx, ny), room)
      frontier.push(room)
    }
    // Portes entre salles adjacentes
    for (const r of rooms.values()) {
      for (const [d, [dx, dy]] of Object.entries(DIRS) as [Dir, [number, number]][]) if (rooms.has(key(r.x + dx, r.y + dy))) r.doors[d] = true
    }
    // Culs-de-sac triés par distance (BFS)
    const dist = new Map<string, number>([[key(4, 4), 0]])
    const queue = [start]
    while (queue.length) {
      const r = queue.shift()!
      for (const d of Object.keys(r.doors) as Dir[]) {
        const [dx, dy] = DIRS[d]
        const k = key(r.x + dx, r.y + dy)
        if (!dist.has(k)) {
          dist.set(k, dist.get(key(r.x, r.y))! + 1)
          queue.push(rooms.get(k)!)
        }
      }
    }
    const deadEnds = [...rooms.values()].filter((r) => r !== start && Object.keys(r.doors).length === 1).sort((a, b) => dist.get(key(b.x, b.y))! - dist.get(key(a.x, a.y))!)
    if (deadEnds.length < 3) continue
    deadEnds[0].kind = 'boss'
    deadEnds[1].kind = 'treasure'
    deadEnds[2].kind = 'shop'
    deadEnds[1].cleared = deadEnds[2].cleared = true
    // Obstacles (coraux-bulles) dans les salles normales
    for (const r of rooms.values()) {
      if (r.kind !== 'normal') continue
      const layout = rng.int(0, 4)
      const rocks: [number, number][] = []
      if (layout === 1) rocks.push([3, 2], [9, 2], [3, 4], [9, 4])
      if (layout === 2) for (let x = 4; x <= 8; x++) rocks.push([x, 3])
      if (layout === 3) rocks.push([2, 1], [10, 1], [2, 5], [10, 5], [6, 3])
      if (layout === 4) rocks.push([5, 2], [7, 2], [5, 4], [7, 4])
      r.rocks = rocks
    }
    return { rooms, start, index, floorTheme: rng.int(0, 3) }
  }
  throw new Error('Génération impossible')
}

export const roomAt = (floor: Floor, x: number, y: number) => floor.rooms.get(key(x, y))
