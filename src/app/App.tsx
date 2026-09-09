import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PoolBody } from '../core/pool'
import { poolById } from '../core/pool'
import { SYSTEMS, systemById } from '../core/systems'
import { RATE_HI, RATE_LO, READ_ANGLE, audibility, pitchOf, rateOf, silence } from '../core/listen'
import { describeChord, nearestNoteName, rankResonances } from '../core/sonify'
import { longitudeOf, transitsBetween } from '../ephem/position'
import { dateToDays } from '../ephem/frames'
import { computeLayout } from '../render/layout'
import { render } from '../render/orrery'
import { Scheduler } from '../audio/scheduler'
import type { VoiceSource } from '../audio/scheduler'
import { initAudio, currentAudioTime, audioGraph } from '../audio/graph'
import { makeTimeBase } from '../core/timebase'
import type { Audio, TT, Tau } from '../core/units'
import { SET, voiceFor, panFor } from '../audio/instruments'
import { useStore, editCount } from './store'
import type { BodyEdit } from './store'

const VOICES = Object.values(SET).map((v) => ({ id: v.id, name: v.name, family: v.family }))

export default function App() {
  const s = useStore()
  /** The mixer lists what you can hear; the rest is one click away rather than 37 dim rows. */
  const [showAll, setShowAll] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const schedRef = useRef<Scheduler | null>(null)
  // The sky as it is, now. It runs on from here and never turns back.
  const simRef = useRef(dateToDays(new Date()))
  const silentRef = useRef<number | null>(null)

  const system = useMemo(() => systemById(s.systemId), [s.systemId])
  /** Every body of the system, always. The dim ones are the honesty. */
  const bodies = system.bodies
  const tau = s.tau
  const edits = s.edits
  const editOf = useCallback(
    (id: string): BodyEdit => edits[`${s.systemId}:${id}`] ?? {},
    [edits, s.systemId],
  )

  const parents = useMemo(() => {
    const m = new Map<string, PoolBody | null>()
    for (const b of bodies) {
      const key = b.parent ?? 'sun'
      if (!m.has(key)) m.set(key, key === 'sun' ? null : poolById.get(key) ?? null)
    }
    return m
  }, [bodies])

  /** The orbit's own frequency, raised by the shared shift, then by whatever octaves you asked. */
  const pitches = useMemo(() => {
    const m = new Map<string, number>()
    for (const b of bodies) {
      m.set(b.id, pitchOf(b.periodDays, tau) * 2 ** (editOf(b.id).octave ?? 0))
    }
    return m
  }, [bodies, tau, editOf])

  /**
   * How strongly each body is heard.
   *
   * The window decides by default and you can overrule it either way — forcing a body on that
   * is too fast or too slow to resolve is a legitimate thing to want to hear, and forcing one
   * off is how you get out of the way of the rest.
   */
  const heard = useMemo(() => {
    const m = new Map<string, number>()
    for (const b of bodies) {
      const nat = audibility(b.periodDays, tau)
      const on = editOf(b.id).on
      m.set(b.id, on === true ? Math.max(nat, 1) : on === false ? 0 : nat)
    }
    return m
  }, [bodies, tau, editOf])

  const voiced = useMemo(() => bodies.filter((b) => (heard.get(b.id) ?? 0) > 0), [bodies, heard])
  const layout = useMemo(() => computeLayout(bodies), [bodies])

  /** Sounding bodies, lowest first — the order the mixer lists them in. */
  const ranked = useMemo(
    () => [...voiced].sort((a, b) => (pitches.get(a.id) ?? 0) - (pitches.get(b.id) ?? 0)),
    [voiced, pitches],
  )

  /**
   * Each body's seat in the palette, and it must NOT depend on your edits.
   *
   * Ranking across whatever happens to be sounding means muting one moon re-voices every other
   * one — you silence Europa and Ganymede changes instrument underneath you. So the rank is
   * taken over the bodies the SPEED puts in earshot, using their unedited pitches. Muting,
   * forcing on and transposing then leave every other channel exactly where it was, and only
   * moving the speed re-orchestrates — which is the one case where you expect it to.
   */
  const seat = useMemo(() => {
    const nat = bodies
      .filter((b) => audibility(b.periodDays, tau) > 0)
      .sort((a, b) => pitchOf(a.periodDays, tau) - pitchOf(b.periodDays, tau))
    const n = Math.max(nat.length, 1)
    const m = new Map<string, { r01: number; idx: number }>()
    nat.forEach((b, i) => m.set(b.id, { r01: n > 1 ? i / (n - 1) : 0.5, idx: i }))
    // A body you forced on takes the seat its own pitch would have had.
    for (const b of bodies) {
      if (m.has(b.id)) continue
      const hz = pitchOf(b.periodDays, tau)
      let i = 0
      while (i < nat.length && pitchOf(nat[i].periodDays, tau) < hz) i++
      m.set(b.id, { r01: n > 1 ? Math.min(1, i / (n - 1)) : 0.5, idx: i })
    }
    return m
  }, [bodies, tau])

  const rig = useMemo(() => {
    const m = new Map<string, { voice: ReturnType<typeof voiceFor>; pan: number }>()
    const count = Math.max(seat.size, 2)
    for (const b of voiced) {
      const e = editOf(b.id)
      const { r01, idx } = seat.get(b.id) ?? { r01: 0.5, idx: 0 }
      const rate = rateOf(b.periodDays, tau)
      m.set(b.id, {
        voice: voiceFor(r01, rate, e.voiceId ? SET[e.voiceId] : undefined),
        pan: e.pan ?? panFor(idx, count),
      })
    }
    return m
  }, [voiced, seat, tau, editOf])

  const voices: VoiceSource[] = useMemo(() => {
    const crowd = Math.max(0.3, Math.min(1, 4.5 / Math.max(1, voiced.length)))
    return voiced.map((b) => ({
      id: `orbit:${b.id}`,
      kind: 'orbit' as const,
      bodyId: b.id,
      hz: pitches.get(b.id) ?? 440,
      velocity: 0.9 * crowd * Math.min(1, heard.get(b.id) ?? 1),
      instrument: rig.get(b.id)!.voice,
      pan: rig.get(b.id)!.pan,
      between: (a: number, z: number) => transitsBetween(b, READ_ANGLE, a, z),
    }))
  }, [voiced, pitches, heard, rig])

  const scene = useMemo(() => ({
    layout, bodies, parents, tau, readAngle: READ_ANGLE, pitches, heard,
    centreLabel: system.centre, centreColor: system.centreColor ?? 'rgba(255,246,228,0.95)',
  }), [layout, bodies, parents, tau, pitches, heard, system])

  const voicesRef = useRef(voices)
  const sceneRef = useRef(scene)
  useEffect(() => {
    voicesRef.current = voices
    sceneRef.current = scene
    schedRef.current?.invalidate()
  }, [voices, scene])

  const ensureAudio = useCallback(async () => {
    if (schedRef.current) return
    const g = await initAudio()
    const st = useStore.getState()
    schedRef.current = new Scheduler(
      makeTimeBase(simRef.current as TT, currentAudioTime() as Audio, 0 as Tau),
      g.busIn, g.ctx, () => voicesRef.current, g.kit,
    )
    // The clock is born stopped, and the effect that starts it only fires when the speed
    // CHANGES — which it never does after this point, so it has to be started here or the
    // sky turns in silence forever.
    schedRef.current.retime((st.playing ? st.tau : 0) as Tau)
    g.setVolume(st.volume)
    st.setAudioReady(true)
  }, [])

  useEffect(() => {
    const onGesture = () => { void ensureAudio() }
    window.addEventListener('pointerdown', onGesture, { once: true })
    window.addEventListener('keydown', onGesture, { once: true })
    return () => {
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)
    }
  }, [ensureAudio])

  useEffect(() => {
    if (!s.audioReady) return
    const worker = new Worker(new URL('../audio/tick.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = () => { schedRef.current?.tick() }
    return () => worker.terminate()
  }, [s.audioReady])

  useEffect(() => { schedRef.current?.retime((s.playing ? tau : 0) as Tau) }, [s.playing, tau])
  useEffect(() => { audioGraph()?.setVolume(s.volume) }, [s.volume])

  // Render loop, mounted once and never gated on audio: the sky turns from page load.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr = Math.min(devicePixelRatio || 1, 2)
      const w = canvas.clientWidth, h = canvas.clientHeight
      if (w === 0 || h === 0) return
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const cur = sceneRef.current
      const sched = schedRef.current
      if (sched) {
        simRef.current = sched.visualSimTime()
        silentRef.current = null
      } else {
        const now = performance.now() / 1000
        if (silentRef.current === null) silentRef.current = now
        const dt = Math.min(0.25, now - silentRef.current)
        silentRef.current = now
        if (useStore.getState().playing) simRef.current += cur.tau * dt
      }

      const longitudes = new Map<string, number>()
      for (const b of cur.bodies) longitudes.set(b.id, longitudeOf(b, simRef.current))

      render(ctx, w, h, {
        ...cur,
        longitudes,
        flashes: sched?.flashes ?? [],
        audioNow: currentAudioTime(),
      })
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // --- readouts ---------------------------------------------------------------------------

  const chord = useMemo(
    () => describeChord(ranked.map((b) => pitches.get(b.id) ?? 0)),
    [ranked, pitches],
  )
  // Only small integers count. A 13:4 that happens to land inside a cent is a coincidence of
  // arithmetic, not a resonance holding two bodies in place.
  const locks = useMemo(
    () => rankResonances(voiced).filter((r) => r.centsOff < 25 && r.p <= 6 && r.q <= 6).slice(0, 5),
    [voiced],
  )
  const notesPerSec = useMemo(
    () => ranked.reduce((a, b) => a + rateOf(b.periodDays, tau), 0),
    [ranked, tau],
  )

  // The whole useful range of the knob: below it everything is too slow to be a note, above it
  // everything is too fast. Both ends are set by the system, not by taste.
  const periods = bodies.map((b) => b.periodDays)
  const tauMin = RATE_LO * Math.min(...periods)
  const tauMax = RATE_HI * Math.max(...periods)
  const lg = Math.log10
  const touched = editCount(edits, s.systemId)

  const togglePanel = (p: 'mix' | 'about') => s.setPanel(s.panel === p ? 'none' : p)

  return (
    <div className={`app ${s.panel !== 'none' ? 'with-drawer' : ''}`}>
      <main className="stage">
        <canvas ref={canvasRef} />

        <header className="top">
          <h1>Space Opera</h1>
          <select
            className="pick"
            value={s.systemId}
            onChange={(e) => s.setSystem(e.target.value)}
            aria-label="System"
          >
            <optgroup label="Moons">
              {SYSTEMS.filter((x) => x.group === 'moons').map((x) => (
                <option key={x.id} value={x.id}>{x.centre}</option>
              ))}
            </optgroup>
            <optgroup label="Planets">
              {SYSTEMS.filter((x) => x.group === 'planets').map((x) => (
                <option key={x.id} value={x.id}>{x.centre}</option>
              ))}
            </optgroup>
          </select>
        </header>

        <div className="dock">
          <button className="play" onClick={() => s.setPlaying(!s.playing)}
            aria-label={s.playing ? 'Pause' : 'Play'}>
            {s.playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <label className="ctl wide">
            <input type="range" min={lg(tauMin)} max={lg(tauMax)} step={0.001} value={lg(tau)}
              onChange={(e) => s.setTau(10 ** +e.target.value)}
              aria-label="Days of sky per second" />
            <span className="num val">{tau < 10 ? tau.toFixed(2) : Math.round(tau).toLocaleString()} d/s</span>
          </label>
          <label className="ctl vol">
            <VolumeIcon />
            <input type="range" min={0} max={1.4} step={0.01} value={s.volume}
              onChange={(e) => s.setVolume(+e.target.value)} aria-label="Volume" />
          </label>
          <div className="tabs">
            <button className={s.panel === 'mix' ? 'on' : ''} onClick={() => togglePanel('mix')}>
              Mix{touched > 0 && <i className="badge">{touched}</i>}
            </button>
            <button className={s.panel === 'about' ? 'on' : ''} onClick={() => togglePanel('about')}>
              About
            </button>
          </div>
        </div>
      </main>

      {s.panel !== 'none' && (
        <aside className="drawer">
          <div className="dhead">
            <h2>{s.panel === 'mix' ? 'Mix' : system.centre}</h2>
            <button className="x" onClick={() => s.setPanel('none')} aria-label="Close">×</button>
          </div>

          {s.panel === 'mix' ? (
            <div className="dbody">
              <p className="meta">
                {ranked.length} sounding · {notesPerSec.toFixed(1)} notes/sec
                {touched > 0 && (
                  <button className="link" onClick={() => s.clearSystemEdits()}>reset all</button>
                )}
              </p>
              <div className="mix">
                {(showAll
                  ? [...bodies]
                  // What the SPEED puts in earshot, plus anything you forced on — not what is
                  // sounding right now, or muting a body would take its own row away with it.
                  : bodies.filter((b) => audibility(b.periodDays, tau) > 0 || editOf(b.id).on === true)
                ).sort((a, b) => (pitches.get(b.id) ?? 0) - (pitches.get(a.id) ?? 0))
                  .map((b) => {
                    const e = editOf(b.id)
                    const lit = heard.get(b.id) ?? 0
                    const r = rig.get(b.id)
                    const why = silence(b.periodDays, tau)
                    return (
                      <div className={`mrow ${lit > 0 ? '' : 'off'}`} key={b.id}>
                        <button
                          className={`dot ${lit > 0 ? 'on' : ''}`}
                          style={lit > 0 ? { background: b.color } : undefined}
                          onClick={() => s.edit(b.id, { on: !(lit > 0) })}
                          aria-label={lit > 0 ? `Mute ${b.name}` : `Play ${b.name}`}
                          title={lit > 0 ? 'sounding' : why === 'fast' ? 'too fast to resolve' : 'too slow to sound'}
                        />
                        <span className="nm">{b.name}</span>
                        <span className="hz num">{nearestNoteName(pitches.get(b.id) ?? 0)}</span>
                        <select
                          className="voice"
                          value={lit > 0 ? (e.voiceId ?? r?.voice.id ?? '') : ''}
                          onChange={(ev) => s.edit(b.id, { voiceId: ev.target.value })}
                          disabled={lit === 0}
                          aria-label={`Voice for ${b.name}`}
                        >
                          {lit === 0 && <option value="">—</option>}
                          {VOICES.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                        <div className="oct">
                          <button onClick={() => s.edit(b.id, { octave: Math.max(-4, (e.octave ?? 0) - 1) })}
                            aria-label={`${b.name} down an octave`}>−</button>
                          <span className="num">{(e.octave ?? 0) > 0 ? '+' : ''}{e.octave ?? 0}</span>
                          <button onClick={() => s.edit(b.id, { octave: Math.min(4, (e.octave ?? 0) + 1) })}
                            aria-label={`${b.name} up an octave`}>+</button>
                        </div>
                        <input className="pan" type="range" min={-1} max={1} step={0.05}
                          value={e.pan ?? r?.pan ?? 0}
                          onChange={(ev) => s.edit(b.id, { pan: +ev.target.value })}
                          disabled={lit === 0}
                          aria-label={`Stereo position for ${b.name}`} />
                      </div>
                    )
                  })}
              </div>
              <button className="more" onClick={() => setShowAll(!showAll)}>
                {showAll
                  ? 'show only what is sounding'
                  : `show all ${bodies.length} — ${bodies.filter((b) => audibility(b.periodDays, tau) === 0).length} out of earshot`}
              </button>
              <p className="foot">
                Octaves are powers of two, so they move a body without disturbing its interval
                with anything else you have moved by the same amount. Everything else here —
                which voice, where it sits, whether it sounds at all — is yours; the pitch and
                the rhythm stay the orbit's.
              </p>
            </div>
          ) : (
            <div className="dbody">
              <p className="meta">{ranked.length} of {bodies.length} sounding · {chord ? chord.name : 'nothing in earshot'}</p>
              <p className="note">{system.note}</p>
              {locks.length > 0 && (
                <div className="rows">
                  {locks.map((r) => (
                    <div className="row iv" key={`${r.a.id}-${r.b.id}`}>
                      <span className="pair">{r.a.name} : {r.b.name}</span>
                      <span className="ratio num">{r.p}:{r.q}</span>
                      <span className="name">{r.interval.name}</span>
                      <span className="off num">{r.centsOff < 1 ? '<1' : r.centsOff.toFixed(0)}¢</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="foot">
                A body sounds each time it crosses the line, so its rhythm is its orbit, and its
                pitch is that same rate raised by seven octaves — one note a second is 128 Hz.
                An interval you hear is not a mapping of a resonance, it is the resonance.
              </p>
            </div>
          )}
        </aside>
      )}
    </div>
  )
}

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
)
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
)
const VolumeIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
    <path d="M4 9.5v5h3.2L12 18.6V5.4L7.2 9.5zM15.5 8.6a4.6 4.6 0 010 6.8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
)
