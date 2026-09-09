/**
 * PROPOSED src/audio/voices.ts  —  reference implementation.
 *
 * The old renderer could make exactly one kind of sound: a bank of sine partials with
 * per-partial exponential decays. No filter on the tone, no continuous excitation, no
 * nonlinearity, and brightness that could only fall. Twelve instrument records were twelve
 * tables for the same object, which is why "bowed glass", "voices" and "celesta" measured
 * 83-93% identical and why the whole set spanned 0.87 octaves of brightness.
 *
 * This adds the axes that were missing, as four tone cores plus three shared shaping stages.
 * Nothing here touches pitch, rhythm, continuity or visibility.
 */

// ---------------------------------------------------------------------------------------
// Shared, built once at graph init. Everything below is cached; a note allocates only nodes.
// ---------------------------------------------------------------------------------------

export interface Kit {
  waves: Record<string, PeriodicWave>
  noise: AudioBuffer          // 6 s of pink-tilted noise, read from a random offset per note
  shaper: Float32Array<ArrayBuffer>   // tanh curve for WaveShaperNode
}

const WAVE_HARMONICS: Record<string, (n: number) => number[]> = {
  saw: (n) => Array.from({ length: n }, (_, i) => 1 / (i + 1)),
  tri: (n) => Array.from({ length: n }, (_, i) => {
    const h = i + 1
    return h % 2 ? (h % 4 === 1 ? 1 : -1) / (h * h) : 0
  }),
  // a reed source: a harmonic stack whose envelope peaks at the 3rd partial, with the
  // fundamental held up so the note keeps a pitch at 60 Hz
  reed: (n) => Array.from({ length: n }, (_, i) => {
    const h = i + 1
    const a = Math.exp(-((Math.log2(h / 3.2) / 1.25) ** 2)) / Math.sqrt(h)
    return h === 1 ? Math.max(a, 0.62) : a
  }),
  organ: (n) => Array.from({ length: n }, (_, i) =>
    ({ 1: 1, 2: 0.5, 3: 0.28, 4: 0.35, 6: 0.12, 8: 0.16 } as Record<number, number>)[i + 1] ?? 0),
}

export function buildKit(ctx: BaseAudioContext): Kit {
  const waves: Record<string, PeriodicWave> = {}
  for (const [id, gen] of Object.entries(WAVE_HARMONICS)) {
    // 64 harmonics is plenty: the browser band-limits a PeriodicWave per playback frequency,
    // so ONE object serves every pitch. This is the whole reason the filtered core is cheap.
    const amps = gen(64)
    const real = new Float32Array(65), imag = new Float32Array(65)
    amps.forEach((a, i) => { imag[i + 1] = a })
    waves[id] = ctx.createPeriodicWave(real, imag, { disableNormalization: false })
  }
  const n = Math.round(ctx.sampleRate * 6)
  const noise = ctx.createBuffer(1, n, ctx.sampleRate)
  const d = noise.getChannelData(0)
  let p = 0
  for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; p = 0.92 * p + 0.08 * w; d[i] = 0.7 * w + 2.2 * p }
  let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(d[i]))
  for (let i = 0; i < n; i++) d[i] /= pk
  const shaper = new Float32Array(new ArrayBuffer(1024 * 4))
  for (let i = 0; i < 1024; i++) shaper[i] = Math.tanh(3 * ((i / 511.5) - 1)) / Math.tanh(3)
  return { waves, noise, shaper }
}

// ---------------------------------------------------------------------------------------
// The Voice record
// ---------------------------------------------------------------------------------------

export type Core = 'modal' | 'filtered' | 'fm' | 'ks'

export interface Voice {
  id: string
  name: string
  family: string
  core: Core

  /** modal: [ratio, gain, how much faster this mode dies]. Real modal data, not harmonics. */
  modes?: Array<[number, number, number]>
  /** Stiffness: f_n = f0 * r * sqrt(1 + B r^2). A struck string stretches sharp; a bar does not. */
  inharm?: number
  /** Strike position, 0..0.5: mode gains are combed by |sin(pi * r * beta)|. Physics, and free. */
  strike?: number
  /** Per-note random detune of the UPPER modes, cents. Never the mode at ratio 1. */
  spread?: number
  /** Per-note random amplitude wobble per mode, 0..1. A real strike never repeats. */
  jitter?: number
  /** Split each mode below `beatBelow` symmetrically by +-this many cents. The mean is exact. */
  beatCents?: number
  beatBelow?: number

