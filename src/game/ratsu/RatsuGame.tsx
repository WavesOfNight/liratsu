'use client'
/**
 * Composant React de The Ratsu : canvas, boucle requestAnimationFrame (pause si onglet caché),
 * joysticks tactiles, envoi du score, musique d'ambiance et affichage du classement.
 * Chargé en lazy-loading uniquement sur /arcade/the-ratsu.
 */
import Link from 'next/link'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { playSound } from '@/components/prefs/sounds'
import { loadRatsuAssets } from './assets'
import { Game, type GameResult, H, W } from './game'
import { Input } from './input'
import styles from './ratsu.module.css'

type Track = { title: string; url: string; floorFrom: number }
type Session = {
  sessionId: number
  seed: string
  difficulty: 'easy' | 'normal' | 'hard'
  startHearts: number
  startBombs: number
  floors: number
  leaderboard: boolean
  music: Track[]
}
type Row = { nickname: string; score: number; floor: number; won: boolean }

const MUSIC_KEY = 'liratsu:ratsu-music'

export default function RatsuGame() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)
  const inputRef = useRef<Input | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const trackUrlRef = useRef<string | null>(null)
  const [daily, setDaily] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)
  const [error, setError] = useState('')
  const [board, setBoard] = useState<Row[]>([])
  const [submit, setSubmit] = useState<{ state: 'idle' | 'sending' | 'done'; msg?: string; rewards?: { code: string; message: string }[] }>({ state: 'idle' })
  const [touch, setTouch] = useState(false)
  const [musicOn, setMusicOn] = useState(false)

  const loadBoard = useCallback(async (d: boolean) => {
    const r = await fetch(`/api/site/game/leaderboard${d ? '?daily=1' : ''}`).catch(() => null)
    if (r?.ok) setBoard(await r.json())
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronisation avec le stockage/API du navigateur après hydratation
    setTouch(window.matchMedia('(pointer: coarse)').matches)
    try {
      setMusicOn(localStorage.getItem(MUSIC_KEY) === '1')
    } catch {
      /* stockage indisponible */
    }
    void loadBoard(true)
    audioRef.current = new Audio()
    audioRef.current.loop = true
    audioRef.current.volume = 0.35
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [loadBoard])

  const toggleMusic = () => {
    setMusicOn((on) => {
      const next = !on
      try {
        localStorage.setItem(MUSIC_KEY, next ? '1' : '0')
      } catch {
        /* stockage indisponible */
      }
      if (next) audioRef.current?.play().catch(() => null)
      else audioRef.current?.pause()
      return next
    })
  }

  const playForFloor = useCallback(
    (floor: number, tracks: Track[]) => {
      if (!tracks.length) return
      const track = [...tracks].sort((a, b) => b.floorFrom - a.floorFrom).find((t) => floor >= t.floorFrom) ?? tracks[0]
      if (trackUrlRef.current === track.url) return
      trackUrlRef.current = track.url
      const audio = audioRef.current
      if (!audio) return
      audio.src = track.url
      if (musicOn) audio.play().catch(() => null)
    },
    [musicOn],
  )

  const newGame = useCallback(async (isDaily: boolean) => {
    setError('')
    setResult(null)
    setSubmit({ state: 'idle' })
    const r = await fetch('/api/site/game/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ daily: isDaily }) }).catch(() => null)
    const d = r ? await r.json().catch(() => null) : null
    if (!r?.ok || !d) return setError(d?.error ?? 'Impossible de démarrer la partie.')
    trackUrlRef.current = null
    setSession(d)
    void loadBoard(isDaily)
  }, [loadBoard])

  // (Re)création du moteur quand une session commence : précharge les sprites embarqués d'abord.
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap || !session) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let cancelled = false
    let raf = 0
    let cleanupInput: (() => void) | null = null
    let last = performance.now()

    const onVis = () => {
      if (document.hidden && gameRef.current?.state === 'play') gameRef.current.state = 'pause'
      last = performance.now()
    }
    document.addEventListener('visibilitychange', onVis)

    loadRatsuAssets()
      .then((assets) => {
        if (cancelled) return
        inputRef.current?.destroy()
        const input = new Input(wrap)
        inputRef.current = input
        cleanupInput = () => input.destroy()
        const game = new Game(ctx, input, {
          seed: session.seed,
          daily,
          difficulty: session.difficulty,
          startHearts: session.startHearts,
          startBombs: session.startBombs,
          floors: session.floors,
          assets,
          onEnd: (res) => setResult(res),
          onSound: (s) => playSound(s),
          onFloorChange: (floor) => playForFloor(floor, session.music),
        })
        gameRef.current = game
        wrap.focus()

        last = performance.now()
        const loop = (now: number) => {
          const dt = Math.min(0.05, (now - last) / 1000)
          last = now
          if (!document.hidden) {
            game.update(dt)
            game.render()
          }
          raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
      })
      .catch(() => {
        if (!cancelled) setError('Les images du jeu n’ont pas pu être chargées. Réessaie dans un instant.')
      })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVis)
      cleanupInput?.()
      audioRef.current?.pause()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const sendScore = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!result || !session) return
    const nickname = String(new FormData(e.currentTarget).get('nickname') ?? '')
    setSubmit({ state: 'sending' })
    const r = await fetch('/api/site/game/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.sessionId, nickname, score: result.score, floor: result.floor, won: result.won, durationMs: result.durationMs, kills: result.kills, rooms: result.rooms }),
    }).catch(() => null)
    const d = r ? await r.json().catch(() => ({})) : {}
    setSubmit({ state: 'done', msg: r?.ok ? (d.saved ? 'Score enregistré ✦' : (d.error ?? 'Score non classé.')) : (d.error ?? 'Envoi impossible.'), rewards: d.rewards })
    if (d.rewards?.length) playSound('coin')
    void loadBoard(result.daily)
  }

  return (
    <div className={styles.layout}>
      <div className={styles.stage}>
        <div className={styles.modes} role="group" aria-label="Mode de jeu">
          <button type="button" className={`candy-btn candy-btn--small ${daily ? '' : 'candy-btn--ghost'}`} aria-pressed={daily} onClick={() => setDaily(true)}>
            ✦ Défi du jour
          </button>
          <button type="button" className={`candy-btn candy-btn--small ${!daily ? '' : 'candy-btn--ghost'}`} aria-pressed={!daily} onClick={() => setDaily(false)}>
            Mode libre
          </button>
          <button type="button" className="candy-btn candy-btn--pink candy-btn--small" onClick={() => newGame(daily)}>
            {session ? 'Nouvelle partie' : 'Jouer'}
          </button>
          {!!session?.music.length && (
            <button type="button" className="candy-btn candy-btn--ghost candy-btn--small" aria-pressed={musicOn} onClick={toggleMusic} title="Musique d’ambiance">
              {musicOn ? '🎵 Musique' : '🔇 Musique'}
            </button>
          )}
        </div>

        <div
          ref={wrapRef}
          className={styles.screen}
          tabIndex={0}
          role="application"
          aria-label="Jeu The Ratsu. ZQSD ou WASD pour se déplacer, flèches pour tirer, Échap pour la pause."
          onPointerDown={() => {
            wrapRef.current?.focus()
            if (inputRef.current && gameRef.current?.state === 'title') inputRef.current.confirmPressed = true
          }}
        >
          <canvas ref={canvasRef} width={W} height={H} className={styles.canvas} />
          {!session && (
            <div className={styles.cover}>
              <p>Clique sur « Jouer » pour lancer une partie !</p>
            </div>
          )}
          {touch && session && (
            <>
              <Joystick side="left" onChange={(v) => inputRef.current && (inputRef.current.touchMove = v)} label="Déplacement" />
              <Joystick side="right" onChange={(v) => inputRef.current && (inputRef.current.touchAim = v)} label="Tir" />
            </>
          )}
        </div>
        {error && <p className="form-msg form-msg--error">{error}</p>}

        {result && (
          <div className={`aero-window ${styles.result}`}>
            <div className="aero-window__bar">
              <span className="aero-window__title">{result.won ? 'Victoire !' : 'Fin de partie'}</span>
            </div>
            <div className="aero-window__body">
              <p>
                Score <strong>{result.score}</strong> · étage {result.floor} · {result.kills} ennemis · {Math.round(result.durationMs / 1000)} s
              </p>
              {submit.state !== 'done' ? (
                session?.leaderboard !== false && (
                  <form onSubmit={sendScore} className={styles.scoreForm}>
                    <label htmlFor="nick">Pseudo (visible dans le classement)</label>
                    <input id="nick" name="nickname" required minLength={2} maxLength={20} className="input" autoComplete="nickname" />
                    <button className="candy-btn candy-btn--star" disabled={submit.state === 'sending'}>
                      Enregistrer
                    </button>
                  </form>
                )
              ) : (
                <>
                  <p role="status">{submit.msg}</p>
                  {submit.rewards?.map((r) => (
                    <p key={r.code} className="form-msg">
                      🎁 {r.message} Code : <strong>{r.code}</strong> — <Link href="/communaute#codes">à utiliser dans l’Espace communauté</Link>
                    </p>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <aside className="aero-window">
        <div className="aero-window__bar">
          <span className="aero-window__title">Classement {daily ? 'du jour' : 'général'}</span>
        </div>
        <div className="aero-window__body">
          <ol className={styles.board}>
            {board.map((r, i) => (
              <li key={i}>
                <span className={styles.rank}>{i + 1}</span>
                <span className={styles.nick}>{r.nickname}</span>
                <span>
                  {r.score} {r.won ? '👑' : `(é.${r.floor})`}
                </span>
              </li>
            ))}
            {board.length === 0 && <li className="muted">Personne encore… à toi de jouer !</li>}
          </ol>
        </div>
      </aside>
    </div>
  )
}

/** Joystick virtuel tactile. */
function Joystick({ side, onChange, label }: { side: 'left' | 'right'; onChange: (v: { x: number; y: number }) => void; label: string }) {
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const base = useRef<HTMLDivElement>(null)
  const update = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect()
    let x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
    let y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
    const l = Math.hypot(x, y)
    if (l > 1) {
      x /= l
      y /= l
    }
    setKnob({ x, y })
    onChange({ x, y })
  }
  const reset = () => {
    setKnob({ x: 0, y: 0 })
    onChange({ x: 0, y: 0 })
  }
  return (
    <div
      ref={base}
      className={`${styles.stick} ${side === 'left' ? styles.stickLeft : styles.stickRight}`}
      aria-label={label}
      onPointerDown={(e) => {
        e.stopPropagation()
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        update(e)
      }}
      onPointerMove={(e) => e.buttons && update(e)}
      onPointerUp={reset}
      onPointerCancel={reset}
    >
      <span className={styles.knob} style={{ transform: `translate(${knob.x * 28}px, ${knob.y * 28}px)` }} />
    </div>
  )
}
