/**
 * The view: the whole system, always.
 *
 * Every moon a planet has is on the dial, including the ones too fast or too slow to be heard
 * at the current speed. Those are drawn dim and still turning, because leaving them out would
 * be picking the sky that suits the tune.
 *
 * The reading line is the mechanism made visible — a body sounds its note at the instant it
 * crosses that direction, so what you hear is exactly what you watch happen.
 */
import type { Layout } from './layout'
import type { PoolBody } from '../core/pool'
import type { Flash } from '../audio/scheduler'
import { bodyRadius, crowdScale, drawBody, hasLook } from './bodies'
import { nearestNoteName } from '../core/sonify'

export interface Scene {
  layout: Layout
  bodies: PoolBody[]
  /** Parent bodies, for drawing the centre of each panel. */
  parents: Map<string, PoolBody | null>
  longitudes: Map<string, number>
  pitches: Map<string, number>
  flashes: Flash[]
  audioNow: number
  readAngle: number
  /** How much of each body is heard, 0 to 1. Dim means out of earshot, not absent. */
  heard: Map<string, number>
  /** What is at the centre, for systems whose centre is not a body we have a portrait of. */
  centreLabel: string
  centreColor: string
}

const GROUND = '#171E30'

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let starCache: { w: number; h: number; s: Array<[number, number, number, number]> } | null = null
function stars(w: number, h: number) {
  if (starCache && starCache.w === w && starCache.h === h) return starCache.s
  const rnd = mulberry32(0x5A17)
  const s: Array<[number, number, number, number]> = []
  for (let i = 0; i < 520; i++) s.push([rnd() * w, rnd() * h, 0.4 + rnd() * 1.1, 0.1 + rnd() * 0.5])
  starCache = { w, h, s }
  return s
}