  /** filtered: which cached PeriodicWave, and how many detuned copies of it. */
  wave?: keyof typeof WAVE_HARMONICS
  unison?: number[]          // cents, MUST sum to zero
  subSine?: number           // extra sine at f0, for weight below 120 Hz
  drive?: number             // WaveShaper amount, 0 = bypass

  /** fm: 2-operator. index is in units of the modulator frequency. */
  fm?: { ratio: number; index: [number, number]; indexDecay: number }

  /** ks: Karplus-Strong. Only reachable below sampleRate/128 (344 Hz at 44.1k). */
  ks?: { damp: number; exciteMs: number; feedbackMax: number }

  /** The filter, with its OWN envelope. cutoff = (mulF0*f0)^track * hzAbs^(1-track). */
  filter?: {
    type: BiquadFilterType; Q: number; stages?: number
    track: number            // 1 = follows pitch, 0 = fixed in Hz, between = real instruments
    mulF0: number; hzAbs: number
    env: [number, number, number]   // multipliers: start, peak, end
    fAttack?: number; fDecay?: number
  }
  /** Absolute-Hz resonance: a violin corpus, a marimba box, a vowel. Series peaking biquads. */
  body?: Array<[number, number, number]>   // [hz, Q, dB]
  /** Noise through resonators: breath, bow hair, the hiss on a glass rim. */
  breath?: {
    level: number; attack?: number; decay?: number; sustainLevel?: number
    bands: Array<[number | { mul: number }, number, number]>   // [hz | xf0, Q, gain]
  }
  /** The exciter. Freshly generated per note, and loud enough to actually be heard. */
  transient?: { level: number; ms: number; hzAbs?: number; mulF0?: number; Q?: number; shape?: number }

  amp: { attack: number; hold?: number; decay: number; sustainLevel?: number; release?: number }
  vibrato?: { hz: number; cents: number; delay: number }
  tremolo?: { hz: number; depth: number }
  toneLevel?: number
  gain: number
}

// ---------------------------------------------------------------------------------------
// Ring time is the one thing physics fixes: the note must be gone before the body returns.
// ---------------------------------------------------------------------------------------

export function fitToGap(v: Voice, gapSeconds: number, frac = 0.8, max = 3.2): Voice {
  const ring = Math.max(0.09, Math.min(max, gapSeconds * frac))
  const A = v.amp
  const natural = A.attack + (A.hold ?? 0) + A.decay + (A.release ?? 0.05)
  const k = ring / natural
  // Attacks scale less than decays: a bowed voice forced short is still bowed, but an attack
  // longer than half the gap has no note left in it.
  const ka = Math.min(1.6, Math.max(0.25, k ** 0.55))
  return {
    ...v,
    amp: {
      ...A,
      attack: Math.min(A.attack * ka, ring * 0.45),
      hold: (A.hold ?? 0) * k,
      decay: Math.max(0.04, A.decay * k),
      release: Math.max(0.02, (A.release ?? 0.05) * k),
    },
    filter: v.filter && { ...v.filter, fAttack: (v.filter.fAttack ?? 0.01) * ka, fDecay: (v.filter.fDecay ?? 0.4) * k },
    breath: v.breath && { ...v.breath, attack: (v.breath.attack ?? A.attack) * ka, decay: (v.breath.decay ?? A.decay) * k },
  }
}

/**
 * How many harmonics this voice may keep, given how close its nearest neighbour in the
 * sounding ensemble is. MEASURED, not chosen: for a pair `c` cents apart at `f0`, Sethares
 * dissonance rises monotonically with harmonic count — at 60 cents and 60 Hz it goes 0.065
 * (2 harmonics) -> 0.097 (3) -> 0.152 (6) -> 0.250 (24). This is the fitted contour of a
 * fixed roughness budget over f0 and gap.
 */
