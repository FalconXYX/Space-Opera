/** How many sounding voices are really the same note as another? */
import { SYSTEMS } from '../src/core/systems.ts'
import { audibility, pitchOf } from '../src/core/listen.ts'
import { nearestNoteName } from '../src/core/sonify.ts'

const CENTS = +(process.env.CENTS || 20)
for (const sys of SYSTEMS) {
  const v = sys.bodies.filter((b) => audibility(b.periodDays, sys.tau) > 0)
    .map((b) => ({ b, hz: pitchOf(b.periodDays, sys.tau) }))
    .sort((x, y) => x.hz - y.hz)
  const groups = []
  for (const x of v) {
    const g = groups.find((gr) => Math.abs(1200 * Math.log2(x.hz / gr[0].hz)) < CENTS)
    if (g) g.push(x); else groups.push([x])
  }
  const dups = groups.filter((g) => g.length > 1)
  console.log(`${sys.centre.padEnd(11)} ${String(v.length).padStart(2)} voices -> ${String(groups.length).padStart(2)} distinct pitches`)
  for (const g of dups) {
    const spread = 1200 * Math.log2(g.at(-1).hz / g[0].hz)
    console.log(`    ${nearestNoteName(g[0].hz)}: ${g.map((x) => x.b.name).join(' = ')}  (within ${spread.toFixed(1)}¢)`)
  }
}
