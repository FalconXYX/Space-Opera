/**
 * How many notes are sounding at once?
 *
 * The old renderer stretched a low note's decay by pitch, so at 38-92 Hz a Saturn voice rang
 * for 6-10 seconds against a 1.4-3.3 s gap and overlapped ITSELF twice over: 30 notes sounding
 * at once out of 6.9 a second. fitToGap now sizes the ring against the gap to the body's own
 * return, so a voice should never collide with itself. This checks that it doesn't.
 */
import { SYSTEMS } from '../src/core/systems.ts'
import { audibility, pitchOf, rateOf, READ_ANGLE } from '../src/core/listen.ts'
import { voiceFor } from '../src/audio/instruments.ts'
import { transitsBetween } from '../src/ephem/position.ts'
import { dateToDays } from '../src/ephem/frames.ts'

const SECONDS = 30
const t0 = dateToDays(new Date())

console.log('system        notes/s   mean polyphony   max   longest ring   self-overlap')
for (const sys of SYSTEMS) {
  const tau = sys.tau
  const voiced = sys.bodies.filter((b) => audibility(b.periodDays, tau) > 0)
  const low = [...voiced].sort((a, b) => pitchOf(a.periodDays, tau) - pitchOf(b.periodDays, tau))
  const spans = []
  let worstSelf = 0, longest = 0
  low.forEach((b, i) => {
    const rate = rateOf(b.periodDays, tau)
    const v = voiceFor(low.length > 1 ? i / (low.length - 1) : 0.5, rate)
    const A = v.amp
    const ring = A.attack + (A.hold ?? 0) + A.decay + (A.release ?? 0.05)
    longest = Math.max(longest, ring)
    worstSelf = Math.max(worstSelf, ring * rate)   // >1 means it collides with itself
    for (const d of transitsBetween(b, READ_ANGLE, t0, t0 + SECONDS * tau)) {
      const s = (d - t0) / tau
      spans.push([s, s + ring])
    }
  })
  // Sample the count of live notes on a fine grid.
  let sum = 0, max = 0
  const STEP = 0.01
  const ends = spans.map((s) => s[1])
  const starts = spans.map((s) => s[0])
  for (let t = 0; t < SECONDS; t += STEP) {
    let n = 0
    for (let i = 0; i < starts.length; i++) if (starts[i] <= t && ends[i] > t) n++
    sum += n; if (n > max) max = n
  }
  const mean = sum / (SECONDS / STEP)
  const flag = worstSelf > 1 ? '  <-- OVERLAPS ITSELF' : ''
  console.log(
    `${sys.centre.padEnd(12)} ${(spans.length / SECONDS).toFixed(1).padStart(6)}   ` +
    `${mean.toFixed(1).padStart(8)}      ${String(max).padStart(3)}   ${longest.toFixed(2).padStart(8)}s   ` +
    `${worstSelf.toFixed(2)}x${flag}`,
  )
}
