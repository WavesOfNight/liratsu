/**
 * The Saac — moteur du jeu (Canvas 2D, rendu basse résolution « pixel art »).
 * Die & retry vu de dessus : salles procédurales, ennemis thématiques internet/aquarium,
 * objets cumulables, boss à chaque étage, mort permanente.
 */
import { COLS, DIRS, type Dir, type Floor, generateFloor, OPPOSITE, type Room, ROWS, roomAt } from './dungeon'
import type { Input } from './input'
import { BASE_STATS, type Item, ITEMS, type Stats } from './items'
import { createRng, type Rng } from './rng'
import { drawHeart, sprites } from './sprites'

export const TILE = 24
export const W = COLS * TILE + TILE * 2 // 360
export const H = ROWS * TILE + TILE * 2 // 216
const LEFT = TILE
const TOP = TILE
const RIGHT = LEFT + COLS * TILE
const BOTTOM = TOP + ROWS * TILE
const CX = (LEFT + RIGHT) / 2
const CY = (TOP + BOTTOM) / 2

export type Difficulty = 'easy' | 'normal' | 'hard'
export type GameResult = { score: number; floor: number; won: boolean; durationMs: number; kills: number; rooms: number; seed: string; daily: boolean }
export type SoundName = 'shoot' | 'hurt' | 'pop' | 'coin' | 'notify'

type EnemyKind = 'goldfish' | 'bubble' | 'popup' | 'cursor' | 'lag' | 'troll' | 'boss'
type Enemy = { kind: EnemyKind; x: number; y: number; r: number; hp: number; maxHp: number; vx: number; vy: number; t: number; flash: number; phase: number }
type Shot = { x: number; y: number; vx: number; vy: number; r: number; life: number; dmg: number; friendly: boolean; pierce: boolean; homing: boolean; hit: Set<Enemy>; text?: string }
type Pickup = { kind: 'coin' | 'heart' | 'item' | 'portal'; x: number; y: number; item?: Item; price?: number }
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string }

type Options = {
  seed: string
  daily: boolean
  difficulty: Difficulty
  startHearts: number
  floors: number
  onEnd: (r: GameResult) => void
  onSound?: (s: SoundName) => void
}

const DIFF: Record<Difficulty, number> = { easy: 0.8, normal: 1, hard: 1.3 }

export class Game {
  state: 'title' | 'play' | 'pause' | 'dead' | 'win' = 'title'
  private rng: Rng
  private floor!: Floor
  private room!: Room
  private floorIndex = 0
  private stats: Stats
  private hearts: number
  private coins = 0
  private score = 0
  private kills = 0
  private roomsCleared = 0
  private items: Item[] = []
  private px = CX
  private py = CY
  private facingLeft = false
  private invuln = 0
  private cooldown = 0
  private enemies: Enemy[] = []
  private shots: Shot[] = []
  private pickups: Pickup[] = []
  private particles: Particle[] = []
  private message: { text: string; t: number } | null = null
  private playTime = 0
  private startedAt = 0
  private endSent = false
  private time = 0
  private m: number

  constructor(
    private ctx: CanvasRenderingContext2D,
    private input: Input,
    private opts: Options,
  ) {
    this.rng = createRng(opts.seed)
    this.m = DIFF[opts.difficulty]
    this.stats = { ...BASE_STATS, maxHearts: opts.startHearts }
    this.hearts = opts.startHearts
  }

  start() {
    this.state = 'play'
    this.startedAt = performance.now()
    this.enterFloor(0)
  }

  // ---------------------------------------------------------------- monde
  private enterFloor(index: number) {
    this.floorIndex = index
    this.floor = generateFloor(this.rng, index)
    if (index > 0) this.score += 200
    this.enterRoom(this.floor.start, null)
    this.say(`Étage ${index + 1}${index + 1 === this.opts.floors ? ' — dernier !' : ''}`)
  }

  private enterRoom(room: Room, from: Dir | null) {
    this.room = room
    room.visited = true
    this.shots = []
    this.enemies = []
    this.pickups = []
    if (from) {
      const [dx, dy] = DIRS[OPPOSITE[from]]
      this.px = CX + dx * (COLS / 2 - 1) * TILE
      this.py = CY + dy * (ROWS / 2 - 1) * TILE
    } else {
      this.px = CX
      this.py = CY
    }
    if (!room.cleared) this.spawnEnemies(room)
    if (room.kind === 'treasure' && !room.pickupsTaken) this.pickups.push({ kind: 'item', x: CX, y: CY - 8, item: this.rollItem() })
    if (room.kind === 'shop' && !room.pickupsTaken) {
      this.pickups.push({ kind: 'item', x: CX - 48, y: CY, item: this.rollItem(), price: 15 })
      this.pickups.push({ kind: 'item', x: CX, y: CY, item: this.rollItem(), price: 15 })
      this.pickups.push({ kind: 'heart', x: CX + 48, y: CY, price: 5 })
      this.say('Boutique de coquillages ✦')
    }
    if (room.kind === 'boss' && room.cleared) this.pickups.push({ kind: 'portal', x: CX, y: CY })
  }

