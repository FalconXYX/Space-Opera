/**
 * Data sonification: the orbits ARE the music.
 *
 * An orbit is a frequency — Io goes round once every 1.769 days, which is 6.5 microhertz.
 * Multiplying a frequency by two raises it an octave and changes nothing else, so shifting
 * an orbital frequency up by ~37 octaves lands it in the audible range with every RATIO
 * between bodies preserved exactly.
 *
 * That is the whole point, and it is why this is not an arbitrary mapping: bodies locked in
 * a 2:1 orbital resonance are, once shifted, exactly an octave apart. A 3:2 resonance is a
 * perfect fifth. The consonance is not a choice made by anyone — it is the resonance itself,
 * transposed into hearing range.
 */

/** Frequency of one orbit, in hertz. */
export const orbitalHz = (periodDays: number): number => 1 / (periodDays * 86400)

/**
 * Raise a frequency by whole octaves until it lands in [lo, hi).
 * Only powers of two are used, so every interval between bodies survives untouched.
 */
export function intoAudible(hz: number, lo = 55, hi = 1760): { hz: number; octaves: number } {
  if (hz <= 0) return { hz: lo, octaves: 0 }
  let octaves = 0
  let f = hz
  while (f < lo) { f *= 2; octaves++ }
  while (f >= hi) { f /= 2; octaves-- }
  return { hz: f, octaves }
}

/** Cents between two frequencies. 1200 cents is an octave. */
export const cents = (a: number, b: number): number => 1200 * Math.log2(a / b)

interface NamedInterval { ratio: number; name: string; short: string }

/** Just intervals, which is what orbital resonances actually produce. */
const INTERVALS: NamedInterval[] = [
  { ratio: 1 / 1, name: 'unison', short: '1:1' },
  { ratio: 16 / 15, name: 'minor second', short: '16:15' },
  { ratio: 9 / 8, name: 'major second', short: '9:8' },
  { ratio: 6 / 5, name: 'minor third', short: '6:5' },
  { ratio: 5 / 4, name: 'major third', short: '5:4' },
  { ratio: 4 / 3, name: 'perfect fourth', short: '4:3' },
  { ratio: 45 / 32, name: 'tritone', short: '45:32' },
  { ratio: 3 / 2, name: 'perfect fifth', short: '3:2' },
  { ratio: 8 / 5, name: 'minor sixth', short: '8:5' },
  { ratio: 5 / 3, name: 'major sixth', short: '5:3' },
  { ratio: 9 / 5, name: 'minor seventh', short: '9:5' },
  { ratio: 15 / 8, name: 'major seventh', short: '15:8' },
  { ratio: 2 / 1, name: 'octave', short: '2:1' },
]

export interface IntervalReading {
  /** Period ratio, always >= 1. */
  ratio: number
  /** What the interval is called, compound octaves included. */
  name: string
  short: string
  /** How far the real ratio sits from that interval. Small means a tight resonance. */
  centsOff: number
  /** Whole octaves spanned. */
  octaves: number
}

const plural = (n: number) => (n === 1 ? 'octave' : `${n} octaves`)

/**
 * Read a period ratio as a musical interval.
 *
 * The ratio is folded by octaves into [1, 2) and matched there, then the octaves are put
 * back on — so a 4:1 resonance reads as "2 octaves" rather than as a unison, which is what
 * a naive fold reports and is the kind of wrong that makes the whole readout untrustworthy.
 */
export function readInterval(periodA: number, periodB: number): IntervalReading {
  const ratio = Math.max(periodA, periodB) / Math.min(periodA, periodB)
  let folded = ratio
  let octaves = 0
  while (folded >= 2) { folded /= 2; octaves++ }
  // Just below an octave is an octave slightly flat, not a seventh.
  if (folded > 2 / Math.pow(2, 1 / 24)) { folded /= 2; octaves++ }

  let best = INTERVALS[0]
  let bestOff = Infinity
  for (const iv of INTERVALS) {
    if (iv.ratio >= 2) continue
    const off = cents(folded, iv.ratio)
    if (Math.abs(off) < Math.abs(bestOff)) { bestOff = off; best = iv }
  }

  const isUnison = best.ratio === 1
  const name = isUnison
    ? (octaves === 0 ? 'unison' : plural(octaves))
    : (octaves === 0 ? best.name : `${plural(octaves)} + ${best.name}`)
  const short = isUnison && octaves > 0 ? `${Math.pow(2, octaves)}:1` : best.short

  return { ratio, name, short, centsOff: bestOff, octaves }
}

