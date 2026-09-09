/**
 * Drawing the bodies as themselves.
 *
 * Identical grey dots make an orrery unreadable: the whole point is knowing that THAT is
 * Mars and THAT is Europa. Every body gets its real colouring and its recognisable
 * features — Jupiter's bands and red spot, Saturn's rings, Europa's cracked ice, Mars's
 * polar cap — plus terminator shading from the actual direction of the Sun.
 *
 * Surface detail is generated from a fixed seed per body so it never shimmers between
 * frames.
 */

function rng(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x9E3779B9) | 0
    let t = Math.imul(a ^ (a >>> 16), 0x21F0AAAD)
    t = Math.imul(t ^ (t >>> 15), 0x735A2D97)
    return ((t ^ (t >>> 15)) >>> 0) / 4294967296
  }
}

interface Look {
  /** Sunlit base colour. */
  base: string
  /** Colour at the limb / shadowed side. */
  dark: string
  /** Relative drawn size. Real ratios span 30x and would make Mercury invisible. */
  size: number
  features: (ctx: CanvasRenderingContext2D, r: number, rnd: () => number) => void
}

/** Circular clip so surface features never spill past the disc. */
function clipDisc(ctx: CanvasRenderingContext2D, r: number, draw: () => void) {
  ctx.save()
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip()
  draw()
  ctx.restore()
}

function craters(ctx: CanvasRenderingContext2D, r: number, rnd: () => number, n: number, light: string, dark: string) {
  clipDisc(ctx, r, () => {
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2
      const d = Math.sqrt(rnd()) * r * 0.92
      const cr = r * (0.06 + rnd() * 0.17)
      const x = Math.cos(a) * d, y = Math.sin(a) * d
      ctx.fillStyle = dark
      ctx.beginPath(); ctx.arc(x, y, cr, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = light
      ctx.beginPath(); ctx.arc(x - cr * 0.22, y - cr * 0.22, cr * 0.72, 0, Math.PI * 2); ctx.fill()
    }
  })
}

function bands(ctx: CanvasRenderingContext2D, r: number, rnd: () => number, colors: string[]) {
  clipDisc(ctx, r, () => {
    let y = -r
    while (y < r) {
      const h = r * (0.1 + rnd() * 0.22)
      ctx.fillStyle = colors[Math.floor(rnd() * colors.length)]
      ctx.globalAlpha = 0.5 + rnd() * 0.4
      ctx.fillRect(-r, y, r * 2, h)
      y += h
    }
    ctx.globalAlpha = 1
  })
}

function blotches(ctx: CanvasRenderingContext2D, r: number, rnd: () => number, n: number, colors: string[]) {
  clipDisc(ctx, r, () => {
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2
      const d = Math.sqrt(rnd()) * r * 0.85
      ctx.fillStyle = colors[Math.floor(rnd() * colors.length)]
      ctx.globalAlpha = 0.45 + rnd() * 0.45
      ctx.beginPath()
      ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * (0.14 + rnd() * 0.3), r * (0.1 + rnd() * 0.22), rnd() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  })
}