  private rollItem(): Item {
    const owned = new Set(this.items.map((i) => i.id))
    const pool = ITEMS.filter((i) => !owned.has(i.id) || i.id === 'star' || i.id === 'glassheart')
    return this.rng.pick(pool.length ? pool : ITEMS)
  }

  private spawnEnemies(room: Room) {
    const f = this.floorIndex
    if (room.kind === 'boss') {
      const hp = (30 + f * 16) * this.m
      this.enemies.push({ kind: 'boss', x: CX, y: CY - 20, r: 16, hp, maxHp: hp, vx: 0, vy: 0, t: 1.5, flash: 0, phase: 0 })
      this.say(f % 2 === 0 ? 'BOSS : la Méga Pop-up d’erreur !' : 'BOSS : le Poisson-lune géant !')
      return
    }
    const pool: EnemyKind[] = ['goldfish', 'bubble', 'cursor', ...(f >= 1 ? (['popup', 'lag'] as EnemyKind[]) : []), ...(f >= 2 ? (['troll'] as EnemyKind[]) : [])]
    const count = Math.min(9, this.rng.int(2, 4) + f)
    for (let i = 0; i < count; i++) {
      const kind = this.rng.pick(pool)
      let x = 0
      let y = 0
      for (let tries = 0; tries < 20; tries++) {
        x = LEFT + this.rng.int(1, COLS - 2) * TILE + TILE / 2
        y = TOP + this.rng.int(1, ROWS - 2) * TILE + TILE / 2
        if (Math.hypot(x - this.px, y - this.py) > 70 && !this.solidAt(x, y)) break
      }
      const hp = ({ goldfish: 3, bubble: 2, popup: 4, cursor: 2, lag: 3, troll: 4, boss: 0 }[kind] + f * 0.6) * this.m
      const ang = this.rng.next() * Math.PI * 2
      this.enemies.push({ kind, x, y, r: kind === 'popup' ? 9 : 7, hp, maxHp: hp, vx: Math.cos(ang) * 60, vy: Math.sin(ang) * 60, t: this.rng.next() * 2, flash: 0, phase: this.rng.next() * 6 })
    }
  }

  private solidAt(x: number, y: number) {
    const tx = Math.floor((x - LEFT) / TILE)
    const ty = Math.floor((y - TOP) / TILE)
    return this.room.rocks.some(([rx, ry]) => rx === tx && ry === ty)
  }

  /** Déplacement avec collisions (murs, rochers) ; renvoie true si bloqué. */
  private moveCircle(o: { x: number; y: number }, r: number, dx: number, dy: number, allowDoors = false): boolean {
    let blocked = false
    const tryAxis = (nx: number, ny: number) => {
      const doorGap = allowDoors && this.room.cleared
      const inDoorX = Math.abs(ny - CY) < TILE / 2
      const inDoorY = Math.abs(nx - CX) < TILE / 2
      const minX = LEFT + r - (doorGap && inDoorX && this.room.doors.left ? TILE : 0)
      const maxX = RIGHT - r + (doorGap && inDoorX && this.room.doors.right ? TILE : 0)
      const minY = TOP + r - (doorGap && inDoorY && this.room.doors.up ? TILE : 0)
      const maxY = BOTTOM - r + (doorGap && inDoorY && this.room.doors.down ? TILE : 0)
      if (nx < minX || nx > maxX || ny < minY || ny > maxY) return false
      for (const [rx, ry] of this.room.rocks) {
        const bx = LEFT + rx * TILE
        const by = TOP + ry * TILE
        const cx = Math.max(bx, Math.min(nx, bx + TILE))
        const cy = Math.max(by, Math.min(ny, by + TILE))
        if (Math.hypot(nx - cx, ny - cy) < r) return false
      }
      return true
    }
    if (tryAxis(o.x + dx, o.y)) o.x += dx
    else blocked = true
    if (tryAxis(o.x, o.y + dy)) o.y += dy
    else blocked = true
    return blocked
  }