export function render(ctx: CanvasRenderingContext2D, w: number, h: number, scene: Scene): void {
  const byId = new Map(scene.bodies.map((b) => [b.id, b]))
  const nPanels = scene.layout.panels.length
  const scale = Math.min(w / 1000, h / 900) * (nPanels === 1 ? 1.05 : 1)

  ctx.fillStyle = GROUND
  ctx.fillRect(0, 0, w, h)
  const vig = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.62)
  vig.addColorStop(0, '#212A42')
  vig.addColorStop(1, '#111726')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, w, h)
  for (const [x, y, r, a] of stars(w, h)) {
    ctx.globalAlpha = a
    ctx.fillStyle = '#dde5f6'
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  }
  ctx.globalAlpha = 1

  // Blend into the page rather than butting a flat sky against a flat panel.
  const edge = (x0: number, y0: number, x1: number, y1: number, len: number) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1)
    g.addColorStop(0, 'rgba(206,201,189,0.30)')
    g.addColorStop(0.35, 'rgba(180,178,175,0.13)')
    g.addColorStop(1, 'rgba(160,164,175,0)')
    ctx.fillStyle = g
    ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0) || len, Math.abs(y1 - y0) || len)
  }
  edge(0, 0, 190, 0, h)
  edge(w, 0, w - 120, 0, h)
  edge(0, h, 0, h - 130, w)
  edge(0, 0, 0, 90, w)

  const heatOf = (id: string, life = 1.15): number => {
    let heat = 0
    for (const f of scene.flashes) {
      if (f.bodyId !== id && f.otherId !== id) continue
      const age = scene.audioNow - f.at
      if (age >= 0 && age < life) heat = Math.max(heat, 1 - age / life)
    }
    return heat
  }

  const total = scene.bodies.length
  const bodyScale = crowdScale(total) * (nPanels === 1 ? 1.4 : 1.0)
  const labelAll = total <= 10

  for (const panel of scene.layout.panels) {
    const cx = panel.fx * w
    const cy = panel.fy * h
    const R = (r: number) => r * scale
    const parent = scene.parents.get(panel.parentId) ?? null

    // Orbits.
    for (const o of panel.orbits) {
      const lit = scene.heard.get(o.bodyId) ?? 0
      ctx.strokeStyle = `rgba(176,194,230,${0.055 + 0.16 * lit})`
      ctx.lineWidth = lit > 0 ? 1.1 : 1
      ctx.beginPath(); ctx.arc(cx, cy, R(o.r), 0, Math.PI * 2); ctx.stroke()
    }

    // The reading line: one direction, the same for everything, and the reason each body
    // sounds when it does. It is ecliptic longitude zero, not a tuned angle.
    {
      const a = (-scene.readAngle * Math.PI) / 180
      const rOut = R(panel.extent) + 10
      const grad = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * rOut, cy + Math.sin(a) * rOut)
      grad.addColorStop(0, 'rgba(255,214,150,0.06)')
      grad.addColorStop(0.35, 'rgba(255,214,150,0.34)')
      grad.addColorStop(1, 'rgba(255,214,150,0.34)')
      ctx.strokeStyle = grad
      ctx.lineWidth = 1.3
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(a) * rOut, cy + Math.sin(a) * rOut)
      ctx.stroke()
    }

    // The centre: the Sun, or the parent planet.
    if (panel.parentId === 'sun') {
      const r = nPanels === 1 ? 30 : 18
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      g.addColorStop(0, 'rgba(255,252,240,1)')
      g.addColorStop(0.25, 'rgba(255,226,150,0.8)')
      g.addColorStop(1, 'rgba(255,180,80,0)')
      ctx.fillStyle = g
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#FFFBEF'
      ctx.beginPath(); ctx.arc(cx, cy, r / 4.5, 0, Math.PI * 2); ctx.fill()
    } else if (parent && hasLook(parent.id)) {
      drawBody(ctx, cx, cy, parent.id, -2.2, 0, nPanels === 1 ? 3.0 : 1.9)
    } else {
      // A star we have no portrait of. Draw it as one rather than leaving a hole.
      const r = nPanels === 1 ? 22 : 14
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.6)
      g.addColorStop(0, scene.centreColor)
      g.addColorStop(0.34, scene.centreColor)
      g.addColorStop(1, 'rgba(255,214,150,0)')
      ctx.fillStyle = g
      ctx.beginPath(); ctx.arc(cx, cy, r * 2.6, 0, Math.PI * 2); ctx.fill()
    }

    // Name the panel, so it is never ambiguous whose moons these are.
    {
      ctx.save()
      ctx.textAlign = 'center'
      ctx.font = '600 10px "Space Grotesk Variable", system-ui, sans-serif'
      ctx.fillStyle = 'rgba(150,168,204,0.62)'
      ctx.letterSpacing = '0.14em'
      ctx.fillText(scene.centreLabel.toUpperCase(), cx, cy + R(panel.extent) + 26)
      ctx.restore()
    }

    // Bodies.
    for (const o of panel.orbits) {
      const body = byId.get(o.bodyId)
      if (!body) continue
      const lon = scene.longitudes.get(o.bodyId) ?? 0
      const ang = (-lon * Math.PI) / 180
      const rr = R(o.r)
      const x = cx + Math.cos(ang) * rr
      const y = cy + Math.sin(ang) * rr
      const heat = heatOf(o.bodyId)
      const lit = scene.heard.get(o.bodyId) ?? 0

      ctx.save()
      // Out of earshot is not out of the sky: it still turns, it is just faint.
      ctx.globalAlpha = 0.26 + 0.74 * lit

      const sweep = 0.32
      const g = ctx.createLinearGradient(x, y, cx + Math.cos(ang + sweep) * rr, cy + Math.sin(ang + sweep) * rr)
      g.addColorStop(0, 'rgba(196,212,242,0.5)')
      g.addColorStop(1, 'rgba(196,212,242,0)')
      ctx.strokeStyle = g
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.arc(cx, cy, rr, ang, ang + sweep); ctx.stroke()

      let rad: number
      if (hasLook(o.bodyId)) {
        drawBody(ctx, x, y, o.bodyId, -2.2, heat, bodyScale)
        rad = bodyRadius(o.bodyId) * bodyScale
      } else {
        rad = Math.max(3, 7 * crowdScale(total) * (nPanels === 1 ? 1.3 : 1))
        if (heat > 0.01) {
          const glow = ctx.createRadialGradient(x, y, 0, x, y, rad + 18 * heat)
          glow.addColorStop(0, `rgba(255,246,228,${heat * 0.55})`)
          glow.addColorStop(1, 'rgba(255,217,160,0)')
          ctx.fillStyle = glow
          ctx.beginPath(); ctx.arc(x, y, rad + 18 * heat, 0, Math.PI * 2); ctx.fill()
        }
        ctx.fillStyle = heat > 0.02 ? '#FFF0D8' : body.color
        ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill()
      }

      // Anything in earshot is named, however many bodies there are — those four are the
      // ones you are listening to. The rest stay anonymous unless they are few enough to
      // label outright, or are sounding a note this instant.
      if (lit === 0 && !labelAll && heat < 0.06) { ctx.restore(); continue }
      if (lit === 0) ctx.globalAlpha *= Math.min(1, heat * 2.4)
      else ctx.globalAlpha = Math.max(0.6, Math.min(1, 0.6 + heat))
      ctx.textAlign = 'center'
      ctx.font = '500 12px "Space Grotesk Variable", system-ui, sans-serif'
      ctx.fillStyle = heat > 0.02 ? 'rgba(255,246,228,0.98)' : 'rgba(198,212,238,0.85)'
      ctx.fillText(body.name, x, y + rad + 15)
      const hz = scene.pitches.get(o.bodyId)
      if (hz) {
        ctx.font = '400 10.5px "IBM Plex Mono", ui-monospace, monospace'
        ctx.fillStyle = heat > 0.02 ? 'rgba(255,224,178,0.95)' : 'rgba(126,142,174,0.8)'
        ctx.fillText(nearestNoteName(hz), x, y + rad + 28)
      }
      ctx.restore()
    }
  }
}