/**
 * Nearest small whole-number ratio p:q — which is what "resonance" actually means.
 *
 * Closeness alone is the wrong test. 7:3 fits Ganymede and Callisto to half a cent, but
 * seven-to-three is not why those moons are where they are, whereas Io and Europa at 2:1
 * are six cents out and are the textbook lock. Complexity has to cost something, so the
 * score charges for the size of the integers.
 */
const COMPLEXITY_COST = 6

export function smallRatio(periodA: number, periodB: number, maxTerm = 8): { p: number; q: number; centsOff: number; score: number } {
  const target = Math.max(periodA, periodB) / Math.min(periodA, periodB)
  let bp = 1, bq = 1, bestOff = Infinity, bestScore = Infinity
  for (let q = 1; q <= maxTerm; q++) {
    for (let p = q; p <= maxTerm * 2; p++) {
      if (gcd(p, q) !== 1) continue
      const off = Math.abs(cents(target, p / q))
      const score = off + COMPLEXITY_COST * (p + q)
      if (score < bestScore) { bestScore = score; bestOff = off; bp = p; bq = q }
    }
  }
  return { p: bp, q: bq, centsOff: bestOff, score: bestScore }
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/** Nearest equal-tempered note name, for orientation only — the pitch itself is the data. */
export function nearestNoteName(hz: number): string {
  const midi = Math.round(69 + 12 * Math.log2(hz / 440))
  return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`
}

export interface ResonantPair<T> {
  a: T
  b: T
  p: number
  q: number
  ratio: number
  centsOff: number
  /** Closeness with a penalty for complicated integers; lower is a stronger resonance. */
  score: number
  interval: IntervalReading
}

/**
 * Rank every pair in a system by how close it sits to a small whole-number ratio.
 *
 * Adjacent pairs are the obvious thing to show and the wrong one: Saturn's real locks are
 * Mimas with Tethys and Enceladus with Dione, neither of which is adjacent. Letting the
 * data pick the pairs finds the resonances instead of assuming where they are.
 */
export function rankResonances<T extends { periodDays: number }>(
  bodies: T[], maxTerm = 8,
): Array<ResonantPair<T>> {
  const out: Array<ResonantPair<T>> = []
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const lo = bodies[i].periodDays <= bodies[j].periodDays ? bodies[i] : bodies[j]
      const hi = lo === bodies[i] ? bodies[j] : bodies[i]
      const r = smallRatio(lo.periodDays, hi.periodDays, maxTerm)
      out.push({
        a: lo, b: hi, p: r.p, q: r.q,
        ratio: hi.periodDays / lo.periodDays,
        centsOff: r.centsOff,
        score: r.score,
        interval: readInterval(lo.periodDays, hi.periodDays),
      })
    }
  }
  return out.sort((x, y) => x.score - y.score)
}

const PITCH_CLASS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

interface ChordShape { name: string; intervals: number[] }

/** Ordered so that, on a tie, the simpler reading wins. */
const SHAPES: ChordShape[] = [
  { name: 'open fifth', intervals: [0, 7] },
  { name: 'major', intervals: [0, 4, 7] },
  { name: 'minor', intervals: [0, 3, 7] },
  { name: 'sus4', intervals: [0, 5, 7] },
  { name: 'sus2', intervals: [0, 2, 7] },
  { name: 'diminished', intervals: [0, 3, 6] },
  { name: 'major 6th', intervals: [0, 4, 7, 9] },
  { name: 'minor 6th', intervals: [0, 3, 7, 9] },
  { name: 'major 7th', intervals: [0, 4, 7, 11] },
  { name: 'minor 7th', intervals: [0, 3, 7, 10] },
  { name: 'dominant 7th', intervals: [0, 4, 7, 10] },
  { name: 'add9', intervals: [0, 2, 4, 7] },
  { name: 'minor add9', intervals: [0, 2, 3, 7] },
  { name: 'minor 9th', intervals: [0, 2, 3, 7, 10] },
  { name: 'major 9th', intervals: [0, 2, 4, 7, 11] },
]

export interface ChordReading {
  /** e.g. "G♯ minor". */
  name: string
  root: string
  quality: string
  /** The distinct pitch classes present, from the root up. */
  spelling: string[]
  /** True when every sounded pitch class belongs to the named chord. */
  exact: boolean
}

/**
 * Name the chord a set of pitches spells.
 *
 * This is a read-out, not a decision: the pitches come from the orbital periods, and this
 * only says what they landed on. If the moons spell something with no name, it says so
 * rather than rounding to the nearest tidy answer.
 */
export function describeChord(hzList: number[]): ChordReading | null {
  if (hzList.length < 2) return null
  const classes = new Set<number>()
  for (const hz of hzList) {
    if (!(hz > 0)) continue
    const midi = Math.round(69 + 12 * Math.log2(hz / 440))
    classes.add(((midi % 12) + 12) % 12)
  }
  const present = [...classes]
  if (present.length < 2) {
    const r = present[0] ?? 0
    return { name: `${PITCH_CLASS[r]} unison`, root: PITCH_CLASS[r], quality: 'unison', spelling: [PITCH_CLASS[r]], exact: true }
  }

  let best: { root: number; shape: ChordShape; score: number; covered: number } | null = null
  for (let root = 0; root < 12; root++) {
    for (const shape of SHAPES) {
      const set = new Set(shape.intervals.map((i) => (root + i) % 12))
      let covered = 0
      for (const c of present) if (set.has(c)) covered++
      const extra = present.length - covered          // sounded notes the chord cannot hold
      const missing = shape.intervals.length - covered // chord tones nobody sounds
      const score = covered * 3 - extra * 4 - missing * 2
      if (!best || score > best.score) best = { root, shape, score, covered }
    }
  }
  if (!best) return null

  const set = new Set(best.shape.intervals.map((i) => (best!.root + i) % 12))
  const exact = present.every((c) => set.has(c)) && best.covered === best.shape.intervals.length
  const spelling = present
    .slice()
    .sort((a, b) => ((a - best!.root + 12) % 12) - ((b - best!.root + 12) % 12))
    .map((c) => PITCH_CLASS[c])

  return {
    name: `${PITCH_CLASS[best.root]} ${best.shape.name}`,
    root: PITCH_CLASS[best.root],
    quality: best.shape.name,
    spelling,
    exact,
  }
}

/**
 * The resonant chain: the adjacent whole-number ratios along the longest unbroken run of
 * locks, ordered by period.
 *
 * Expressing a chain as multiples of its fastest member only works when every link is an
 * integer. TRAPPIST-1 opens on 8:5, so that reading produces "1 : 1.6 : 2.7 : 4" — true,
 * unreadable, and not how any paper on these systems describes them. Adjacent ratios are
 * both exact and the standard notation: 8:5 · 5:3 · 3:2 · 3:2 · 4:3.
 */
export function chainOf<T extends { periodDays: number }>(
  bodies: T[], tolCents = 15,
): { links: string[]; members: T[] } | null {
  const sorted = [...bodies].sort((a, b) => a.periodDays - b.periodDays)
  if (sorted.length < 2) return null

  let bestStart = 0, bestLen = 0
  let start = 0
  for (let i = 1; i <= sorted.length; i++) {
    const linked = i < sorted.length &&
      smallRatio(sorted[i - 1].periodDays, sorted[i].periodDays).centsOff < tolCents
    if (!linked) {
      if (i - start > bestLen) { bestLen = i - start; bestStart = start }
      start = i
    }
  }
  if (bestLen < 2) return null

  const members = sorted.slice(bestStart, bestStart + bestLen)
  const links: string[] = []
  for (let i = 1; i < members.length; i++) {
    const r = smallRatio(members[i - 1].periodDays, members[i].periodDays)
    links.push(`${r.p}:${r.q}`)
  }
  return { links, members }
}
