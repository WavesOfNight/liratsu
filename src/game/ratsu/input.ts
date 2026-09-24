/**
 * Entrées unifiées : clavier (ZQSD/WASD via codes physiques + flèches), manette (Gamepad API)
 * et joysticks tactiles virtuels (alimentés par le composant React).
 */
export type Vec = { x: number; y: number }

export class Input {
  move: Vec = { x: 0, y: 0 }
  aim: Vec = { x: 0, y: 0 }
  pausePressed = false
  confirmPressed = false
  /** Espace/E pendant la partie (Espace ne sert de « confirmer » que sur les écrans titre/mort/victoire). */
  bombPressed = false
  touchMove: Vec = { x: 0, y: 0 }
  touchAim: Vec = { x: 0, y: 0 }
  touchBomb = false
  private keys = new Set<string>()
  private prevPadStart = false
  private prevPadA = false
  private prevPadB = false
  private prevTouchBomb = false

  private onDown = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault()
    if (!this.keys.has(e.code)) {
      if (e.code === 'Escape' || e.code === 'KeyP') this.pausePressed = true
      if (e.code === 'Enter' || e.code === 'Space') this.confirmPressed = true
      if (e.code === 'Space' || e.code === 'KeyE') this.bombPressed = true
    }
    this.keys.add(e.code)
  }
  private onUp = (e: KeyboardEvent) => this.keys.delete(e.code)
  private onBlur = () => this.keys.clear()

  constructor(private target: HTMLElement) {
    target.addEventListener('keydown', this.onDown)
    target.addEventListener('keyup', this.onUp)
    window.addEventListener('blur', this.onBlur)
  }

  destroy() {
    this.target.removeEventListener('keydown', this.onDown)
    this.target.removeEventListener('keyup', this.onUp)
    window.removeEventListener('blur', this.onBlur)
  }

  /** À appeler une fois par frame. */
  poll() {
    const k = (c: string) => (this.keys.has(c) ? 1 : 0)
    let mx = k('KeyD') - k('KeyA')
    let my = k('KeyS') - k('KeyW')
    let ax = k('ArrowRight') - k('ArrowLeft')
    let ay = k('ArrowDown') - k('ArrowUp')

    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : []
    for (const pad of pads) {
      if (!pad) continue
      const dz = (v: number) => (Math.abs(v) < 0.25 ? 0 : v)
      mx += dz(pad.axes[0] ?? 0)
      my += dz(pad.axes[1] ?? 0)
      ax += dz(pad.axes[2] ?? 0)
      ay += dz(pad.axes[3] ?? 0)
      // Boutons faciaux comme tir 4 directions (Y haut, A bas, X gauche, B droite)
      ay += (pad.buttons[0]?.pressed ? 1 : 0) - (pad.buttons[3]?.pressed ? 1 : 0)
      ax += (pad.buttons[1]?.pressed ? 1 : 0) - (pad.buttons[2]?.pressed ? 1 : 0)
      const start = Boolean(pad.buttons[9]?.pressed)
      if (start && !this.prevPadStart) this.pausePressed = true
      this.prevPadStart = start
      const a = Boolean(pad.buttons[0]?.pressed)
      if (a && !this.prevPadA) this.confirmPressed = true
      this.prevPadA = a
      const b = Boolean(pad.buttons[5]?.pressed) // gâchette droite : bombe
      if (b && !this.prevPadB) this.bombPressed = true
      this.prevPadB = b
      break
    }
    if (this.touchBomb && !this.prevTouchBomb) this.bombPressed = true
    this.prevTouchBomb = this.touchBomb
    mx += this.touchMove.x
    my += this.touchMove.y
    ax += this.touchAim.x
    ay += this.touchAim.y

    const norm = (x: number, y: number): Vec => {
      const l = Math.hypot(x, y)
      return l > 1 ? { x: x / l, y: y / l } : { x, y }
    }
    this.move = norm(mx, my)
    this.aim = Math.hypot(ax, ay) > 0.3 ? norm(ax, ay) : { x: 0, y: 0 }
  }

  consumePause() {
    const p = this.pausePressed
    this.pausePressed = false
    return p
  }
  consumeConfirm() {
    const c = this.confirmPressed
    this.confirmPressed = false
    return c
  }
  consumeBomb() {
    const b = this.bombPressed
    this.bombPressed = false
    return b
  }
}
