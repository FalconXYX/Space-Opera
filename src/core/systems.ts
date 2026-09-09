/**
 * What you can listen to.
 *
 * A system is a real family of bodies around one centre, and it is always shown WHOLE. Every
 * moon Jupiter has is on the dial, including the forty that are too fast or too slow to sound
 * at whatever speed you are running — those are drawn dim and still turning. Nothing is left
 * out to flatter the sound, because the point of the thing is that the sky is what it is.
 */
import { POOL, type PoolBody } from './pool'
import { EXO_BODIES } from './exo.generated'

export interface System {
  id: string
  /** Which heading it sits under in the picker. */
  group: 'moons' | 'planets'
  /** What is at the centre. */
  centre: string
  /** Colour of the centre, for stars we have no portrait of. */
  centreColor?: string
  /** What is going round it. */
  what: string
  bodies: PoolBody[]
  /**
   * The speed to start at, in days of sky per real second.
   *
   * Chosen by ensemble note rate, not by how many bodies it lights up. Maximising bodies in
   * earshot puts Saturn's inner swarm at eighty-eight notes a second, which is not a chord,
   * it is a hiss. Aiming instead for a handful of notes a second is a listening decision and
   * is stated as one; the knob goes everywhere either way.
   */
  tau: number
  /** One line about what there is to hear, or not hear. */
  note: string
}

const family = (parent: string | null): PoolBody[] =>
  POOL.filter((b) => (b.parent ?? null) === parent).sort((a, b) => a.periodDays - b.periodDays)

const around = (host: string): PoolBody[] =>
  EXO_BODIES.filter((b) => b.parent === host).sort((a, b) => a.periodDays - b.periodDays)

export const SYSTEMS: System[] = [
  {
    id: 'jupiter',
    group: 'moons',
    centre: 'Jupiter',
    what: 'its moons',
    bodies: family('jupiter'),
    tau: 6,
    note:
      'Io, Europa and Ganymede are locked 1:2:4, and here that is exactly what you hear: three consecutive octaves of A, six and thirteen cents out. Callisto adds a third below, so the four of them spell D major. Wind the speed up and the Galileans drop out of earshot while thirty-three irregular moons take over.',
  },
  {
    id: 'saturn',
    group: 'moons',
    centre: 'Saturn',
    what: 'its moons',
    bodies: family('saturn'),
    tau: 27,
    note:
      'Titan and Hyperion are locked 4:3 and come out a perfect fourth apart, one cent off — the cleanest interval in the solar system. Iapetus anchors it from below and Rhea sits on top, four octaves across the four of them. Wind the speed right down and thirteen inner moonlets crowd into a single octave instead: more bodies, no meter, and over half the pairs close enough to beat rather than harmonise.',
  },
  {
    id: 'uranus',
    group: 'moons',
    centre: 'Uranus',
    what: 'its moons',
    bodies: family('uranus'),
    tau: 11.5,
    note:
      'Oberon, Titania, Umbriel and Ariel, spread over two and a half octaves — and nothing here is locked to anything. Uranus is measurably less consonant than random periods drawn over the same range, which is why it is worth hearing: this is what a system with no resonances actually sounds like.',
  },
  {
    id: 'neptune',
    group: 'moons',
    centre: 'Neptune',
    what: 'its moons',
    bodies: family('neptune'),
    tau: 3.5,
    note:
      'Triton, orbiting backwards, sits twenty-nine semitones under everything else and works as a real bass. That gap is not a defect in the tuning — it is the five-fold hole in Neptune\'s geometry between its one big captured moon and the small inner ones.',
  },
  {
    id: 'pluto',
    group: 'moons',
    centre: 'Pluto',
    what: 'Charon and the small moons',
    bodies: family('pluto'),
    tau: 38,
    note:
      'Charon rides high over Styx, Nix, Kerberos and Hydra. Charon against Hydra is 6:1 and against Kerberos 5:1 — two octaves and a fifth, two octaves and a third. This is also the speed at which Hydra and Kerberos, a 6:5 eighteen cents wide, finally clear each other\'s roughness band and read as a minor third instead of a beat.',
  },
  {
    id: 'sun',
    group: 'planets',
    centre: 'the Sun',
    what: 'the planets',
    bodies: family(null),
    tau: 60000,
    note:
      'Neptune and Pluto are locked 3:2 and come out a perfect fifth apart, five cents off. This is the slowest speed at which that fifth clears the roughness band and rings rather than beats — and keeping Jupiter in earshot as well is arithmetically impossible, because the window is thirty-two periods wide and the planets span a thousand.',
  },
]

SYSTEMS.push(
  {
    id: 'hd110067',
    group: 'planets',
    centre: 'HD 110067',
    centreColor: 'rgba(242,217,168,0.95)',
    what: 'six planets in a chain',
    bodies: around('hd110067'),
    tau: 34,
    note:
      'The tightest resonant chain known: 3:2, 3:2, 3:2, 4:3, 4:3, every link inside a cent. ' +
      'The six periods are in the ratio 8:12:18:27:36:48, so the planets come out as a stack ' +
      'of fifths and fourths that is in tune to a degree nothing in our own system manages. ' +
      'Of everything measured here, this is the one that is unarguably music.',
  },
  {
    id: 'trappist1',
    group: 'planets',
    centre: 'TRAPPIST-1',
    centreColor: 'rgba(232,144,122,0.95)',
    what: 'seven planets',
    bodies: around('trappist1'),
    tau: 8.1,
    note:
      'The famous one, and the honest surprise: it sounds worse than HD 110067. All seven can ' +
      'be in earshot at once, which nothing else here manages, but the chain is 8:5, 5:3, 3:2, ' +
      '3:2, 4:3, 3:2 with links tens of cents out, so it rings less cleanly than its reputation.',
  },
)

export const systemById = (id: string): System => SYSTEMS.find((s) => s.id === id) ?? SYSTEMS[0]