export function brightnessCeiling(hz: number, gapCents: number): number {
  const g = Math.max(10, Math.min(1200, gapCents))
  return Math.max(1.5, Math.min(32, 3.1 * (g / 100) ** 0.2 * (hz / 100)))
}

// ---------------------------------------------------------------------------------------
// playNote
// ---------------------------------------------------------------------------------------

export function playNote(
  ctx: BaseAudioContext, dest: AudioNode, when: number,
  hz: number, velocity: number, v: Voice, kit: Kit, pan = 0,
): void {
  // A negative `when` throws RangeError while a merely-past one plays immediately, so an
  // affine time map crossing zero has to be clamped, not trusted. (Unchanged from today.)
  const t = Math.max(when, ctx.currentTime + 0.005)
  const A = v.amp
  const total = A.attack + (A.hold ?? 0) + A.decay + (A.release ?? 0.05)
  const dead = t + total + 0.25
  const kill: AudioNode[] = []
  const keep = <T extends AudioNode>(n: T): T => { kill.push(n); return n }

  const out = keep(ctx.createStereoPanner())
  out.pan.value = pan
  out.connect(dest)
  const amp = keep(ctx.createGain())
  amp.connect(out)

  // A modal bank and a KS loop carry their own decay; multiplying a second decay on top is
  // what put 46-69% of a note's energy inside its first 20 ms. For those cores the amp stage
  // is a GATE and the resonator does the rest.
  const gated = v.core === 'modal' || v.core === 'ks'
  const g0 = velocity * v.gain
  amp.gain.setValueAtTime(0.0001, t)
  if (gated) {
    amp.gain.linearRampToValueAtTime(g0, t + Math.min(0.004, A.attack))
    amp.gain.setValueAtTime(g0, t + total - (A.release ?? 0.05))
    amp.gain.exponentialRampToValueAtTime(0.0001, t + total)
  } else {
    amp.gain.linearRampToValueAtTime(g0, t + A.attack)
    amp.gain.setValueAtTime(g0, t + A.attack + (A.hold ?? 0))
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, g0 * (A.sustainLevel ?? 0.001)),
      t + A.attack + (A.hold ?? 0) + A.decay)
    amp.gain.exponentialRampToValueAtTime(0.0001, t + total)
  }

  // ---- shaping chain, built back to front: [tone] -> drive -> filter -> body -> amp ----
  let head: AudioNode = amp
  for (const [bhz, Q, dB] of [...(v.body ?? [])].reverse()) {
    const b = keep(ctx.createBiquadFilter())
    b.type = 'peaking'; b.frequency.value = bhz; b.Q.value = Q; b.gain.value = dB
    b.connect(head); head = b
  }
  if (v.filter) {
    const F = v.filter
    const base = (F.mulF0 * hz) ** F.track * F.hzAbs ** (1 - F.track)
    const stages: BiquadFilterNode[] = []
    for (let i = 0; i < (F.stages ?? 1); i++) {
      const b = keep(ctx.createBiquadFilter())
      b.type = F.type; b.Q.value = F.Q
      const clamp = (x: number) => Math.max(25, Math.min(ctx.sampleRate * 0.45, x))
      // THIS is the axis the old renderer did not have: cutoff can RISE.
      b.frequency.setValueAtTime(clamp(base * F.env[0]), t)
      b.frequency.linearRampToValueAtTime(clamp(base * F.env[1]), t + (F.fAttack ?? 0.01))
      b.frequency.exponentialRampToValueAtTime(clamp(base * F.env[2]),
        t + (F.fAttack ?? 0.01) + (F.fDecay ?? 0.4))
      stages.push(b)
    }
    for (let i = stages.length - 1; i >= 0; i--) { stages[i].connect(head); head = stages[i] }
  }
  if (v.drive) {
    const ws = keep(ctx.createWaveShaper())
    ws.curve = kit.shaper; ws.oversample = '4x'
    ws.connect(head); head = ws
  }
  const toneIn = keep(ctx.createGain())
  toneIn.gain.value = v.toneLevel ?? 1
  toneIn.connect(head)

  // ---- vibrato: one shared LFO per note, into every oscillator's detune (cents) ----
  let vibOut: GainNode | null = null
  if (v.vibrato) {
    const lfo = keep(ctx.createOscillator())
    lfo.frequency.value = v.vibrato.hz
    lfo.start(t + v.vibrato.delay); lfo.stop(dead)
    vibOut = keep(ctx.createGain())
    vibOut.gain.setValueAtTime(0, t + v.vibrato.delay)
    vibOut.gain.linearRampToValueAtTime(v.vibrato.cents, t + v.vibrato.delay + 0.35)
    lfo.connect(vibOut)
  }

  // ---- the tone cores ----
  if (v.core === 'modal') {
    // The mode at ratio 1 IS the note. It is rendered at exactly hz, never spread, never
    // split asymmetrically. Everything above it is timbre and may be humanised freely.
    const anchor = v.modes!.some((m) => m[0] === 1) ? 1 : Math.min(...v.modes!.map((m) => m[0]))
    for (const [ratio, g, dmul] of v.modes!) {
      const f = hz * ratio * Math.sqrt(1 + (v.inharm ?? 0) * ratio * ratio)
      if (f > 17000 || f < 18) continue
      const comb = v.strike ? Math.abs(Math.sin(Math.PI * ratio * v.strike)) : 1
      const gain = g * comb * (1 + (Math.random() * 2 - 1) * (v.jitter ?? 0.12))
      if (gain < 0.0008) continue
      const bc = v.beatCents && ratio <= (v.beatBelow ?? 99) ? v.beatCents : 0
      for (const dc of bc ? [-bc, bc] : [0]) {
        const o = keep(ctx.createOscillator())
        o.type = 'sine'
        o.frequency.value = f
        o.detune.value = ratio === anchor ? dc : dc + (Math.random() * 2 - 1) * (v.spread ?? 0)
        const e = keep(ctx.createGain())
        const dur = Math.max(0.03, (A.attack + A.decay) / dmul)
        const pk = gain / (bc ? 2 : 1)
        e.gain.setValueAtTime(0.0001, t)
        e.gain.linearRampToValueAtTime(pk, t + A.attack)
        e.gain.exponentialRampToValueAtTime(0.0001, t + A.attack + dur)
        o.connect(e); e.connect(toneIn)
        o.start(t); o.stop(t + A.attack + dur + 0.02)
      }
    }
  } else if (v.core === 'filtered') {
    for (const cents of v.unison ?? [0]) {
      const o = keep(ctx.createOscillator())
      o.setPeriodicWave(kit.waves[v.wave!])
      o.frequency.value = hz
      o.detune.value = cents
      vibOut?.connect(o.detune)
      const g = keep(ctx.createGain())
      g.gain.value = 1 / Math.sqrt((v.unison ?? [0]).length)
      o.connect(g); g.connect(toneIn)
      o.start(t); o.stop(dead)
    }
    if (v.subSine) {
      const o = keep(ctx.createOscillator())
      o.type = 'sine'; o.frequency.value = hz
      const g = keep(ctx.createGain()); g.gain.value = v.subSine
      o.connect(g); g.connect(toneIn)
      o.start(t); o.stop(dead)
    }
  } else if (v.core === 'fm') {
    const { ratio, index, indexDecay } = v.fm!
    const car = keep(ctx.createOscillator()); car.type = 'sine'; car.frequency.value = hz
    const mod = keep(ctx.createOscillator()); mod.type = 'sine'; mod.frequency.value = hz * ratio
    const dev = keep(ctx.createGain())
    dev.gain.setValueAtTime(index[0] * hz * ratio, t)
    dev.gain.exponentialRampToValueAtTime(Math.max(0.01, index[1] * hz * ratio), t + indexDecay)
    mod.connect(dev); dev.connect(car.frequency)
    car.connect(toneIn)
    car.start(t); car.stop(dead); mod.start(t); mod.stop(dead)
  } else if (v.core === 'ks') {
    // A DelayNode inside a cycle is clamped to one render quantum, so this core only reaches
    // sampleRate/128 = 344 Hz at 44.1k. Above that the caller must pick a different voice.
    const sr = ctx.sampleRate
    const damp = keep(ctx.createBiquadFilter())
    damp.type = 'lowpass'; damp.Q.value = 0.5; damp.frequency.value = v.ks!.damp
    // The loop's pitch is set by the TOTAL loop delay, so the filter's phase delay has to come
    // out of the delay line or the string is sharp. One sample of error is 12.6 cents at
    // 320 Hz and 0.6 cents at 150 Hz, which is why this core is restricted to the low register.
    const w = (2 * Math.PI * hz) / sr
    const g = hz / v.ks!.damp
    const phaseDelaySamples = Math.atan(g) / w        // one-pole approximation of the biquad
    const d = Math.max(128 / sr, 1 / hz - phaseDelaySamples / sr)
    const line = keep(ctx.createDelay(0.06)); line.delayTime.value = d
    const fb = keep(ctx.createGain())
    const T60 = A.attack + A.decay
    fb.gain.value = Math.min(v.ks!.feedbackMax, Math.exp(-6.908 / (hz * T60)))
    line.connect(damp); damp.connect(fb); fb.connect(line)
    line.connect(toneIn)
    const ex = keep(ctx.createBufferSource())
    ex.buffer = kit.noise
    ex.loop = false
    const eg = keep(ctx.createGain())
    eg.gain.setValueAtTime(1, t)
    eg.gain.linearRampToValueAtTime(0, t + v.ks!.exciteMs / 1000)
    ex.connect(eg); eg.connect(line)
    ex.start(t, Math.random() * 5, v.ks!.exciteMs / 1000 + 0.01)
  }

  // ---- breath: noise through resonators, in parallel with the tone ----
  if (v.breath) {
    const B = v.breath
    const src = keep(ctx.createBufferSource())
    src.buffer = kit.noise; src.loop = true
    src.start(t, Math.random() * 5)     // per-note offset: the same hiss is never heard twice
    src.stop(dead)
    const bg = keep(ctx.createGain())
    bg.gain.setValueAtTime(0.0001, t)
    bg.gain.linearRampToValueAtTime(B.level * velocity * v.gain, t + (B.attack ?? A.attack))
    bg.gain.exponentialRampToValueAtTime(Math.max(0.0002, B.level * velocity * v.gain * (B.sustainLevel ?? A.sustainLevel ?? 0.001)),
      t + (B.attack ?? A.attack) + (B.decay ?? A.decay))
    bg.gain.exponentialRampToValueAtTime(0.0001, t + total)
    bg.connect(out)
    for (const [spec, Q, g] of B.bands) {
      const bp = keep(ctx.createBiquadFilter())
      bp.type = 'bandpass'
      bp.frequency.value = Math.min(ctx.sampleRate * 0.45, typeof spec === 'number' ? spec : spec.mul * hz)
      bp.Q.value = Q
      const bgn = keep(ctx.createGain()); bgn.gain.value = g
      src.connect(bp); bp.connect(bgn); bgn.connect(bg)
    }
  }

  // ---- the exciter. In the old renderer this was 0.003-0.081% of note energy, i.e. absent. ----
  if (v.transient) {
    const T = v.transient
    const src = keep(ctx.createBufferSource())
    src.buffer = kit.noise
    src.start(t, Math.random() * 5, T.ms / 1000 + 0.005)
    const bp = keep(ctx.createBiquadFilter())
    bp.type = 'bandpass'
    bp.frequency.value = Math.min(ctx.sampleRate * 0.45, T.hzAbs ?? T.mulF0! * hz)
    bp.Q.value = T.Q ?? 1.2
    const g = keep(ctx.createGain())
    g.gain.setValueAtTime(T.level * velocity * v.gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + T.ms / 1000)
    src.connect(bp); bp.connect(g); g.connect(out)
  }

  if (v.tremolo) {
    const lfo = keep(ctx.createOscillator()); lfo.frequency.value = v.tremolo.hz
    const dg = keep(ctx.createGain()); dg.gain.value = v.tremolo.depth * g0
    lfo.connect(dg); dg.connect(amp.gain)
    lfo.start(t); lfo.stop(dead)
  }

  setTimeout(() => { for (const n of kill) n.disconnect() },
    Math.max(60, (dead - ctx.currentTime + 0.3) * 1000))
}
