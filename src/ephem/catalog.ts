/**
 * The body catalog.
 *
 * Every body exposes its heliocentric (or parent-centric) ecliptic longitude in the
 * FIXED J2000 ecliptic frame. Using the equinox of date instead would make every
 * spoke drift by ~50 arcsec/year of precession — physically real, but musically it
 * just smears the score. A fixed frame keeps a spoke nailed to the stars.
 */

export type BodyKind = 'planet' | 'moon'

export interface BodyDef {
  id: string
  name: string
  kind: BodyKind
  /** Parent barycentre a moon orbits; undefined for planets (they orbit the Sun). */
  parent?: string
  /** Sidereal orbital period in days. The single most important number here: it sets tempo. */
  periodDays: number
  /** Orbit radius in AU (planets) or 1000 km (moons). Display only. */
  radius: number
  eccentricity: number
  /** Display colour. */
  color: string
}

export const BODIES: BodyDef[] = [
  // --- Planets: heliocentric. Periods 88 days to 165 years. ---
  { id: 'mercury', name: 'Mercury', kind: 'planet', periodDays: 87.9691,   radius: 0.387, eccentricity: 0.2056, color: '#b6a99a' },
  { id: 'venus',   name: 'Venus',   kind: 'planet', periodDays: 224.701,   radius: 0.723, eccentricity: 0.0068, color: '#e8c88a' },
  { id: 'earth',   name: 'Earth',   kind: 'planet', periodDays: 365.2564,  radius: 1.000, eccentricity: 0.0167, color: '#6ba9e8' },
  { id: 'mars',    name: 'Mars',    kind: 'planet', periodDays: 686.980,   radius: 1.524, eccentricity: 0.0934, color: '#e2714a' },
  { id: 'jupiter', name: 'Jupiter', kind: 'planet', periodDays: 4332.589,  radius: 5.203, eccentricity: 0.0489, color: '#d9a066' },
  { id: 'saturn',  name: 'Saturn',  kind: 'planet', periodDays: 10759.22,  radius: 9.537, eccentricity: 0.0565, color: '#e6d2a0' },
  { id: 'uranus',  name: 'Uranus',  kind: 'planet', periodDays: 30688.5,   radius: 19.19, eccentricity: 0.0457, color: '#8fd6e0' },
  { id: 'neptune', name: 'Neptune', kind: 'planet', periodDays: 60195.0,   radius: 30.07, eccentricity: 0.0113, color: '#5b7ee0' },
  { id: 'pluto',   name: 'Pluto',   kind: 'planet', periodDays: 90560.0,   radius: 39.48, eccentricity: 0.2488, color: '#c9b6a8' },

  // --- Moons: the fast voices. Without these there is no melody, only drones. ---
  // The Galileans sit in a 1:2:4 Laplace resonance, which is literally a rhythmic hierarchy:
  // Europa's period is 2x Io's, Ganymede's is 4x Io's. Free metric grid.
  { id: 'io',       name: 'Io',       kind: 'moon', parent: 'jupiter', periodDays: 1.769137786, radius: 421.7,  eccentricity: 0.0041, color: '#f5e07a' },
  { id: 'europa',   name: 'Europa',   kind: 'moon', parent: 'jupiter', periodDays: 3.551181041, radius: 671.0,  eccentricity: 0.0090, color: '#e8ddc8' },
  { id: 'ganymede', name: 'Ganymede', kind: 'moon', parent: 'jupiter', periodDays: 7.15455296,  radius: 1070.4, eccentricity: 0.0013, color: '#a89a86' },
  { id: 'callisto', name: 'Callisto', kind: 'moon', parent: 'jupiter', periodDays: 16.6890184,  radius: 1882.7, eccentricity: 0.0074, color: '#7d7266' },
  { id: 'luna',     name: 'The Moon', kind: 'moon', parent: 'earth',   periodDays: 27.321661,   radius: 384.4,  eccentricity: 0.0549, color: '#d8d8d8' },
]

export const BODY_BY_ID = new Map(BODIES.map((b) => [b.id, b]))

export function getBody(id: string): BodyDef {
  const b = BODY_BY_ID.get(id)
  if (!b) throw new Error(`Unknown body: ${id}`)
  return b
}
