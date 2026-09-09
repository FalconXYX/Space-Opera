import { SYSTEMS } from '../src/core/systems.ts'
import { audibility, rateOf, pitchOf } from '../src/core/listen.ts'
import { describeChord, nearestNoteName, rankResonances } from '../src/core/sonify.ts'
const sysId = process.env.SYS || 'jupiter'
const sys = SYSTEMS.find((s) => s.id === sysId)
for (const tau of (process.env.TAUS || '3.2,5,6,8,10').split(',').map(Number)) {
  const v = sys.bodies.filter((b) => audibility(b.periodDays, tau) > 0)
  const rate = v.reduce((s, b) => s + rateOf(b.periodDays, tau), 0)
  const ch = describeChord(v.map((b) => pitchOf(b.periodDays, tau)))
  const locks = rankResonances(v).filter((r) => r.centsOff < 25).slice(0, 3)
  console.log(`tau=${tau}  ${v.length} voiced  ${rate.toFixed(1)} n/s  ${ch ? ch.name : '—'}`)
  console.log(`   ${v.map((b) => `${b.name} ${nearestNoteName(pitchOf(b.periodDays, tau))} ${rateOf(b.periodDays, tau).toFixed(2)}/s`).join('  |  ')}`)
  if (locks.length) console.log(`   locks: ${locks.map((r) => `${r.a.name}:${r.b.name} ${r.p}:${r.q} ${r.interval.name} ${r.centsOff.toFixed(0)}c`).join(' · ')}`)
}
