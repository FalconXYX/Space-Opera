/**
 * GENERATED — do not edit. Run `node tools/fetch-exo.mjs && node tools/emit-exo.mjs`.
 *
 * Periods, semi-major axes and transit epochs from the NASA Exoplanet Archive, period and
 * epoch taken from the same published row. `phase0` is the mean longitude at J2000 implied by
 * that transit epoch, so longitude zero — the reading line — is the direction of Earth. These
 * planets sound when they transit, which is how every one of them was discovered.
 */
import type { PoolBody } from './pool'

export const EXO_BODIES: PoolBody[] = [
  {
    "id": "hd110067b",
    "name": "b",
    "periodDays": 9.113678,
    "a": 0.0793,
    "parent": "hd110067",
    "color": "#c9d3e8",
    "exact": false,
    "phase0": 272.6274
  },
  {
    "id": "hd110067c",
    "name": "c",
    "periodDays": 13.673694,
    "a": 0.1039,
    "parent": "hd110067",
    "color": "#b8c6e0",
    "exact": false,
    "phase0": 255.8336
  },
  {
    "id": "hd110067d",
    "name": "d",
    "periodDays": 20.519617,
    "a": 0.1362,
    "parent": "hd110067",
    "color": "#a9bad8",
    "exact": false,
    "phase0": 63.2423
  },
  {
    "id": "hd110067e",
    "name": "e",
    "periodDays": 30.793091,
    "a": 0.1785,
    "parent": "hd110067",
    "color": "#9caed0",
    "exact": false,
    "phase0": 330.6678
  },
  {
    "id": "hd110067f",
    "name": "f",
    "periodDays": 41.05854,
    "a": 0.2163,
    "parent": "hd110067",
    "color": "#8fa3c8",
    "exact": false,
    "phase0": 289.4712
  },
  {
    "id": "hd110067g",
    "name": "g",
    "periodDays": 54.76992,
    "a": 0.2621,
    "parent": "hd110067",
    "color": "#8298c0",
    "exact": false,
    "phase0": 326.1891
  },
  {
    "id": "trappist1b",
    "name": "b",
    "periodDays": 1.51088432,
    "a": 0.011534,
    "parent": "trappist1",
    "color": "#758dB8",
    "exact": false,
    "phase0": 25.6014
  },
  {
    "id": "trappist1c",
    "name": "c",
    "periodDays": 2.42179346,
    "a": 0.01579,
    "parent": "trappist1",
    "color": "#c9d3e8",
    "exact": false,
    "phase0": 273.3845
  },
  {
    "id": "trappist1d",
    "name": "d",
    "periodDays": 4.04978035,
    "a": 0.02226,
    "parent": "trappist1",
    "color": "#b8c6e0",
    "exact": false,
    "phase0": 193.021
  },
  {
    "id": "trappist1e",
    "name": "e",
    "periodDays": 6.09956479,
    "a": 0.02924,
    "parent": "trappist1",
    "color": "#a9bad8",
    "exact": false,
    "phase0": 147.3049
  },
  {
    "id": "trappist1f",
    "name": "f",
    "periodDays": 9.20659399,
    "a": 0.038774,
    "parent": "trappist1",
    "color": "#9caed0",
    "exact": false,
    "phase0": 204.0312
  },
  {
    "id": "trappist1g",
    "name": "g",
    "periodDays": 12.3535557,
    "a": 0.04681528,
    "parent": "trappist1",
    "color": "#8fa3c8",
    "exact": false,
    "phase0": 204.0127
  },
  {
    "id": "trappist1h",
    "name": "h",
    "periodDays": 18.7672745,
    "a": 0.0618656,
    "parent": "trappist1",
    "color": "#8298c0",
    "exact": false,
    "phase0": 10.691
  }
]

/** Host stars, for the centre of the dial. */
export const EXO_HOSTS: Record<string, { name: string; color: string }> = {
  hd110067: { name: 'HD 110067', color: '#f2d9a8' },
  trappist1: { name: 'TRAPPIST-1', color: '#e8907a' },
}