  // ---------------------------------------------------------------- boucle
  update(dt: number) {
    this.time += dt
    this.input.poll()
    if (this.message) {
      this.message.t -= dt
      if (this.message.t <= 0) this.message = null
    }
    if (this.state === 'title') {
      if (this.input.consumeConfirm()) this.start()
      return
    }
    if (this.state === 'dead' || this.state === 'win') {
      this.input.consumeConfirm()
      return
    }
    if (this.input.consumePause()) this.state = this.state === 'pause' ? 'play' : 'pause'
    if (this.state === 'pause') return
    this.playTime += dt

    // Joueur
    const s = this.stats
    const mv = this.input.move
    if (mv.x) this.facingLeft = mv.x < 0
    const p = { x: this.px, y: this.py }
    this.moveCircle(p, 6, mv.x * s.speed * dt, mv.y * s.speed * dt, true)
    this.px = p.x
    this.py = p.y
    this.invuln = Math.max(0, this.invuln - dt)
    this.cooldown -= dt
    const aim = this.input.aim
    if ((aim.x || aim.y) && this.cooldown <= 0) {
      this.cooldown = 1 / s.fireRate
      const base = Math.atan2(aim.y, aim.x)
      const n = s.multishot
      for (let i = 0; i < n; i++) {
        const a = base + (i - (n - 1) / 2) * 0.16
        this.shots.push({ x: this.px, y: this.py - 4, vx: Math.cos(a) * s.shotSpeed + mv.x * 20, vy: Math.sin(a) * s.shotSpeed + mv.y * 20, r: 3.5, life: s.range, dmg: s.damage, friendly: true, pierce: s.piercing, homing: s.homing, hit: new Set() })
      }
      if (aim.x) this.facingLeft = aim.x < 0
      this.opts.onSound?.('shoot')
    }

    // Changement de salle
    if (this.room.cleared) {
      const exits: [Dir, boolean][] = [
        ['left', this.px < LEFT - 2],
        ['right', this.px > RIGHT + 2],
        ['up', this.py < TOP - 2],
        ['down', this.py > BOTTOM + 2],
      ]
      for (const [d, out] of exits) {
        if (!out) continue
        const [dx, dy] = DIRS[d]
        const next = roomAt(this.floor, this.room.x + dx, this.room.y + dy)
        if (next) {
          this.enterRoom(next, d)
          return
        }
      }
    }

    this.updateEnemies(dt)
    this.updateShots(dt)
    this.updatePickups()
    for (const pt of this.particles) {
      pt.x += pt.vx * dt
      pt.y += pt.vy * dt
      pt.life -= dt
    }
    this.particles = this.particles.filter((pt) => pt.life > 0)

    if (!this.room.cleared && this.enemies.length === 0) {
      this.room.cleared = true
      this.roomsCleared++
      this.score += 25
      this.opts.onSound?.('notify')
      if (this.room.kind === 'boss') {
        this.score += 500
        this.pickups.push({ kind: 'portal', x: CX, y: CY })
        this.pickups.push({ kind: 'heart', x: CX - 30, y: CY + 30 })
        this.say(this.floorIndex + 1 >= this.opts.floors ? 'Victoire ! Plonge dans le portail ✦' : 'Boss vaincu ! Un portail-bulle apparaît…')
      } else if (this.rng.chance(0.3 + s.luck * 0.1)) {
        this.pickups.push({ kind: this.rng.chance(0.3) ? 'heart' : 'coin', x: CX, y: CY })
      }
    }
  }

  private hurtPlayer() {
    if (this.invuln > 0) return
    this.hearts -= 1
    this.invuln = 1.1
    this.opts.onSound?.('hurt')
    this.burst(this.px, this.py, '#ff5a7a', 10)
    if (this.hearts <= 0) this.end(false)
  }

  private end(won: boolean) {
    this.state = won ? 'win' : 'dead'
    if (won) this.score += 1000 + Math.max(0, Math.round(600 - this.playTime)) // bonus de rapidité
    if (this.endSent) return
    this.endSent = true
    this.opts.onEnd({
      score: Math.round(this.score),
      floor: this.floorIndex + 1,
      won,
      durationMs: Math.round(performance.now() - this.startedAt),
      kills: this.kills,
      rooms: this.roomsCleared,
      seed: this.opts.seed,
      daily: this.opts.daily,
    })
  }

  private enemyShot(e: Enemy, angle: number, speed: number, text?: string) {
    this.shots.push({ x: e.x, y: e.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: text ? 5 : 3, life: 3, dmg: 1, friendly: false, pierce: false, homing: false, hit: new Set(), text })
  }

