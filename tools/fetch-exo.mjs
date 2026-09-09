/**
 * Real periods, real semi-major axes and real transit epochs for the two systems worth
 * hearing outside the solar system.
 *
 * The transit epoch is what gives these planets a real PHASE. A transit is the planet passing
 * between its star and us, so "toward Earth" is a physical reference direction shared by the
 * whole system — which means the reading line is not an invented angle here either. They
 * sound when they transit, which is how every one of them was found.
 *
 * Period and epoch are taken from the SAME published row, because mixing a period from one
 * fit with an epoch from another accumulates phase error over the thousands of orbits between
 * the observation and today.
 */
import { writeFileSync } from 'node:fs'

const HOSTS = ['HD 110067', 'TRAPPIST-1']
const q = `select pl_name,hostname,pl_orbper,pl_tranmid,pl_orbsmax from ps ` +
  `where hostname in ('HD 110067','TRAPPIST-1') and pl_orbper is not null`
const url = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync?' +
  new URLSearchParams({ query: q, format: 'csv' })
const csv = await (await fetch(url)).text()
const rows = csv.trim().split('\n').slice(1).map((l) => {
  const c = l.match(/("[^"]*"|[^,]*)/g).filter((_, i) => i % 2 === 0).map((x) => x.replace(/"/g, ''))
  return { name: c[0], host: c[1], p: +c[2], t0: c[3] ? +c[3] : null, a: c[4] ? +c[4] : null }
})

const best = new Map()
for (const r of rows) {
  if (!r.t0 || !r.p) continue
  // Prefer rows that carry a semi-major axis and quote the epoch most precisely: those are
  // the full dynamical fits rather than single-transit reports.
  const digits = String(r.t0).split('.')[1]?.length ?? 0
  const score = (r.a ? 100 : 0) + digits
  const cur = best.get(r.name)
  if (!cur || score > cur.score) best.set(r.name, { ...r, score })
}

const J2000 = 2451545.0
const out = []
for (const host of HOSTS) {
  const ps = [...best.values()].filter((r) => r.host === host).sort((a, b) => a.p - b.p)
  for (const r of ps) {
    // Longitude zero is the transit direction, so phase0 is whatever puts it there at t0.
    const phase0 = (((-360 * (r.t0 - J2000)) / r.p) % 360 + 360) % 360
    out.push({
      id: r.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      name: r.name.replace(host, '').trim(),
      host,
      periodDays: r.p,
      a: r.a,
      phase0: +phase0.toFixed(4),
      t0: r.t0,
    })
  }
}
for (const o of out) console.log(`${o.host.padEnd(11)} ${o.name}  P=${o.periodDays}  a=${o.a}  phase0=${o.phase0}  (epoch ${o.t0})`)
writeFileSync('data/exo-resonant.json', JSON.stringify(out, null, 1))
console.log(`\nwrote data/exo-resonant.json — ${out.length} planets`)
