/**
 * Layout for a set of bodies drawn from anywhere in the solar system.
 *
 * A match may need Uranus's Mab alongside Saturn's Atlas and Dione. Those do not share a
 * centre and must not be drawn as if they did, so the view splits into one panel per parent
 * — each planet with its own moons around it, and the Sun with its planets. Radii inside a
 * panel are logarithmic in the true semi-major axis.
 */
import type { PoolBody } from '../core/pool'

export interface Orbit {
  bodyId: string
  /** Radius within its panel, px. */
  r: number
}

export interface Panel {
  /** 'sun', or the parent planet's id. */
  parentId: string
  /** Panel centre, in fractions of the canvas. */
  fx: number
  fy: number
  /** Largest orbit radius allowed in this panel, px at scale 1. */
  extent: number
  orbits: Orbit[]
}

export interface Layout {
  panels: Panel[]
  /** How many panels across, for sizing. */
  cols: number
  rows: number
}

export function computeLayout(bodies: PoolBody[]): Layout {
  const byParent = new Map<string, PoolBody[]>()
  for (const b of bodies) {
    const key = b.parent ?? 'sun'
    const list = byParent.get(key) ?? []
    list.push(b)
    byParent.set(key, list)
  }

  // The Sun first, then parents by distance, so the arrangement is stable and readable.
  const order = [...byParent.keys()].sort((a, b) => (a === 'sun' ? -1 : b === 'sun' ? 1 : a.localeCompare(b)))
  const n = order.length
  const cols = n <= 1 ? 1 : n <= 4 ? 2 : 3
  const rows = Math.ceil(n / cols)

  // One panel gets the whole frame; several share it, so each shrinks to fit its cell.
  const extent = n === 1 ? 400 : Math.min(400 / cols, 380 / rows) * 1.55

  const panels: Panel[] = order.map((parentId, i) => {
    const group = [...(byParent.get(parentId) ?? [])].sort((a, b) => a.a - b.a)
    const col = i % cols
    const row = Math.floor(i / cols)
    const inner = n === 1 ? 108 : extent * 0.3
    const k = group.length

    const orbits: Orbit[] = group.map((b, j) => {
      if (k === 1) return { bodyId: b.id, r: (inner + extent) / 2 }
      const logs = group.map((x) => Math.log10(Math.max(1e-9, x.a)))
      const lo = logs[0], hi = logs[k - 1]
      const tLog = hi === lo ? j / (k - 1) : (logs[j] - lo) / (hi - lo)
      const tEven = j / (k - 1)
      // Blend toward even spacing so close-in moons stay distinguishable.
      const t = 0.55 * tLog + 0.45 * tEven
      return { bodyId: b.id, r: inner + (extent - inner) * t }
    })

    return {
      parentId,
      fx: (col + 0.5) / cols,
      fy: (row + 0.5) / rows,
      extent,
      orbits,
    }
  })

  return { panels, cols, rows }
}