  private updateEnemies(dt: number) {
    const m = this.m
    for (const e of this.enemies) {
      e.t -= dt
      e.flash = Math.max(0, e.flash - dt)
      const toP = Math.atan2(this.py - e.y, this.px - e.x)
      const dist = Math.hypot(this.px - e.x, this.py - e.y)
      switch (e.kind) {
        case 'goldfish': {
          const sp = 38 * m
          e.vx = Math.cos(toP) * sp
          e.vy = Math.sin(toP) * sp + Math.sin(this.time * 4 + e.phase) * 10
          this.moveCircle(e, e.r, e.vx * dt, e.vy * dt)
          break
        }
        case 'bubble': {
          if (this.moveCircle(e, e.r, e.vx * 0.5 * dt * m, e.vy * 0.5 * dt * m)) {
            const a = this.rng.next() * Math.PI * 2
            e.vx = Math.cos(a) * 60
            e.vy = Math.sin(a) * 60
          }
          break
        }
        case 'cursor': {
          const bx = this.moveCircle(e, e.r, e.vx * 1.6 * dt * m, 0)
          const by = this.moveCircle(e, e.r, 0, e.vy * 1.6 * dt * m)
          if (bx) e.vx = -e.vx
          if (by) e.vy = -e.vy
          break
        }
        case 'popup':
          if (e.t <= 0) {
            e.t = 2.2 / m
            this.enemyShot(e, toP, 85 * m)
          }
          break
        case 'lag':
          if (e.t <= 0) {
            e.t = 3 / m
            const a = this.rng.next() * Math.PI * 2
            const nx = this.px + Math.cos(a) * 60
            const ny = this.py + Math.sin(a) * 60
            if (nx > LEFT + 10 && nx < RIGHT - 10 && ny > TOP + 10 && ny < BOTTOM - 10 && !this.solidAt(nx, ny)) {
              this.burst(e.x, e.y, '#9be15d', 6)
              e.x = nx
              e.y = ny
            }
          }
          break
        case 'troll':
          this.moveCircle(e, e.r, Math.cos(toP) * 18 * m * dt, Math.sin(toP) * 18 * m * dt)
          if (e.t <= 0) {
            e.t = 2.6 / m
            for (const off of [-0.3, 0, 0.3]) this.enemyShot(e, toP + off, 70 * m, 'lol')
          }
          break
        case 'boss': {
          e.phase += dt
          const pattern = Math.floor(e.phase / 3.2) % 3
          if (pattern === 1) this.moveCircle(e, e.r, Math.cos(toP) * 55 * m * dt, Math.sin(toP) * 55 * m * dt)
          else this.moveCircle(e, e.r, Math.cos(this.time) * 20 * dt, Math.sin(this.time * 1.3) * 20 * dt)
          if (e.t <= 0) {
            if (pattern === 0) {
              e.t = 1.1 / m
              const n = 10 + this.floorIndex * 2
              for (let i = 0; i < n; i++) this.enemyShot(e, (i / n) * Math.PI * 2 + e.phase, 75 * m)
            } else if (pattern === 1) {
              e.t = 0.6 / m
              this.enemyShot(e, toP, 110 * m)
            } else {
              e.t = 2.4
              if (this.enemies.length < 6) {
                for (const side of [-1, 1]) this.enemies.push({ kind: 'bubble', x: e.x + side * 24, y: e.y + 10, r: 7, hp: 2 * m, maxHp: 2 * m, vx: side * 60, vy: 40, t: 0, flash: 0, phase: 0 })
              }
            }
          }
          break
        }
      }
      if (dist < e.r + 6) this.hurtPlayer()
    }
  }

