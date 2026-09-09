/**
 * Does it have a pulse, or is it just a lot of notes?
 *
 * That is the user's complaint, and it is measurable. Take the real crossing times, bin them
 * into a fine onset train, and autocorrelate. A set of voices whose rates are simple multiples
 * of each other reinforces one lag and you can tap to it; a set of voices at arbitrary nearby
 * rates never reinforces anything and arrives as a drizzle.
 *
 * The reference points, from measuring Jupiter both ways: the four Galileans give r = 0.71 at a
 * 0.46 s lag — Europa's note period, with Io subdividing it 2:1 — while the 33-body irregular
 * swarm gives r = 0.19 and a coefficient of variation of 0.95, which is memoryless randomness.
 * Same physics, same rule, same app; one is music and one is rain.
 *
 *   node tools/run.mjs tools/check-pulse.mjs                  # every system at its default
 *   SYS=jupiter SWEEP=1 node tools/run.mjs tools/check-pulse.mjs   # find the best speed
 */
import { SYSTEMS } from '../src/core/systems.ts'
import { audibility, READ_ANGLE } from '../src/core/listen.ts'
import { transitsBetween } from '../src/ephem/position.ts'
import { dateToDays } from '../src/ephem/frames.ts'

const SECONDS = 120
const BIN = 0.01

function onsets(sys, tau) {
  const t0 = dateToDays(new Date())
  const v = sys.bodies.filter((b) => audibility(b.periodDays, tau) > 0)
  const out = []
  for (const b of v) {
    for (const d of transitsBetween(b, READ_ANGLE, t0, t0 + SECONDS * tau)) out.push((d - t0) / tau)
  }
  out.sort((a, b) => a - b)
  return { v, out }
}

/** Peak autocorrelation of the onset train over musical lags, and where it peaks. */
function pulse(times) {
  if (times.length < 8) return { r: 0, lag: 0, cv: 0, flams: 0 }
  const n = Math.ceil(SECONDS / BIN)
  const x = new Float64Array(n)
  for (const t of times) { const i = Math.floor(t / BIN); if (i >= 0 && i < n) x[i] += 1 }
  let mean = 0
  for (let i = 0; i < n; i++) mean += x[i]
  mean /= n
  let denom = 0
  for (let i = 0; i < n; i++) denom += (x[i] - mean) ** 2
  let best = { r: 0, lag: 0 }
  for (let lagS = 0.12; lagS <= 4; lagS += BIN) {
    const k = Math.round(lagS / BIN)
    let num = 0
    for (let i = 0; i + k < n; i++) num += (x[i] - mean) * (x[i + k] - mean)
    const r = denom > 0 ? num / denom : 0
    if (r > best.r) best = { r, lag: lagS }
  }
  // How regular are the gaps, and how many notes fuse into the one before them?
  const gaps = []
  for (let i = 1; i < times.length; i++) gaps.push(times[i] - times[i - 1])
  const gm = gaps.reduce((a, b) => a + b, 0) / gaps.length
  const sd = Math.sqrt(gaps.reduce((a, b) => a + (b - gm) ** 2, 0) / gaps.length)
  const flams = gaps.filter((g) => g < 0.03).length / gaps.length
  return { ...best, cv: sd / gm, flams }
}

const verdict = (r) => (r >= 0.5 ? 'a pulse you could tap to' : r >= 0.3 ? 'a loose pulse' : 'a drizzle — no meter')

if (process.env.SWEEP) {
  const sys = SYSTEMS.find((s) => s.id === (process.env.SYS || 'jupiter'))
  const periods = sys.bodies.map((b) => b.periodDays)
  const lo = Math.log10(0.25 * Math.min(...periods))
  const hi = Math.log10(8 * Math.max(...periods))
  const rows = []
  for (let i = 0; i <= 60; i++) {
    const tau = 10 ** (lo + ((hi - lo) * i) / 60)
    const { v, out } = onsets(sys, tau)
    if (v.length < 3 || out.length < 8) continue
    const p = pulse(out)
    const rate = out.length / SECONDS
    if (rate < 2 || rate > 16) continue
    rows.push({ tau, n: v.length, rate, ...p })
  }
  rows.sort((a, b) => b.r - a.r)
  console.log(`${sys.centre}: best pulse over the whole speed range (shipping ${sys.tau})\n`)
  console.log('  tau        voices  notes/s   r     lag     CV    flams   verdict')
  for (const x of rows.slice(0, 12)) {
    console.log(
      `  ${(x.tau < 10 ? x.tau.toFixed(3) : Math.round(x.tau)).toString().padStart(8)}  ${String(x.n).padStart(4)}   ` +
      `${x.rate.toFixed(1).padStart(6)}  ${x.r.toFixed(2)}  ${x.lag.toFixed(2)}s  ${x.cv.toFixed(2)}  ` +
      `${(x.flams * 100).toFixed(0).padStart(3)}%   ${verdict(x.r)}`,
    )
  }
} else {
  console.log('system       voices  notes/s    r     lag     CV   flams   verdict')
  for (const sys of SYSTEMS) {
    const { v, out } = onsets(sys, sys.tau)
    const p = pulse(out)
    console.log(
      `${sys.centre.padEnd(11)} ${String(v.length).padStart(4)}   ${(out.length / SECONDS).toFixed(1).padStart(6)}  ` +
      `${p.r.toFixed(2)}  ${p.lag.toFixed(2)}s  ${p.cv.toFixed(2)}  ${(p.flams * 100).toFixed(0).padStart(3)}%   ${verdict(p.r)}`,
    )
  }
}