function polarCap(ctx: CanvasRenderingContext2D, r: number, color: string) {
  clipDisc(ctx, r, () => {
    ctx.fillStyle = color
    ctx.beginPath(); ctx.ellipse(0, -r * 0.86, r * 0.55, r * 0.3, 0, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(0, r * 0.9, r * 0.42, r * 0.22, 0, 0, Math.PI * 2); ctx.fill()
  })
}

export const LOOKS: Record<string, Look> = {
  mercury: {
    base: '#9a9086', dark: '#3a352f', size: 0.62,
    features: (c, r, q) => craters(c, r, q, 14, 'rgba(190,180,168,0.5)', 'rgba(70,64,58,0.55)'),
  },
  venus: {
    base: '#e8cf94', dark: '#6a5730', size: 0.92,
    features: (c, r, q) => bands(c, r, q, ['rgba(255,240,200,0.35)', 'rgba(214,178,110,0.35)', 'rgba(245,224,170,0.3)']),
  },
  earth: {
    base: '#4a86c8', dark: '#12304f', size: 0.96,
    features: (c, r, q) => {
      blotches(c, r, q, 7, ['#4b8f5a', '#3f7a4c', '#5aa06a'])
      clipDisc(c, r, () => {
        c.globalAlpha = 0.28
        c.fillStyle = '#ffffff'
        for (let i = 0; i < 5; i++) {
          const a = q() * Math.PI * 2, d = Math.sqrt(q()) * r * 0.8
          c.beginPath(); c.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * 0.34, r * 0.13, q() * Math.PI, 0, Math.PI * 2); c.fill()
        }
        c.globalAlpha = 1
      })
      polarCap(c, r, 'rgba(255,255,255,0.75)')
    },
  },
  mars: {
    base: '#c1502e', dark: '#4a1c10', size: 0.72,
    features: (c, r, q) => {
      blotches(c, r, q, 6, ['#8e3a22', '#a8492c', '#6f2d1a'])
      polarCap(c, r, 'rgba(255,250,245,0.82)')
    },
  },
  jupiter: {
    base: '#d8b48a', dark: '#5a4128', size: 1.85,
    features: (c, r, q) => {
      bands(c, r, q, ['rgba(216,180,138,0.7)', 'rgba(168,124,84,0.65)', 'rgba(240,220,190,0.55)', 'rgba(140,100,70,0.5)'])
      clipDisc(c, r, () => {
        c.fillStyle = 'rgba(196,84,54,0.85)'
        c.beginPath(); c.ellipse(r * 0.3, r * 0.26, r * 0.28, r * 0.15, 0, 0, Math.PI * 2); c.fill()
      })
    },
  },
  saturn: {
    base: '#e3cd9a', dark: '#6e5f3c', size: 1.6,
    features: (c, r, q) => bands(c, r, q, ['rgba(232,214,168,0.6)', 'rgba(198,172,120,0.55)', 'rgba(245,232,200,0.45)']),
  },
  uranus: {
    base: '#9fdce4', dark: '#2c5f68', size: 1.25,
    features: (c, r, q) => bands(c, r, q, ['rgba(180,230,238,0.3)', 'rgba(140,206,216,0.3)']),
  },
  neptune: {
    base: '#5a7fe0', dark: '#1b2a63', size: 1.22,
    features: (c, r, q) => {
      bands(c, r, q, ['rgba(110,150,235,0.35)', 'rgba(60,95,190,0.35)'])
      clipDisc(c, r, () => {
        c.fillStyle = 'rgba(24,40,96,0.7)'
        c.beginPath(); c.ellipse(-r * 0.22, r * 0.2, r * 0.24, r * 0.13, 0, 0, Math.PI * 2); c.fill()
      })
    },
  },
  pluto: {
    base: '#c2ab94', dark: '#4b3f34', size: 0.5,
    features: (c, r, q) => blotches(c, r, q, 5, ['#8d7965', '#d8c6ac', '#6f5e4d']),
  },
  io: {
    base: '#f2d64e', dark: '#6d5a10', size: 0.58,
    features: (c, r, q) => blotches(c, r, q, 9, ['#e88c2a', '#fff0a0', '#b8541a', '#d9b02c']),
  },
  europa: {
    base: '#efe6d2', dark: '#6f6858', size: 0.52,
    features: (c, r, q) => {
      clipDisc(c, r, () => {
        c.strokeStyle = 'rgba(178,138,96,0.6)'
        c.lineWidth = Math.max(0.6, r * 0.055)
        for (let i = 0; i < 9; i++) {
          const a = q() * Math.PI * 2
          const off = (q() - 0.5) * r * 1.4
          c.beginPath()
          c.moveTo(Math.cos(a) * -r * 1.4 + Math.cos(a + Math.PI / 2) * off, Math.sin(a) * -r * 1.4 + Math.sin(a + Math.PI / 2) * off)
          c.lineTo(Math.cos(a) * r * 1.4 + Math.cos(a + Math.PI / 2) * off, Math.sin(a) * r * 1.4 + Math.sin(a + Math.PI / 2) * off)
          c.stroke()
        }
      })
    },
  },
  ganymede: {
    base: '#a89a86', dark: '#463f36', size: 0.66,
    features: (c, r, q) => {
      blotches(c, r, q, 6, ['#8b7f6e', '#c4b8a4', '#6d6357'])
      craters(c, r, q, 7, 'rgba(210,200,184,0.4)', 'rgba(72,66,58,0.4)')
    },
  },
  callisto: {
    base: '#7d7266', dark: '#332e28', size: 0.62,
    features: (c, r, q) => craters(c, r, q, 20, 'rgba(178,168,152,0.45)', 'rgba(48,43,38,0.55)'),
  },
  luna: {
    base: '#cfcbc4', dark: '#4a4844', size: 0.46,
    features: (c, r, q) => {
      blotches(c, r, q, 5, ['rgba(126,126,132,0.55)', 'rgba(146,146,150,0.5)'])
      craters(c, r, q, 10, 'rgba(232,230,226,0.45)', 'rgba(96,94,90,0.45)')
    },
  },
}

