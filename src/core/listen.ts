/**
 * The mapping, and why it has no free parameters.
 *
 * Run time at `tau` days per real second and a body completes `tau / periodDays` orbits every
 * second. That is not a metaphor for a frequency, it IS one. Raise every body by ONE shared
 * whole number of octaves and the ratios survive exactly, so a 2:1 orbital resonance comes out
 * as an octave and a 3:2 as a perfect fifth — the consonance is the resonance, not a mapping
 * anyone chose.
 *
 *   rate_i  = tau / periodDays_i      notes per second — one per crossing of the reading line
 *   pitch_i = rate_i * 2^OCTAVES      hertz
 *
 * Pitch and rhythm are therefore the same number, scaled by 2^OCTAVES. The shift is not a
 * taste decision either. Separate notes are only heard as separate events between roughly a
 * quarter of a note and eight notes a second, and pitch is only musical between roughly 32 and
 * 1024 Hz. Both windows are five octaves wide, so exactly one shift lines them up:
 *
 *   0.25 * 2^N = 32  and  8 * 2^N = 1024   =>   N = 7
 *
 * A body that sounds once a second sings at 128 Hz. Everything else follows from its orbit.
 */
export const OCTAVES = 7

/** Slowest and fastest rates heard as a stream of notes, in notes per second. */
export const RATE_LO = 0.25
export const RATE_HI = 8

/** The same window read as pitch: 32 Hz to 1024 Hz, five octaves. */
export const HZ_LO = RATE_LO * 2 ** OCTAVES
export const HZ_HI = RATE_HI * 2 ** OCTAVES

/**
 * The reading line: ecliptic longitude zero, the J2000 vernal equinox.
 *
 * A body sounds the instant it crosses this direction. The direction has to come from
 * somewhere, and every choice except this one would be a knob dressed as physics — this is
 * simply where the coordinate system the ephemeris is written in has its origin.
 */
export const READ_ANGLE = 0

/** How often this body sounds, in notes per second, at `tau` days per real second. */
export const rateOf = (periodDays: number, tau: number): number => tau / periodDays

/** What it sounds at, in hertz. The same number, raised by the shared octaves. */
export const pitchOf = (periodDays: number, tau: number): number =>
  rateOf(periodDays, tau) * 2 ** OCTAVES

/** Whether it is heard at all. Outside the window it is still drawn, and still turning. */
export const sounds = (periodDays: number, tau: number): boolean => {
  const r = rateOf(periodDays, tau)
  return r >= RATE_LO && r <= RATE_HI
}

/**
 * The band of orbital periods that sounds at this tau, in days.
 *
 * Always a factor of RATE_HI / RATE_LO wide — 32 — however the speed is set. Moving tau slides
 * this window across the system; it never widens it, so no setting can make everything sound
 * at once and none of them is the "right" one.
 */
export const audibleBand = (tau: number): { fromDays: number; toDays: number } => ({
  fromDays: tau / RATE_HI,
  toDays: tau / RATE_LO,
})

/** Why a body is silent, for the label under it. */
export const silence = (periodDays: number, tau: number): 'fast' | 'slow' | null => {
  const r = rateOf(periodDays, tau)
  if (r > RATE_HI) return 'fast'
  if (r < RATE_LO) return 'slow'
  return null
}

/**
 * How strongly a body is heard, 0 to 1.
 *
 * The window has soft edges rather than hard ones. Partly that is musical — dragging the speed
 * would otherwise make moons appear and vanish with a click — but mostly it is honest, because
 * the edges are not real. Nothing happens to a moon at eight notes a second; it is our hearing
 * that stops resolving them as separate events, and that fades, it does not switch off.
 *
 * The same number dims the body on the dial, so what you see is how much of it you are getting.
 */
export function audibility(periodDays: number, tau: number): number {
  const r = rateOf(periodDays, tau)
  if (r <= 0) return 0
  // Work in octaves from each edge, so the taper is symmetric in pitch rather than in hertz.
  const overLo = Math.log2(r / RATE_LO)
  const underHi = Math.log2(RATE_HI / r)
  const edge = Math.min(overLo, underHi)
  if (edge <= 0) return 0
  const FADE = 0.6 // octaves
  return edge >= FADE ? 1 : edge / FADE
}
