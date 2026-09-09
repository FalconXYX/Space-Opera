/**
 * Turns orbital events into sound.
 *
 * Nothing here decides what note to play. A body's pitch is its own orbital frequency
 * raised into hearing range, and it sounds when the body reaches a fixed direction. The
 * rhythm is the orbital period and the harmony is the period ratios — the music is the
 * data, not a score laid over it.
 */
import type { TimeBase } from '../core/timebase'
import { audioAt, retime, simAt } from '../core/timebase'
import type { Audio, TT, Tau } from '../core/units'
import { playNote } from './voices'
import type { Kit } from './voices'
import type { Voice } from './voices'
import { currentAudioTime } from './graph'

export const TICK_MS = 25
export const HORIZON = 0.14
export const REANCHOR_LEAD = 0.06

export type VoiceKind = 'orbit' | 'conjunction' | 'opposition'

export interface VoiceSource {
  id: string
  kind: VoiceKind
  /** Body that lights up when this sounds. */
  bodyId: string
  /** The other body, for a conjunction. */
  otherId?: string
  /** Pitch in hertz — the orbital frequency, octave-shifted. */
  hz: number
  /** Second pitch sounded with the first, so an alignment is heard as its interval. */
  hz2?: number
  velocity: number
  /** Chosen from how often this body fires and where it sits, not by the listener. */
  instrument: Voice
  /** Where it sits in the stereo field, -1 to 1. */
  pan?: number
  /** Event times strictly inside (a, b), ascending. */
  between: (a: number, b: number) => number[]
}

export interface Flash {
  bodyId: string
  otherId?: string
  voiceId: string
  kind: VoiceKind
  hz: number
  at: number
  tt: number
  epoch: number
}

export class Scheduler {
  private tb: TimeBase
  private dest: AudioNode
  private ctx: BaseAudioContext
  private getVoices: () => VoiceSource[]
  private cursor: TT

  flashes: Flash[] = []
  kit: Kit
  underruns = 0

  constructor(
    tb: TimeBase, dest: AudioNode, ctx: BaseAudioContext, getVoices: () => VoiceSource[], kit: Kit,
  ) {
    this.tb = tb
    this.dest = dest
    this.ctx = ctx
    this.getVoices = getVoices
    this.kit = kit
    this.cursor = tb.simAnchor
  }

  get simNow(): TT { return simAt(this.tb, currentAudioTime() as Audio) }

  /** Visual sim time, offset by output latency so the flash lands on the sample. */
  visualSimTime(): TT {
    const ctx = this.ctx as AudioContext
    const latency = ctx.outputLatency ?? ctx.baseLatency ?? 0
    return simAt(this.tb, (currentAudioTime() + latency) as Audio)
  }

  retime(tau?: Tau, seekTo?: TT): void {
    const now = currentAudioTime() as Audio
    this.tb = retime(this.tb, now, tau, seekTo)
    this.cursor = this.tb.simAnchor
    this.flashes = this.flashes.filter((f) => f.epoch === this.tb.epoch)
  }

  invalidate(): void { this.retime() }

  tick(): void {
    if (this.tb.tau === 0) return
    const now = currentAudioTime()
    const simUntil = simAt(this.tb, (now + HORIZON) as Audio)
    if (simUntil === this.cursor) return

    const lo = Math.min(this.cursor, simUntil)
    const hi = Math.max(this.cursor, simUntil)
    const pending: Array<{ tt: number; v: VoiceSource }> = []
    for (const v of this.getVoices()) {
      for (const tt of v.between(lo, hi)) pending.push({ tt, v })
    }

    // Events arrive in decreasing sim time when running backwards but always in increasing
    // audio time, so sorting by audio time is the whole of reverse playback.
    pending.sort((a, b) => audioAt(this.tb, a.tt as TT) - audioAt(this.tb, b.tt as TT))

    // A runaway time-compression could otherwise ask for thousands of oscillators in one
    // tick and stall the tab.
    const MAX_PER_TICK = 48
    if (pending.length > MAX_PER_TICK) pending.length = MAX_PER_TICK

    for (const p of pending) {
      const at = audioAt(this.tb, p.tt as TT)
      if (at < now) this.underruns++
      playNote(this.ctx, this.dest, at, p.v.hz, p.v.velocity, p.v.instrument, this.kit, p.v.pan ?? 0)
      // Two bodies lining up is heard as the interval between them, which is the resonance
      // itself — so an alignment sounds as a dyad, not a single chime.
      if (p.v.hz2) playNote(this.ctx, this.dest, at, p.v.hz2, p.v.velocity * 0.8, p.v.instrument, this.kit, p.v.pan ?? 0)
      this.flashes.push({
        bodyId: p.v.bodyId, otherId: p.v.otherId, voiceId: p.v.id,
        kind: p.v.kind, hz: p.v.hz, at, tt: p.tt, epoch: this.tb.epoch,
      })
    }

    if (this.flashes.length > 400) this.flashes.splice(0, this.flashes.length - 400)
    this.cursor = simUntil
  }
}
