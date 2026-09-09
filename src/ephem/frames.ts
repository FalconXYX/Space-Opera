/**
 * Exact ephemeris access. Correct but slow (~126k planet positions/sec, measured).
 * Nothing in the search hot loop may call this — see longitude.ts for the fast path.
 */
import * as Astro from 'astronomy-engine'
import { getBody } from './catalog'

/** Obliquity of the ecliptic at J2000, in radians. */
const OBLIQUITY_J2000 = (23.4392911 * Math.PI) / 180
const COS_EPS = Math.cos(OBLIQUITY_J2000)
const SIN_EPS = Math.sin(OBLIQUITY_J2000)

/** Days from the J2000.0 epoch (2000-01-01 12:00 TT) to the Unix epoch. */
export const J2000_UNIX_MS = Date.UTC(2000, 0, 1, 12, 0, 0)

export const daysToDate = (days: number): Date => new Date(J2000_UNIX_MS + days * 86400_000)
export const dateToDays = (d: Date): number => (d.getTime() - J2000_UNIX_MS) / 86400_000

/** Civil year (approximate, display only) from days since J2000. */
export const daysToYear = (days: number): number => 2000 + days / 365.25
export const yearToDays = (year: number): number => (year - 2000) * 365.25

/**
 * Ecliptic longitude of an equatorial-J2000 vector, in degrees [0, 360).
 *
 * astronomy-engine's own Ecliptic() uses the equinox *of date*, which precesses at
 * ~50 arcsec/yr. Measured, that swamps everything else: it produced ~14 deg of error
 * per 1000 years, identically for every body. Rotating by the fixed J2000 obliquity
 * instead removed ~30x of the error.
 */
export function eclipticLongitudeJ2000(v: { x: number; y: number; z: number }): number {
  const yEcl = v.y * COS_EPS + v.z * SIN_EPS
  const deg = (Math.atan2(yEcl, v.x) * 180) / Math.PI
  return (deg + 360) % 360
}

const PLANET_BODY: Record<string, Astro.Body> = {
  mercury: Astro.Body.Mercury,
  venus: Astro.Body.Venus,
  earth: Astro.Body.Earth,
  mars: Astro.Body.Mars,
  jupiter: Astro.Body.Jupiter,
  saturn: Astro.Body.Saturn,
  uranus: Astro.Body.Uranus,
  neptune: Astro.Body.Neptune,
  pluto: Astro.Body.Pluto,
}

/**
 * True longitude of a body at time `days` (days from J2000), in the fixed J2000
 * ecliptic frame. Planets are heliocentric; moons are measured about their parent.
 */
export function exactLongitude(bodyId: string, days: number): number {
  const body = getBody(bodyId)
  const time = Astro.MakeTime(days) // numeric path: no Date allocation in the hot loop

  if (body.kind === 'planet') {
    return eclipticLongitudeJ2000(Astro.HelioVector(PLANET_BODY[bodyId], time))
  }
  if (bodyId === 'luna') {
    return eclipticLongitudeJ2000(Astro.GeoMoon(time))
  }
  // Galilean moons: jovicentric state vectors, already in the EQJ orientation.
  const moons = Astro.JupiterMoons(time)
  const state = (moons as unknown as Record<string, Astro.StateVector>)[bodyId]
  if (!state) throw new Error(`No ephemeris for moon: ${bodyId}`)
  return eclipticLongitudeJ2000(state)
}