// Saturn's mid-sized moons: bright water ice, heavily cratered.
for (const [id, base, dark, size] of [
  ['mimas', '#cfc9bd', '#4d4a44', 0.44],
  ['enceladus', '#f4f6f7', '#5d6469', 0.46],
  ['tethys', '#dcd6c8', '#585449', 0.52],
  ['dione', '#c8c2b4', '#4f4b43', 0.5],
  ['rhea', '#b6ada0', '#463f38', 0.52],
] as const) {
  LOOKS[id] = { base, dark, size, features: (c, r, q) => craters(c, r, q, 16, 'rgba(240,240,236,0.5)', 'rgba(60,58,54,0.5)') }
}
// Titan's atmosphere hides its surface entirely — smooth orange haze, no features.
LOOKS.titan = {
  base: '#e0a45c', dark: '#5c4020', size: 0.78,
  features: (c, r) => {
    const g = c.createRadialGradient(0, 0, r * 0.7, 0, 0, r * 1.05)
    g.addColorStop(0, 'rgba(255,214,150,0)')
    g.addColorStop(1, 'rgba(255,196,110,0.5)')
    c.fillStyle = g
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill()
  },
}
// TRAPPIST-1: rocky worlds, the outer ones plausibly icy. Nobody has seen a surface, so
// these are honest placeholders rather than invented detail.
for (const [id, base, dark, size] of [
  ['t1b', '#d9713f', '#4e2413', 0.62],
  ['t1c', '#e0894f', '#553018', 0.64],
  ['t1d', '#cfa06a', '#4f3a22', 0.56],
  ['t1e', '#8fb0c4', '#2f4351', 0.6],
  ['t1f', '#7fa2bf', '#2b3d4d', 0.62],
  ['t1g', '#9ab4c9', '#374b58', 0.64],
  ['t1h', '#b8c6d2', '#414c55', 0.54],
] as const) {
  LOOKS[id] = { base, dark, size, features: (c, r, q) => blotches(c, r, q, 5, ['rgba(255,255,255,0.12)', 'rgba(0,0,0,0.18)']) }
}

const DEFAULT_LOOK: Look = { base: '#9FB2D4', dark: '#38445c', size: 0.7, features: () => {} }

/** Base drawn radius in px before the per-body size multiplier. */
export const BODY_SCALE = 8.5

/** Shrink bodies as a system gets crowded, so thirty rings still read as rings. */
export const crowdScale = (count: number): number => Math.max(0.5, Math.min(1, 8 / count))

export function bodyRadius(bodyId: string): number {
  return BODY_SCALE * (LOOKS[bodyId] ?? DEFAULT_LOOK).size
}

export const hasLook = (bodyId: string): boolean => bodyId in LOOKS

/**
 * Draw one body, lit from `sunAngle` (the direction the Sun lies in, radians).
 * `heat` in 0..1 adds the warm flash when the body has just sounded a note.
 */
export function drawBody(
  ctx: CanvasRenderingContext2D, x: number, y: number, bodyId: string,
  sunAngle: number, heat: number, sizeScale = 1,
): void {
  const look = LOOKS[bodyId] ?? DEFAULT_LOOK
  const r = bodyRadius(bodyId) * sizeScale

  ctx.save()
  ctx.translate(x, y)

  // Saturn's rings, drawn behind the planet then again in front so it sits inside them.
  const hasRings = bodyId === 'saturn'
  const drawRings = (front: boolean) => {
    ctx.save()
    ctx.rotate(-0.42)
    ctx.scale(1, 0.28)
    for (const [rad, w, col] of [[r * 2.25, r * 0.5, 'rgba(226,208,164,0.75)'], [r * 1.72, r * 0.34, 'rgba(196,176,132,0.6)']] as const) {
      ctx.beginPath()
      ctx.arc(0, 0, rad, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2)
      ctx.strokeStyle = col
      ctx.lineWidth = w
      ctx.stroke()
    }
    ctx.restore()
  }
  if (hasRings) drawRings(false)

  // Lit hemisphere: the highlight sits on the side facing the Sun.
  const lx = Math.cos(sunAngle) * r * 0.45
  const ly = Math.sin(sunAngle) * r * 0.45
  const g = ctx.createRadialGradient(lx, ly, r * 0.05, 0, 0, r * 1.12)
  g.addColorStop(0, look.base)
  g.addColorStop(0.55, look.base)
  g.addColorStop(1, look.dark)
  ctx.fillStyle = g
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill()

  look.features(ctx, r, rng(hash(bodyId)))

  // Re-apply the terminator over the surface detail so shading reads as a sphere.
  const shade = ctx.createRadialGradient(lx, ly, r * 0.1, 0, 0, r * 1.15)
  shade.addColorStop(0, 'rgba(0,0,0,0)')
  shade.addColorStop(0.6, 'rgba(0,0,0,0.08)')
  shade.addColorStop(1, 'rgba(0,0,0,0.62)')
  ctx.fillStyle = shade
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill()

  if (hasRings) drawRings(true)

  if (heat > 0.01) {
    const glow = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r + 22 * heat)
    glow.addColorStop(0, `rgba(255,246,228,${heat * 0.5})`)
    glow.addColorStop(1, 'rgba(255,217,160,0)')
    ctx.fillStyle = glow
    ctx.beginPath(); ctx.arc(0, 0, r + 22 * heat, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = `rgba(255,236,200,${heat * 0.85})`
    ctx.lineWidth = 1.4
    ctx.beginPath(); ctx.arc(0, 0, r + 1.5, 0, Math.PI * 2); ctx.stroke()
  }

  ctx.restore()
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
