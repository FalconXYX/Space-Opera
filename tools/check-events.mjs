/** Do the voices actually produce crossings at the horizon the scheduler asks for? */
import { SYSTEMS } from '../src/core/systems.ts'
import { audibility, rateOf, READ_ANGLE } from '../src/core/listen.ts'
import { transitsBetween } from '../src/ephem/position.ts'
import { dateToDays } from '../src/ephem/frames.ts'

const HORIZON = 0.14 // seconds of look-ahead the scheduler uses
const t0 = dateToDays(new Date())

for (const sys of SYSTEMS) {
  const tau = sys.tau
  const voiced = sys.bodies.filter((b) => audibility(b.periodDays, tau) > 0)
  // Walk 20 seconds of real time in scheduler-sized windows and count events.
  let n = 0
  const SECONDS = 20
  for (let k = 0; k < SECONDS / HORIZON; k++) {
    const a = t0 + k * HORIZON * tau
    const z = a + HORIZON * tau
    for (const b of voiced) n += transitsBetween(b, READ_ANGLE, a, z).length
  }
  const expected = voiced.reduce((s, b) => s + rateOf(b.periodDays, tau) * SECONDS, 0)
  console.log(
    `${sys.centre.padEnd(9)} tau=${String(tau).padStart(5)}  ${String(voiced.length).padStart(2)}/${String(sys.bodies.length).padEnd(2)} voiced  ` +
    `${String(n).padStart(4)} events in ${SECONDS}s (expected ${expected.toFixed(0)})  ` +
    `${(n / SECONDS).toFixed(1)} notes/sec`,
  )
}
