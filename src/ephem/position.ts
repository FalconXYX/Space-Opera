/**
 * Where a body is, and when it gets there.
 *
 * Real ephemeris where a browser-side theory exists — the planets, the Galilean moons and
 * the Moon. Everything else uses circular mean motion from its measured period, which is
 * exactly right for what is heard (the sound is made of periods) and approximate for what
 * is drawn. Which is which is stated in the app.
 */
import { exactLongitude } from './frames'
import { wrap360 } from '../core/units'

export interface Moving {
  id: string
  periodDays: number
  phase0: number
  exact: boolean
}

export function longitudeOf(body: Moving, days: number): number {
  if (body.exact) {
    try { return exactLongitude(body.id, days) } catch { /* fall through */ }
  }
  return wrap360(body.phase0 + (360 * days) / body.periodDays)
}

const signedTo = (body: Moving, days: number, target: number): number => {
  let d = longitudeOf(body, days) - target
  d %= 360
  if (d > 180) d -= 360
  if (d <= -180) d += 360
  return d
}

/**
 * Times in (a, b) at which the body passes `angle`.
 *
 * Longitude increases monotonically, so stepping in fractions of a period and bisecting on
 * the sign change cannot land on the wrong crossing.
 */
export function transitsBetween(body: Moving, angle: number, a: number, b: number): number[] {
  const out: number[] = []
  if (b <= a) return out
  const step = body.periodDays / 12
  // A very fast body against a wide window would otherwise spin here forever.
  if ((b - a) / step > 20000) return out
  let prev = signedTo(body, a, angle)
  for (let t = a + step; t < b + step; t += step) {
    const tc = Math.min(t, b)
    const cur = signedTo(body, tc, angle)
    if (prev < 0 && cur >= 0) {
      let lo = tc - step, hi = tc
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2
        if (signedTo(body, mid, angle) < 0) lo = mid; else hi = mid
      }
      const t0 = (lo + hi) / 2
      if (t0 > a && t0 < b) out.push(t0)
    }
    prev = cur
    if (tc >= b) break
  }
  return out
}
