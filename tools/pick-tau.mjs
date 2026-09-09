/**
 * What speed should a system start at?
 *
 * Maximising how many bodies are in earshot is the wrong target: Saturn's inner swarm then
 * plays 88 notes a second, which is not a chord, it is a hiss. The ensemble rate is what a
 * listener hears, so aim at that — a few notes a second — and report what lands in band.
 */
import { SYSTEMS } from '../src/core/systems.ts'
import { audibility, rateOf } from '../src/core/listen.ts'
import { describeChord } from '../src/core/sonify.ts'
import { pitchOf } from '../src/core/listen.ts'

const TARGET = +(process.env.TARGET || 7)

const ensemble = (sys, tau) =>
  sys.bodies.reduce((s, b) => s + (audibility(b.periodDays, tau) > 0 ? rateOf(b.periodDays, tau) : 0), 0)

for (const sys of SYSTEMS) {
  const periods = sys.bodies.map((b) => b.periodDays)
  const lo = Math.log10(0.25 * Math.min(...periods))
  const hi = Math.log10(8 * Math.max(...periods))
  let best = null
  for (let i = 0; i <= 4000; i++) {
    const tau = 10 ** (lo + ((hi - lo) * i) / 4000)
    const r = ensemble(sys, tau)
    const voiced = sys.bodies.filter((b) => audibility(b.periodDays, tau) > 0)
    if (voiced.length < 3) continue
    // Prefer the target rate; break ties toward more bodies in earshot.
    const cost = Math.abs(Math.log2(r / TARGET)) - 0.06 * voiced.length
    if (!best || cost < best.cost) best = { tau, r, voiced, cost }
  }
  if (!best) { console.log(`${sys.centre}: nothing`); continue }
  const hz = best.voiced.map((b) => pitchOf(b.periodDays, best.tau))
  const ch = describeChord(hz)
  console.log(
    `${sys.centre.padEnd(9)} tau=${best.tau < 10 ? best.tau.toFixed(3) : Math.round(best.tau)}  ` +
    `${best.voiced.length}/${sys.bodies.length} voiced  ${best.r.toFixed(1)} notes/s  ` +
    `${ch ? ch.name : '—'}  [${ch ? ch.spelling.join(' ') : ''}]`,
  )
  console.log(`   ${best.voiced.map((b) => b.name).join(', ')}`)
}
