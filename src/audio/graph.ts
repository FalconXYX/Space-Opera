/**
 * The audio bus.
 *
 * Deliberately minimal: an output gain, and a trace of room that defaults to almost nothing.
 *
 * There is no compressor and no limiter — dynamics are part of the music. And the reverb is
 * dry by default: a wet tail smears consecutive notes into each other, which is fatal when
 * the whole question is whether you can recognise a melody. It is a slider, not a fixture.
 *
 * Tone.js is used for its reverb and its worker-driven clock, not as a sequencer:
 * Tone.Transport thinks in bars and beats and cannot run at a negative rate.
 */
import * as Tone from 'tone'
import { buildKit } from './voices'
import type { Kit } from './voices'

export interface AudioGraph {
  ctx: BaseAudioContext
  busIn: AudioNode
  /** Wavetables, noise and the shaper curve — built once, shared by every note. */
  kit: Kit
  reverb: Tone.Reverb
  setReverb: (wet: number) => void
  setVolume: (v: number) => void
}

let graph: AudioGraph | null = null

/**
 * Must be called from a real user gesture. An AudioContext starts suspended with
 * currentTime frozen at 0, so every scheduled time looks like it is in the past and every
 * note fires at once — the classic failure in this kind of app.
 */
export async function initAudio(): Promise<AudioGraph> {
  if (graph) return graph
  await Tone.start()
  Tone.getContext().lookAhead = 0.02

  const input = new Tone.Gain(1)
  const dry = new Tone.Gain(1)
  const wet = new Tone.Gain(0.06)
  const reverb = new Tone.Reverb({ decay: 1.4, preDelay: 0.004, wet: 1 })
  const out = new Tone.Gain(0.85)

  input.connect(dry)
  input.connect(reverb)
  reverb.connect(wet)
  dry.connect(out)
  wet.connect(out)
  out.toDestination()
  await reverb.generate()

  const ctx = Tone.getContext().rawContext as unknown as BaseAudioContext
  graph = {
    ctx,
    kit: buildKit(ctx),
    busIn: input.input as unknown as AudioNode,
    reverb,
    setReverb: (v: number) => { wet.gain.rampTo(v, 0.1); dry.gain.rampTo(1, 0.1) },
    setVolume: (v: number) => { out.gain.rampTo(v, 0.05) },
  }
  return graph
}

export const currentAudioTime = (): number => Tone.getContext().currentTime
export const audioGraph = (): AudioGraph | null => graph
