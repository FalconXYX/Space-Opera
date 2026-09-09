/**
 * One clock, and it is the AudioContext.
 *
 * Nothing derives time from performance.now() or an accumulated rAF delta: one GC pause
 * would permanently offset visuals from audio with no recovery path. Both the note onset
 * and the visual flash are the same closed-form function of the same clock, so the flash
 * lands on the sample and a dropped frame simply re-locks.
 */
import type { Audio, TT, Tau } from './units'

export interface TimeBase {
  /** Bumped on every discontinuity. Stamped on each scheduled voice so that stale voices
   *  from before a seek can be identified and dropped. */
  epoch: number
  audioAnchor: Audio
  simAnchor: TT
  /** Simulation DAYS per LISTENING SECOND. Negative runs time backwards; 0 is paused. */
  tau: Tau
}

export const makeTimeBase = (simAnchor: TT, audioAnchor: Audio, tau: Tau): TimeBase => ({
  epoch: 0, simAnchor, audioAnchor, tau,
})

export const simAt = (tb: TimeBase, a: Audio): TT =>
  (tb.simAnchor + tb.tau * (a - tb.audioAnchor)) as TT

export const audioAt = (tb: TimeBase, s: TT): Audio =>
  (tb.audioAnchor + (s - tb.simAnchor) / tb.tau) as Audio

/**
 * The ONLY mutator. Assigning `tb.tau = x` directly retroactively changes the sim time of
 * every already-scheduled voice; the symptom looks exactly like an ephemeris bug, which is
 * how it costs days. Re-anchoring at `now` first keeps already-scheduled audio valid.
 */
export function retime(tb: TimeBase, now: Audio, tau?: Tau, seekTo?: TT): TimeBase {
  const simNow = seekTo ?? simAt(tb, now)
  return {
    epoch: tb.epoch + 1,
    audioAnchor: now,
    simAnchor: simNow,
    tau: tau ?? tb.tau,
  }
}
