/**
 * Which voice a body sounds in.
 *
 * THE BUG THIS REPLACES. The old rule was instrumentFor(secondsPerOrbit, hz) — but pitch is
 * rate * 2^7 and secondsPerOrbit is 1/rate, so hz * secondsPerOrbit is exactly 128 for every
 * body, always. Its two arguments were one number, its `hz < 150` tie-break was a restatement
 * of `secondsPerOrbit > 0.853`, and seven of its twelve instruments — including every
 * sustained voice — could never be selected by anything at any speed. Four bright struck
 * voices did all the work, which is exactly why it sounded like one instrument.
 *
 * WHY THERE IS NO PHYSICAL ANSWER. Kepler makes semi-major axis a monotone function of period
 * (Spearman rho = 1.0000 in seven of the eight systems), and mass and radius are missing for
 * most of these bodies. Period, orbital radius, note rate, pitch and register are the same
 * number. There is exactly one physical degree of freedom per body and it is already spent on
 * pitch and rhythm, so no rule drawn from orbital data can give two bodies of similar period
 * different voices. Saturn's inner moons would collapse onto one timbre under any such rule,
 * however it was dressed up as physics.
 *
 * SO THIS IS AN ORCHESTRATION DECISION, and it is stated as one. A body's voice comes from
 * where it sits in the ensemble that is currently sounding, darkest at the bottom to brightest
 * at the top. That guarantees the palette is spread however crowded the pitches are, and keeps
 * the one thing a listener expects: low sounds darker. Nothing about pitch or timing is
 * touched by it.
 */
import { SET } from './voiceset'
import { fitToGap } from './voices'
import type { Voice } from './voices'

/** Dark and sustained through to bright and short. The set is authored in this order. */
const PALETTE = Object.keys(SET)

export type { Voice }
export { SET }

/**
 * @param rank01 where this body sits in the sounding ensemble, 0 lowest to 1 highest.
 * @param notesPerSecond how often it comes round — its orbit, in listening seconds.
 * @param chosen a voice the listener picked, which overrides the rank spread entirely.
 *
 * The ring time is the one part physics does fix, and it is applied to a chosen voice just as
 * to a default one: a note has to have died away before the body comes round again, and the
 * gap between returns IS the orbit. Pick a four-second pad for a body that returns twice a
 * second and you get that pad, shortened — not a wash.
 */
export function voiceFor(rank01: number, notesPerSecond: number, chosen?: Voice): Voice {
  const i = Math.max(0, Math.min(PALETTE.length - 1, Math.round(rank01 * (PALETTE.length - 1))))
  return fitToGap(chosen ?? SET[PALETTE[i]], 1 / Math.max(notesPerSecond, 0.05))
}

/**
 * Where a body sits in the stereo field, -1 to 1.
 *
 * Pitch cannot separate voices packed into one octave, but space can. The ordering matters more
 * than it looks: roughness is a within-ear phenomenon, so the pairs that actually clash are the
 * ones ADJACENT in pitch — and spreading the ensemble smoothly low-to-high seats exactly those
 * pairs next to each other. Alternating instead puts every neighbouring pair in opposite ears,
 * which is where the separation is worth having. Voices two apart share a side, and those are
 * far enough apart in pitch not to fight.
 *
 * Like the timbre order this is a presentation choice, not a measurement, and nothing about
 * pitch or timing depends on it.
 */
export function panFor(rankIndex: number, count: number, spread = 0.75): number {
  if (count < 2) return 0
  const side = rankIndex % 2 === 0 ? -1 : 1
  // Nudge each successive same-side voice inward so a big ensemble is not just two points.
  const depth = 1 - Math.min(0.45, Math.floor(rankIndex / 2) * (0.9 / count))
  return side * spread * depth
}