  private updateShots(dt: number) {
    for (const s of this.shots) {
      if (s.homing && s.friendly) {
        const target = this.enemies.reduce<Enemy | null>((best, e) => (!best || Math.hypot(e.x - s.x, e.y - s.y) < Math.hypot(best.x - s.x, best.y - s.y) ? e : best), null)
        if (target) {
          const sp = Math.hypot(s.vx, s.vy)
          const a = Math.atan2(s.vy, s.vx)
          const want = Math.atan2(target.y - s.y, target.x - s.x)
          const na = a + Math.max(-4 * dt, Math.min(4 * dt, ((want - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI))
          s.vx = Math.cos(na) * sp
          s.vy = Math.sin(na) * sp
        }
      }
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.life -= dt
      if (s.x < LEFT || s.x > RIGHT || s.y < TOP || s.y > BOTTOM || this.solidAt(s.x, s.y)) s.life = 0
      if (s.friendly) {
        for (const e of this.enemies) {
          if (s.hit.has(e) || Math.hypot(e.x - s.x, e.y - s.y) > e.r + s.r) continue
          s.hit.add(e)
          e.hp -= s.dmg
          e.flash = 0.1
          if (!s.pierce) s.life = 0
          if (e.hp <= 0) this.killEnemy(e)
          if (!s.pierce) break
        }
      } else if (Math.hypot(this.px - s.x, this.py - s.y) < s.r + 5) {
        s.life = 0
        this.hurtPlayer()
      }
      if (s.life <= 0 && s.friendly) this.burst(s.x, s.y, '#bfe8ff', 3)
    }
    this.shots = this.shots.filter((s) => s.life > 0)
    this.enemies = this.enemies.filter((e) => e.hp > 0)
  }

  private killEnemy(e: Enemy) {
    this.kills++
    this.score += e.kind === 'boss' ? 0 : 10
    this.opts.onSound?.('pop')
    this.burst(e.x, e.y, e.kind === 'goldfish' ? '#ff8a3d' : '#bfe8ff', 12)
    if (e.kind === 'bubble') for (let i = 0; i < 4; i++) this.enemyShot(e, (i / 4) * Math.PI * 2 + Math.PI / 4, 70 * this.m)
    if (e.kind !== 'boss' && this.rng.chance(0.3 + this.stats.luck * 0.08)) this.pickups.push({ kind: 'coin', x: e.x, y: e.y })
    else if (e.kind !== 'boss' && this.rng.chance(0.04)) this.pickups.push({ kind: 'heart', x: e.x, y: e.y })
  }

  private updatePickups() {
    for (const p of this.pickups) {
      if (Math.hypot(p.x - this.px, p.y - this.py) > 12) continue
      if (p.kind === 'portal') {
        if (this.floorIndex + 1 >= this.opts.floors) this.end(true)
        else this.enterFloor(this.floorIndex + 1)
        return
      }
      if (p.price) {
        if (this.coins < p.price) {
          if (!this.message) this.say(`Il te faut ${p.price} coquillages`)
          continue
        }
        this.coins -= p.price
      }
      if (p.kind === 'coin') {
        this.coins++
        this.score += 5
        this.opts.onSound?.('coin')
      } else if (p.kind === 'heart') {
        if (this.hearts >= this.stats.maxHearts && !p.price) continue
        this.hearts = Math.min(this.stats.maxHearts, this.hearts + 1)
        this.opts.onSound?.('coin')
      } else if (p.kind === 'item' && p.item) {
        p.item.apply(this.stats)
        if (p.item.id === 'glassheart') this.hearts++
        this.items.push(p.item)
        this.say(`${p.item.name} : ${p.item.desc}`)
        this.opts.onSound?.('notify')
        if (this.room.kind === 'treasure') this.room.pickupsTaken = true
      }
      p.x = -999
    }
    this.pickups = this.pickups.filter((p) => p.x > -500)
    if (this.room.kind === 'shop' && this.pickups.length === 0) this.room.pickupsTaken = true
  }

  private burst(x: number, y: number, color: string, n: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = 30 + Math.random() * 60
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.3 + Math.random() * 0.3, color })
    }
  }

  private say(text: string) {
    this.message = { text, t: 2.6 }
  }

  // ---------------------------------------------------------------- rendu
  render() {
    const c = this.ctx
    c.imageSmoothingEnabled = false
    c.clearRect(0, 0, W, H)
    if (this.state === 'title') return this.renderTitle()
    this.renderRoom()
    for (const p of this.pickups) this.renderPickup(p)
    for (const e of this.enemies) this.renderEnemy(e)
    this.renderPlayer()
    for (const s of this.shots) this.renderShot(s)
    for (const pt of this.particles) {
      c.fillStyle = pt.color
      c.fillRect(Math.round(pt.x), Math.round(pt.y), 2, 2)
    }
    this.renderHud()
    if (this.state === 'pause') this.renderOverlay('PAUSE', 'Échap / P / Start pour reprendre')
    if (this.state === 'dead') this.renderBsod()
    if (this.state === 'win') this.renderWin()
  }

  private renderRoom() {
    const c = this.ctx
    // Eau et damier doux
    const g = c.createLinearGradient(0, TOP, 0, BOTTOM)
    g.addColorStop(0, '#7fd0ff')
    g.addColorStop(1, '#2a86e0')
    c.fillStyle = g
    c.fillRect(LEFT, TOP, COLS * TILE, ROWS * TILE)
    c.fillStyle = 'rgba(255,255,255,0.07)'
    for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) if ((x + y) % 2 === 0) c.fillRect(LEFT + x * TILE, TOP + y * TILE, TILE, TILE)
    // Rayons de lumière
    c.fillStyle = 'rgba(255,255,255,0.08)'
    for (let i = 0; i < 3; i++) {
      const x = LEFT + ((this.time * 8 + i * 110) % (COLS * TILE))
      c.beginPath()
      c.moveTo(x, TOP)
      c.lineTo(x + 20, TOP)
      c.lineTo(x - 30, BOTTOM)
      c.lineTo(x - 50, BOTTOM)
      c.fill()
    }
    // Murs : verre épais glossy
    c.fillStyle = this.room.kind === 'boss' ? '#3a1d5c' : this.room.kind === 'shop' ? '#1a6f5c' : '#123c72'
    c.fillRect(0, 0, W, TOP)
    c.fillRect(0, BOTTOM, W, TILE)
    c.fillRect(0, 0, LEFT, H)
    c.fillRect(RIGHT, 0, TILE, H)
    c.fillStyle = 'rgba(255,255,255,0.18)'
    c.fillRect(0, 0, W, 4)
    c.strokeStyle = '#bfe8ff'
    c.lineWidth = 2
    c.strokeRect(LEFT - 1, TOP - 1, COLS * TILE + 2, ROWS * TILE + 2)
    // Portes
    const open = this.room.cleared
    const door = (x: number, y: number, w: number, h: number, d: Dir) => {
      if (!this.room.doors[d]) return
      const next = roomAt(this.floor, this.room.x + DIRS[d][0], this.room.y + DIRS[d][1])
      c.fillStyle = next?.kind === 'boss' ? '#ff5a7a' : next?.kind === 'treasure' ? '#ffd35c' : next?.kind === 'shop' ? '#9be15d' : '#0b1a3a'
      c.fillRect(x, y, w, h)
      if (!open) {
        c.fillStyle = '#bfe8ff'
        for (let i = 0; i < 3; i++) {
          c.beginPath()
          c.arc(x + w / 2 + (w > h ? (i - 1) * 7 : 0), y + h / 2 + (h > w ? (i - 1) * 7 : 0), 3, 0, Math.PI * 2)
          c.fill()
        }
      }
    }
    door(CX - TILE / 2, 2, TILE, TOP - 2, 'up')
    door(CX - TILE / 2, BOTTOM, TILE, TILE - 2, 'down')
    door(2, CY - TILE / 2, LEFT - 2, TILE, 'left')
    door(RIGHT, CY - TILE / 2, TILE - 2, TILE, 'right')
    // Rochers : coraux-bulles roses
    for (const [rx, ry] of this.room.rocks) {
      const x = LEFT + rx * TILE
      const y = TOP + ry * TILE
      c.fillStyle = '#ff7eb6'
      c.beginPath()
      c.arc(x + 8, y + 14, 7, 0, Math.PI * 2)
      c.arc(x + 16, y + 10, 8, 0, Math.PI * 2)
      c.arc(x + 14, y + 18, 6, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = '#ffd1e4'
      c.fillRect(x + 12, y + 5, 3, 2)
    }
  }

  private renderPlayer() {
    const c = this.ctx
    if (this.invuln > 0 && Math.floor(this.time * 20) % 2 === 0) return
    const sp = sprites()
    const img = this.facingLeft ? sp.playerLeft : sp.player
    const bob = Math.abs(this.input.move.x) + Math.abs(this.input.move.y) > 0 ? Math.round(Math.sin(this.time * 14)) : 0
    c.fillStyle = 'rgba(11,26,58,0.35)'
    c.beginPath()
    c.ellipse(this.px, this.py + 8, 6, 2, 0, 0, Math.PI * 2)
    c.fill()
    c.drawImage(img, Math.round(this.px - 6), Math.round(this.py - 9 + bob))
  }

  private renderEnemy(e: Enemy) {
    const c = this.ctx
    const x = Math.round(e.x)
    const y = Math.round(e.y)
    const flash = e.flash > 0
    switch (e.kind) {
      case 'goldfish': {
        const dir = this.px < e.x ? -1 : 1
        c.save()
        c.translate(x, y)
        c.scale(dir, 1)
        c.fillStyle = flash ? '#fff' : '#ff8a3d'
        c.beginPath()
        c.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2)
        c.fill()
        c.beginPath()
        c.moveTo(-5, 0)
        c.lineTo(-11, -5)
        c.lineTo(-11, 5)
        c.fill()
        c.fillStyle = '#fff'
        c.fillRect(2, -3, 3, 3)
        c.fillStyle = '#1b2240'
        c.fillRect(3, -2, 2, 2)
        c.fillStyle = '#b3261e' // sourcils fâchés
        c.fillRect(1, -5, 4, 1)
        c.restore()
        break
      }
      case 'bubble':
        c.strokeStyle = flash ? '#fff' : '#e6f7ff'
        c.lineWidth = 1.5
        c.beginPath()
        c.arc(x, y, e.r, 0, Math.PI * 2)
        c.stroke()
        c.fillStyle = 'rgba(255,255,255,0.5)'
        c.fillRect(x - 4, y - 4, 3, 2)
        break
      case 'popup':
        c.fillStyle = flash ? '#fff' : '#eaf5ff'
        c.fillRect(x - 11, y - 8, 22, 16)
        c.fillStyle = '#3fa9f5'
        c.fillRect(x - 11, y - 8, 22, 4)
        c.fillStyle = '#ff5a7a'
        c.fillRect(x + 7, y - 7, 3, 2)
        c.fillStyle = '#d81e4b'
        c.font = 'bold 8px monospace'
        c.fillText('!', x - 2, y + 6)
        break
      case 'cursor':
        c.fillStyle = flash ? '#ff5a7a' : '#fff'
        c.strokeStyle = '#1b2240'
        c.beginPath()
        c.moveTo(x - 4, y - 7)
        c.lineTo(x - 4, y + 5)
        c.lineTo(x - 1, y + 2)
        c.lineTo(x + 2, y + 7)
        c.lineTo(x + 4, y + 6)
        c.lineTo(x + 1, y + 1)
        c.lineTo(x + 5, y + 1)
        c.closePath()
        c.fill()
        c.stroke()
        break
      case 'lag':
        for (let i = 0; i < 4; i++) {
          c.fillStyle = ['#9be15d', '#ff7eb6', '#2ec4c9', '#ffd35c'][i]
          c.fillRect(x - 7 + ((i * 5 + Math.floor(this.time * 30)) % 6) - 3, y - 7 + i * 4, 14, 3)
        }
        break
      case 'troll':
        c.fillStyle = flash ? '#fff' : '#f4f8ff'
        c.beginPath()
        c.ellipse(x, y, 9, 7, 0, 0, Math.PI * 2)
        c.fill()
        c.fillStyle = '#1b2240'
        c.fillRect(x - 4, y - 2, 2, 2)
        c.fillRect(x + 2, y - 2, 2, 2)
        c.fillRect(x - 3, y + 3, 6, 1)
        c.fillRect(x - 5, y - 4, 3, 1)
        c.fillRect(x + 2, y - 4, 3, 1)
        break
      case 'boss':
        if (this.floorIndex % 2 === 0) {
          c.fillStyle = flash ? '#fff' : '#eaf5ff'
          c.fillRect(x - 24, y - 16, 48, 32)
          c.fillStyle = '#1e6fd9'
          c.fillRect(x - 24, y - 16, 48, 7)
          c.fillStyle = '#ff5a7a'
          c.fillRect(x + 15, y - 15, 8, 5)
          c.fillStyle = '#d81e4b'
          c.font = 'bold 9px monospace'
          c.fillText('ERREUR', x - 17, y + 4)
          c.fillStyle = '#3fa9f5'
          c.fillRect(x - 10, y + 7, 20, 5)
        } else {
          c.fillStyle = flash ? '#fff' : '#ffd35c'
          c.beginPath()
          c.arc(x, y, 18, 0, Math.PI * 2)
          c.fill()
          c.fillStyle = '#ffb347'
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + this.time
            c.fillRect(x + Math.cos(a) * 20 - 2, y + Math.sin(a) * 20 - 2, 4, 4)
          }
          c.fillStyle = '#1b2240'
          c.fillRect(x - 7, y - 5, 4, 4)
          c.fillRect(x + 4, y - 5, 4, 4)
          c.fillRect(x - 5, y + 6, 10, 2)
        }
        break
    }
    if (e.kind === 'boss') {
      c.fillStyle = '#1b2240'
      c.fillRect(LEFT + 60, BOTTOM - 10, COLS * TILE - 120, 6)
      c.fillStyle = '#ff5a7a'
      c.fillRect(LEFT + 61, BOTTOM - 9, (COLS * TILE - 122) * Math.max(0, e.hp / e.maxHp), 4)
    }
  }

  private renderShot(s: Shot) {
    const c = this.ctx
    if (s.text) {
      c.fillStyle = '#ffd35c'
      c.font = 'bold 8px monospace'
      c.fillText(s.text, Math.round(s.x - 6), Math.round(s.y + 3))
      return
    }
    if (s.friendly) {
      c.fillStyle = 'rgba(230,247,255,0.9)'
      c.beginPath()
      c.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = '#fff'
      c.fillRect(Math.round(s.x - 2), Math.round(s.y - 2), 1.5, 1.5)
      c.strokeStyle = '#3fa9f5'
      c.lineWidth = 1
      c.stroke()
    } else {
      c.fillStyle = '#ff3d6a'
      c.beginPath()
      c.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      c.fill()
    }
  }

  private renderPickup(p: Pickup) {
    const c = this.ctx
    const bob = Math.sin(this.time * 3 + p.x) * 2
    if (p.kind === 'portal') {
      for (let i = 3; i > 0; i--) {
        c.strokeStyle = ['#ffd35c', '#ff7eb6', '#bfe8ff'][i - 1]
        c.lineWidth = 2
        c.beginPath()
        c.arc(p.x, p.y, 6 + i * 4 + Math.sin(this.time * 4 + i) * 1.5, 0, Math.PI * 2)
        c.stroke()
      }
      return
    }
    if (p.kind === 'coin') {
      c.fillStyle = '#ffd35c'
      c.beginPath()
      c.moveTo(p.x, p.y - 5 + bob)
      c.lineTo(p.x + 5, p.y + 3 + bob)
      c.lineTo(p.x - 5, p.y + 3 + bob)
      c.fill()
      c.fillStyle = '#fff4c2'
      c.fillRect(p.x - 1, p.y - 2 + bob, 2, 2)
    }
    if (p.kind === 'heart') drawHeart(c, Math.round(p.x - 3), Math.round(p.y - 3 + bob), 1)
    if (p.kind === 'item' && p.item) {
      c.fillStyle = '#eaf5ff'
      c.fillRect(p.x - 9, p.y + 6, 18, 6) // piédestal
      c.fillStyle = p.item.color
      c.beginPath()
      c.arc(p.x, p.y + bob, 7, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = '#1b2240'
      c.font = 'bold 9px sans-serif'
      c.textAlign = 'center'
      c.fillText(p.item.glyph, p.x, p.y + 3 + bob)
      c.textAlign = 'left'
    }
    if (p.price) {
      c.fillStyle = '#fff'
      c.font = '7px monospace'
      c.textAlign = 'center'
      c.fillText(`${p.price}◆`, p.x, p.y + 22)
      c.textAlign = 'left'
    }
  }

  private renderHud() {
    const c = this.ctx
    for (let i = 0; i < this.stats.maxHearts; i++) drawHeart(c, 6 + i * 9, 6, this.hearts > i ? 1 : 0)
    c.fillStyle = '#ffd35c'
    c.font = '8px monospace'
    c.fillText(`◆ ${this.coins}`, 6, 22)
    c.fillStyle = '#eaf5ff'
    c.fillText(`Étage ${this.floorIndex + 1}/${this.opts.floors}  ·  ${Math.round(this.score)} pts`, 110, 11)
    if (this.opts.daily) {
      c.fillStyle = '#ff7eb6'
      c.fillText('défi du jour', 110, 21)
    }
    // Mini-carte
    const size = 5
    const ox = W - 60
    const oy = 3
    for (const r of this.floor.rooms.values()) {
      const near = [...Object.keys(r.doors)].some((d) => {
        const [dx, dy] = DIRS[d as Dir]
        return roomAt(this.floor, r.x + dx, r.y + dy)?.visited
      })
      if (!r.visited && !near) continue
      c.fillStyle = r === this.room ? '#fff' : r.visited ? '#7fd0ff' : 'rgba(127,208,255,0.35)'
      if (r.kind === 'boss' && (r.visited || near)) c.fillStyle = r === this.room ? '#fff' : '#ff5a7a'
      if (r.kind === 'treasure' && (r.visited || near)) c.fillStyle = r === this.room ? '#fff' : '#ffd35c'
      if (r.kind === 'shop' && (r.visited || near)) c.fillStyle = r === this.room ? '#fff' : '#9be15d'
      c.fillRect(ox + r.x * (size + 1), oy + r.y * (size - 2), size, size - 3)
    }
    if (this.message) {
      c.font = 'bold 9px sans-serif'
      const w = c.measureText(this.message.text).width + 16
      c.fillStyle = 'rgba(11,26,58,0.8)'
      c.fillRect(CX - w / 2, BOTTOM - 26, w, 16)
      c.fillStyle = '#fff'
      c.textAlign = 'center'
      c.fillText(this.message.text, CX, BOTTOM - 15)
      c.textAlign = 'left'
    }
  }

  private renderOverlay(title: string, sub: string) {
    const c = this.ctx
    c.fillStyle = 'rgba(11,26,58,0.7)'
    c.fillRect(0, 0, W, H)
    c.fillStyle = '#fff'
    c.textAlign = 'center'
    c.font = 'bold 20px sans-serif'
    c.fillText(title, CX, CY - 4)
    c.font = '9px sans-serif'
    c.fillText(sub, CX, CY + 16)
    c.textAlign = 'left'
  }

  private renderTitle() {
    const c = this.ctx
    const g = c.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#8fd3ff')
    g.addColorStop(1, '#1e6fd9')
    c.fillStyle = g
    c.fillRect(0, 0, W, H)
    for (let i = 0; i < 14; i++) {
      c.strokeStyle = 'rgba(255,255,255,0.6)'
      c.beginPath()
      c.arc((i * 53) % W, H - ((this.time * 20 + i * 37) % H), 3 + (i % 4), 0, Math.PI * 2)
      c.stroke()
    }
    c.textAlign = 'center'
    c.font = 'bold 34px sans-serif'
    c.lineWidth = 4
    c.strokeStyle = '#fff'
    c.strokeText('The Saac', CX, 80)
    c.fillStyle = '#1e6fd9'
    c.fillText('The Saac', CX, 80)
    c.font = '10px sans-serif'
    c.fillStyle = '#fff'
    c.fillText(this.opts.daily ? '✦ Défi du jour ✦' : 'Mode libre', CX, 100)
    c.drawImage(sprites().player, CX - 12, 112, 24, 28)
    if (Math.floor(this.time * 2) % 2 === 0) {
      c.font = 'bold 10px sans-serif'
      c.fillText('Entrée / A / touche l’écran pour plonger', CX, 165)
    }
    c.font = '8px sans-serif'
    c.fillText('ZQSD / WASD : nager  ·  Flèches : tirer des bulles  ·  Échap : pause', CX, 190)
    c.textAlign = 'left'
  }

  private renderBsod() {
    const c = this.ctx
    c.fillStyle = '#1f4fb8'
    c.fillRect(0, 0, W, H)
    c.fillStyle = '#fff'
    c.font = '36px sans-serif'
    c.fillText(':(', 24, 56)
    c.font = '11px sans-serif'
    c.fillText('Ton aquarium a rencontré un problème', 24, 82)
    c.fillText('et doit redémarrer.', 24, 97)
    c.font = '9px monospace'
    c.fillText(`Étage atteint : ${this.floorIndex + 1}   Score : ${Math.round(this.score)}`, 24, 122)
    c.fillText(`Ennemis vaincus : ${this.kills}   Objets : ${this.items.length}`, 24, 136)
    c.fillText('Code d’arrêt : POISSON_ECHAPPE', 24, 160)
    c.fillText('Enregistre ton score ci-dessous puis réessaie !', 24, 184)
  }

  private renderWin() {
    this.renderOverlay('VICTOIRE ✦', `Score : ${Math.round(this.score)} — enregistre-le ci-dessous !`)
  }
}
