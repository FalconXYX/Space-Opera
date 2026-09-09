/** Why it sounds like mush: how crowded are the pitches, and how few distinct timbres? */
import { SYSTEMS } from '../src/core/systems.ts'
import { audibility, pitchOf, rateOf } from '../src/core/listen.ts'
import { voiceFor } from '../src/audio/instruments.ts'

for (const sys of SYSTEMS) {
  const tau = sys.tau
  const v = sys.bodies.filter((b) => audibility(b.periodDays, tau) > 0)
  const semis = v.map((b) => 12 * Math.log2(pitchOf(b.periodDays, tau) / 55)).sort((a, b) => a - b)
  const span = semis.at(-1) - semis[0]
  // How many pairs sit within a semitone of each other? Those beat rather than harmonise.
  let crowded = 0, pairs = 0
  for (let i = 0; i < semis.length; i++) for (let j = i + 1; j < semis.length; j++) {
    pairs++
    if (Math.abs(semis[i] - semis[j]) < 1) crowded++
  }
  const low = [...v].sort((a, b) => pitchOf(a.periodDays, tau) - pitchOf(b.periodDays, tau))
  const insts = new Set(low.map((b, i) =>
    voiceFor(low.length > 1 ? i / (low.length - 1) : 0.5, rateOf(b.periodDays, tau)).id))
  console.log(
    `${sys.centre.padEnd(11)} ${String(v.length).padStart(2)} voices  span ${(span / 12).toFixed(1)} octaves  ` +
    `${((crowded / Math.max(pairs, 1)) * 100).toFixed(0)}% of pairs inside a semitone  ` +
    `${insts.size} distinct instrument${insts.size === 1 ? '' : 's'} [${[...insts].join(', ')}]`,
  )
}
