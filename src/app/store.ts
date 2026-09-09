import { create } from 'zustand'
import { SYSTEMS } from '../core/systems'

/**
 * What the listener has changed about one body.
 *
 * Everything here is optional, and absent means "whatever the physics chose". A body only
 * appears in the map once it has been touched, so a reset is a delete and the difference
 * between the sky's own arrangement and yours is always recoverable.
 */
export interface BodyEdit {
  /** Force sounding on or off, overriding the audible-rate window. */
  on?: boolean
  /** Whole octaves. A power of two, so bodies moved together keep their interval. */
  octave?: number
  /** Which of the sixteen voices, overriding the rank-spread default. */
  voiceId?: string
  /** Stereo position, -1 to 1. */
  pan?: number
}

export type Panel = 'none' | 'mix' | 'about'

export interface State {
  /** Which family of bodies is on the dial. */
  systemId: string
  /** Days of sky per real second. */
  tau: number
  playing: boolean
  volume: number
  audioReady: boolean
  /** Which drawer is open. One at a time, and none of them on landing. */
  panel: Panel
  /** Keyed `systemId:bodyId`, so each system keeps its own arrangement. */
  edits: Record<string, BodyEdit>

  setSystem: (id: string) => void
  setTau: (t: number) => void
  setPlaying: (p: boolean) => void
  setVolume: (v: number) => void
  setAudioReady: (r: boolean) => void
  setPanel: (p: Panel) => void
  edit: (bodyId: string, patch: BodyEdit) => void
  clearSystemEdits: () => void
}

export const useStore = create<State>((set) => ({
  systemId: SYSTEMS[0].id,
  tau: SYSTEMS[0].tau,
  playing: true,
  volume: 0.85,
  audioReady: false,
  panel: 'none',
  edits: {},

  setSystem: (systemId) => set({ systemId, tau: SYSTEMS.find((s) => s.id === systemId)?.tau ?? 3 }),
  setTau: (tau) => set({ tau }),
  setPlaying: (playing) => set({ playing }),
  setVolume: (volume) => set({ volume }),
  setAudioReady: (audioReady) => set({ audioReady }),
  setPanel: (panel) => set({ panel }),

  edit: (bodyId, patch) => set((st) => {
    const key = `${st.systemId}:${bodyId}`
    return { edits: { ...st.edits, [key]: { ...st.edits[key], ...patch } } }
  }),

  clearSystemEdits: () => set((st) => {
    const prefix = `${st.systemId}:`
    const next: Record<string, BodyEdit> = {}
    for (const [k, v] of Object.entries(st.edits)) if (!k.startsWith(prefix)) next[k] = v
    return { edits: next }
  }),
}))

/** How many bodies in this system have been changed at all. */
export const editCount = (edits: Record<string, BodyEdit>, systemId: string): number =>
  Object.keys(edits).filter((k) => k.startsWith(`${systemId}:`)).length
