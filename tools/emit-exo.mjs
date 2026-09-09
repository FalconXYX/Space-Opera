import { readFileSync, writeFileSync } from 'node:fs'
const rows = JSON.parse(readFileSync('data/exo-resonant.json', 'utf8'))
const HOSTS = {
  'HD 110067': { id: 'hd110067', color: '#f2d9a8' },
  'TRAPPIST-1': { id: 'trappist1', color: '#e8907a' },
}
const shades = ['#c9d3e8', '#b8c6e0', '#a9bad8', '#9caed0', '#8fa3c8', '#8298c0', '#758dB8']
const bodies = rows.map((r, i) => ({
  id: r.id, name: r.name, periodDays: r.periodDays, a: r.a,
  parent: HOSTS[r.host].id, color: shades[i % shades.length], exact: false, phase0: r.phase0,
}))
const body = `/**
 * GENERATED — do not edit. Run \`node tools/fetch-exo.mjs && node tools/emit-exo.mjs\`.
 *
 * Periods, semi-major axes and transit epochs from the NASA Exoplanet Archive, period and
 * epoch taken from the same published row. \`phase0\` is the mean longitude at J2000 implied by
 * that transit epoch, so longitude zero — the reading line — is the direction of Earth. These
 * planets sound when they transit, which is how every one of them was discovered.
 */
import type { PoolBody } from './pool'

export const EXO_BODIES: PoolBody[] = ${JSON.stringify(bodies, null, 2)}

/** Host stars, for the centre of the dial. */
export const EXO_HOSTS: Record<string, { name: string; color: string }> = {
  hd110067: { name: 'HD 110067', color: '${HOSTS['HD 110067'].color}' },
  trappist1: { name: 'TRAPPIST-1', color: '${HOSTS['TRAPPIST-1'].color}' },
}
`
writeFileSync('src/core/exo.generated.ts', body)
console.log(`${bodies.length} planets across ${Object.keys(HOSTS).length} stars`)
