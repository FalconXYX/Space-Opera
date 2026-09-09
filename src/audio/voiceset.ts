/**
 * The sixteen voices, ordered dark to bright.
 *
 * voiceFor() spreads whatever is currently sounding across this list by rank, so an ensemble
 * always reaches both ends of it however crowded its pitches are. Every number here is a real
 * synthesis parameter, not a preset name: absolute-Hz formant bodies mean a voice reads
 * differently at 60 Hz than at 600, which is the thing a purely harmonic set cannot do.
 */
import type { Voice } from './voices'


export const SET: Record<string, Voice> = {
  /* ================= SUSTAINED / LOW ================= */
  abyss: {
    id: 'abyss', name: 'abyss', family: 'sustained bass', core: 'filtered',
    wave: 'tri', unison: [0], subSine: 0.55, drive: 2.4,
    filter: { type: 'lowpass', Q: 1.05, stages: 2, track: 0.85, mulF0: 3.4, hzAbs: 240,
      env: [1.0, 1.7, 0.65], fAttack: 0.12, fDecay: 0.9 },
    amp: { attack: 0.09, hold: 0.14, decay: 1.5, sustainLevel: 0.32, release: 0.35 },
    gain: 0.0698,
  },
  bowLow: {
    id: 'bowLow', name: 'low bow', family: 'bowed', core: 'filtered',
    wave: 'saw', unison: [-7, 0, 7],
    filter: { type: 'lowpass', Q: 2.6, track: 0.75, mulF0: 3.2, hzAbs: 300,
      env: [1.0, 2.8, 1.2], fAttack: 0.22, fDecay: 0.95 },
    breath: { level: 0.045, attack: 0.06, bands: [[{ mul: 2 }, 5, 1], [1900, 2.2, 0.55]] },
    transient: { level: 0.035, ms: 45, hzAbs: 2600, Q: 0.85, shape: 1.3 },
    vibrato: { hz: 4.7, cents: 9, delay: 0.45 },
    amp: { attack: 0.17, hold: 0.22, decay: 1.15, sustainLevel: 0.42, release: 0.30 },
    gain: 0.1407,
  },
  halo: {
    id: 'halo', name: 'halo', family: 'pad', core: 'filtered',
    wave: 'saw', unison: [-12, -4, 4, 12], subSine: 0.3,
    filter: { type: 'lowpass', Q: 0.7, stages: 2, track: 0.9, mulF0: 3.6, hzAbs: 620,
      env: [0.45, 2.0, 0.85], fAttack: 0.95, fDecay: 1.7 },
    amp: { attack: 0.75, hold: 0.30, decay: 1.9, sustainLevel: 0.38, release: 0.6 },
    gain: 0.1324,
  },
  choir: {
    id: 'choir', name: 'voices', family: 'vowel', core: 'filtered',
    wave: 'saw', unison: [-13, -4, 4, 13], toneLevel: 0.85,
    filter: { type: 'lowpass', Q: 0.7, track: 0.2, mulF0: 14, hzAbs: 3400, env: [1, 1, 1] },
    // /a/-ish formants, ABSOLUTE — so this voice reads differently at 60 Hz than at 600 Hz
    body: [[730, 7, 17], [1150, 9, 12], [2600, 10, 8], [200, 1.0, -9]],
    breath: { level: 0.10, attack: 0.16, bands: [[730, 8, 1], [2600, 6, 0.7]] },
    vibrato: { hz: 5.4, cents: 14, delay: 0.40 },
    amp: { attack: 0.23, hold: 0.25, decay: 1.35, sustainLevel: 0.48, release: 0.32 },
    gain: 0.1682,
  },
  air: {
    id: 'air', name: 'air', family: 'breath', core: 'filtered',
    wave: 'tri', unison: [0], toneLevel: 0.22,
    breath: { level: 1.15, attack: 0.22,
      bands: [[{ mul: 1 }, 22, 1], [{ mul: 2 }, 16, 0.75], [{ mul: 3 }, 12, 0.5],
        [{ mul: 5 }, 9, 0.30], [3800, 0.7, 0.22]] },
    amp: { attack: 0.30, hold: 0.20, decay: 1.25, sustainLevel: 0.5, release: 0.35 },
    gain: 0.4524,
  },
  viol: {
    id: 'viol', name: 'viol', family: 'bowed', core: 'filtered',
    wave: 'saw', unison: [-6, 0, 6],
    filter: { type: 'lowpass', Q: 4.6, track: 0.5, mulF0: 7, hzAbs: 1500,
      env: [1.4, 4.0, 1.9], fAttack: 0.10, fDecay: 0.6 },
    // violin corpus: A0 / B1- / B1+ / bridge hill — ABSOLUTE
    body: [[280, 3.0, 5], [460, 3.5, 6], [800, 4.0, 3], [2400, 2.2, 5]],
    breath: { level: 0.05, attack: 0.05, bands: [[3000, 1.6, 1]] },
    transient: { level: 0.06, ms: 22, hzAbs: 3200, Q: 0.8, shape: 1.6 },
    vibrato: { hz: 5.6, cents: 12, delay: 0.30 },
    amp: { attack: 0.075, hold: 0.16, decay: 0.95, sustainLevel: 0.40, release: 0.22 },
    gain: 0.1005,
  },
  reed: {
    id: 'reed', name: 'reed', family: 'blown', core: 'filtered',
    wave: 'reed', unison: [-3, 3], drive: 1.5,
    filter: { type: 'lowpass', Q: 1.6, track: 0.25, mulF0: 9, hzAbs: 1250,
      env: [0.85, 1.35, 1.0], fAttack: 0.05, fDecay: 0.5 },
    body: [[440, 2.4, 9], [1400, 2.0, 5], [2900, 1.6, -5]], // bassoon formants, ABSOLUTE
    breath: { level: 0.07, attack: 0.04, bands: [[1600, 1.2, 1]] },
    amp: { attack: 0.05, hold: 0.20, decay: 0.95, sustainLevel: 0.45, release: 0.20 },
    gain: 0.0552,
  },

  /* ================= RESONANT / STRUCK ================= */
  glass: {
    id: 'glass', name: 'glass', family: 'glass', core: 'modal',
    modes: [[1, 1, 1], [2.32, 0.62, 1.4], [4.25, 0.40, 1.9], [6.63, 0.22, 2.5],
      [9.38, 0.10, 3.2], [12.8, 0.04, 4.0]],
    spread: 2, jitter: 0.10,
    breath: { level: 0.45, attack: 0.10,
      bands: [[{ mul: 2.32 }, 26, 1], [{ mul: 4.25 }, 18, 0.6], [6000, 0.7, 0.15]] },
    amp: { attack: 0.13, hold: 0.35, decay: 2.2, sustainLevel: 0.28, release: 0.5 },
    gain: 0.2415,
  },
  bell: {
    id: 'bell', name: 'bell', family: 'struck metal', core: 'modal',
    // hum, prime, tierce, quint, nominal and two upper. The 2.51/2.66/3.01 cluster of a real
    // minor-third bell is the roughest thing in the set; it is kept but held well down.
    modes: [[0.5, 0.9, 0.7], [1, 1, 1], [1.19, 0.5, 1.5], [1.5, 0.34, 1.8], [2, 0.42, 2.0],
      [2.66, 0.10, 2.9], [3.01, 0.07, 3.3], [4.1, 0.03, 4.2]],
    spread: 1.5, jitter: 0.10, beatCents: 3.5, beatBelow: 2.1,
    transient: { level: 0.10, ms: 9, hzAbs: 3400, Q: 0.9, shape: 2.6 },
    amp: { attack: 0.003, decay: 2.6, release: 0.2 },
    gain: 0.1883,
  },
  chime: {
    id: 'chime', name: 'chime', family: 'FM metal', core: 'fm',
    fm: { ratio: 3.46, index: [5.5, 0.30], indexDecay: 0.55 },
    filter: { type: 'lowpass', Q: 0.8, track: 0.8, mulF0: 13, hzAbs: 3400, env: [1, 1, 0.55], fDecay: 0.8 },
    transient: { level: 0.07, ms: 7, hzAbs: 5200, Q: 0.7, shape: 3 },
    amp: { attack: 0.002, decay: 2.1, release: 0.2 },
    gain: 0.2266,
  },
  tine: {
    id: 'tine', name: 'tine', family: 'FM tine', core: 'fm',
    fm: { ratio: 14, index: [3.0, 0.14], indexDecay: 0.26 },
    body: [[900, 1.6, 6], [220, 1.2, 4], [3500, 0.9, -6]],
    transient: { level: 0.05, ms: 6, hzAbs: 2400, Q: 1.0, shape: 3 },
    amp: { attack: 0.003, decay: 1.5, release: 0.2 },
    gain: 0.1899,
  },
  gut: {
    id: 'gut', name: 'gut string', family: 'plucked', core: 'filtered',
    // Was a Karplus-Strong loop. Measured through an OfflineAudioContext it diverged — a peak
    // of 2.0e31, an audible catastrophe — because a DelayNode inside a feedback cycle is
    // clamped to a render quantum and the damping filter's phase makes the loop gain hard to
    // hold under one across every pitch a body might take. A filtered pluck is stable at all
    // of them and keeps the same dark, woody character through its body resonances.
    wave: 'saw', unison: [-4, 4], drive: 1.4,
    filter: { type: 'lowpass', Q: 2.2, track: 0.85, mulF0: 9, hzAbs: 1500,
      env: [1.0, 1.35, 0.09], fAttack: 0.003, fDecay: 0.42 },
    body: [[190, 2.2, 6], [430, 2.6, 4], [2800, 1.2, -4]],
    transient: { level: 0.10, ms: 14, mulF0: 6, Q: 1.1, shape: 2.0 },
    amp: { attack: 0.003, decay: 1.5, sustainLevel: 0.004, release: 0.14 },
    gain: 0.125,
  },
  harp: {
    id: 'harp', name: 'harp', family: 'plucked', core: 'filtered',
    wave: 'saw', unison: [0],
    filter: { type: 'lowpass', Q: 1.3, track: 0.9, mulF0: 17, hzAbs: 2200,
      env: [1.0, 1.0, 0.13], fAttack: 0.004, fDecay: 0.30 },
    body: [[330, 1.8, 4], [1400, 1.2, 2]],
    transient: { level: 0.07, ms: 5, mulF0: 6, Q: 1.1, shape: 3 },
    amp: { attack: 0.004, decay: 1.35, release: 0.15 },
    gain: 0.2943,
  },
  wood: {
    id: 'wood', name: 'wood', family: 'struck wood', core: 'modal',
    modes: [[1, 1, 1], [3.98, 0.40, 2.6], [6.71, 0.10, 3.6], [10.65, 0.09, 4.6]],
    spread: 3, jitter: 0.15,
    body: [[420, 1.4, 5], [2600, 0.8, 5], [150, 1.0, -6]],
    transient: { level: 0.55, ms: 8, hzAbs: 2000, Q: 0.6, shape: 3.0 },
    amp: { attack: 0.002, decay: 0.55, release: 0.1 },
    gain: 0.3184,
  },
  kalimba: {
    id: 'kalimba', name: 'kalimba', family: 'tine', core: 'modal',
    modes: [[1, 1, 1], [2.72, 0.55, 2.0], [5.4, 0.24, 3.0], [8.9, 0.10, 4.2], [13.2, 0.04, 5.5]],
    spread: 4, jitter: 0.14,
    body: [[240, 2.5, 8], [1400, 1.1, -5]],
    transient: { level: 0.30, ms: 5, mulF0: 4, Q: 1.0, shape: 3 },
    amp: { attack: 0.003, decay: 0.8, release: 0.1 },
    gain: 0.1453,
  },
  musicbox: {
    id: 'musicbox', name: 'music box', family: 'struck metal', core: 'modal',
    // a real comb tine is thin at the fundamental: the note is in the upper partials
    modes: [[1, 0.55, 1], [2, 0.85, 1.5], [3.02, 0.70, 2.0], [4.18, 0.50, 2.6],
      [5.43, 0.32, 3.2], [7.15, 0.20, 4.0], [9.1, 0.12, 4.8], [11.4, 0.06, 5.6]],
    spread: 5, jitter: 0.16,
    body: [[2600, 0.7, 5], [180, 0.8, -8]],
    transient: { level: 0.12, ms: 3.5, mulF0: 10, Q: 1.0, shape: 3 },
    amp: { attack: 0.0015, decay: 0.7, release: 0.1 },
    gain: 0.3155,
  },
}
