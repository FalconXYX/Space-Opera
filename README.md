# Space Opera

An interactive orrery that plays real orbital mechanics as sound.

**[parthjain.ca/Space-Opera](https://parthjain.ca/Space-Opera/)**

Eight real systems, 144 bodies: the planets, the moons of Jupiter, Saturn, Uranus, Neptune and
Pluto, and two exoplanet systems. Each body sounds a note once per orbit. Run time fast enough
and those orbits become audible frequencies, at which point the ratios between them are heard
as musical intervals.

## The science

An orbital period is a frequency. A body with period *P* completes 1/*P* orbits per unit time,
and that is a frequency in the same sense a vibrating string has one — it is only far too low
to hear.

Some bodies are locked into **mean-motion resonance**: their periods sit at a ratio of small
integers, held there by mutual gravity. Io, Europa and Ganymede orbit Jupiter in a 1:2:4 chain
(the Laplace resonance). Titan and Hyperion are locked 4:3. Neptune and Pluto are locked 3:2.

Musical intervals are also frequency ratios. Two frequencies at 2:1 are an octave apart, 3:2 a
perfect fifth, 4:3 a perfect fourth. These are the same small integers, so **a resonant system,
transposed into hearing range, is a chord** — and the interval is not a representation of the
resonance, it is the resonance measured in a different unit.

Resonances are never exact. Io:Europa is 6 cents wide and Europa:Ganymede 13, so the Laplace
octaves beat slowly rather than ringing clean. Systems with no locks produce no intervals worth
the name; Uranus's moons are measurably less consonant than random periods drawn from the same
range.

## The mapping

Time runs at τ days of sky per real second, so a body completes τ/*P* orbits per second. Every
body is raised by one shared whole number of octaves:

```
rate  = τ / periodDays          notes per second
pitch = rate × 2⁷               hertz
```

One shared shift means ratios survive exactly. Nothing is retuned, quantised to a scale, or
given its own transposition.

The shift is 7 because that is the only value that lines up two windows. Separate notes are
heard as separate events between roughly ¼ and 8 a second; pitch is musical between roughly 32
and 1024 Hz. Both spans are five octaves, and 0.25 × 2⁷ = 32. A body sounding once a second
sings at 128 Hz.

A body sounds when it crosses **ecliptic longitude zero** — the J2000 vernal equinox, the origin
of the coordinate system the ephemeris is written in. For the exoplanet systems the reference
direction is Earth, so those planets sound as they **transit**, which is how they were detected.

Because pitch and rate are the same number, a body outside 0.25–8 notes/sec is either too fast
to resolve or too slow to register. Those bodies are still drawn, dimmed, still orbiting. The
window is always 32 periods wide; the speed control slides it across the system rather than
widening it, so no setting sounds everything at once.

## The tool

The app visualises the system and lets you play it. It does not try to compose.

- **Speed** — the main control. It selects which bodies are in earshot and transposes
  everything together, the way playing a record faster does.
- **Mix** — one row per body: sound or silence it, choose any of 16 synthesised voices, shift it
  by whole octaves, place it in stereo. Bodies out of earshot can be forced on.
- **About** — what is locked to what in the current system, and by how many cents.

Octaves are the only pitch control, and being powers of two they leave every ratio intact.
Everything else the tool exposes is timbre, placement and presence. Pitch and rhythm stay the
orbit's.

## What is in it

Defaults, measured. `npm run tune` reproduces the speeds.

| system | bodies | default speed | in earshot | chord |
|---|---|---|---|---|
| Jupiter | 41 | 6 d/s | 4 | D major — Io:Europa:Ganymede 1:2:4 as three octaves of A |
| Saturn | 38 | 27 d/s | 4 | F major 9th — Titan:Hyperion 4:3, one cent wide |
| Uranus | 26 | 11.5 d/s | 4 | D minor add9 — nothing locked |
| Neptune | 12 | 3.5 d/s | 4 | G♯ major 9th — Triton 29 semitones below the rest |
| Pluto | 5 | 38 d/s | 5 | C minor — Charon:Hydra 6:1, Charon:Kerberos 5:1 |
| the Sun | 9 | 60,000 d/s | 4 | C major 7th — Neptune:Pluto 3:2, 5 cents |
| HD 110067 | 6 | 34 d/s | 6 | C♯ sus2 — a 3:2·3:2·3:2·4:3·4:3 chain, links inside a cent |
| TRAPPIST-1 | 7 | 8.1 d/s | 7 | F major 7th — resonant, but tens of cents out |

Speeds are chosen by two measurable criteria rather than by ear: adjacent sounding voices
separated by more than 1.2 × the critical bandwidth (0.019*f* + 17.4 Hz), at an ensemble rate
below about ten notes a second. Both follow from the mapping. Since pitch = 128 × rate, the sum
of all sounding pitches equals 128 × the ensemble rate, so a seven-note-per-second ensemble has
a fixed pitch budget to divide between its voices. Divide it too many ways and the voices land
inside each other's critical bands.

## Technical

**Stack.** Vite, React, TypeScript, Canvas2D for the orrery, Web Audio for sound, zustand for
state. Tone.js is used only for its reverb and its worker-driven clock, not as a sequencer.
Static build, no backend.

**Positions.** The planets, the Galilean moons and the Moon use a real ephemeris
(`astronomy-engine`, JPL-derived). Everything else uses circular mean motion from measured
periods — approximate for where a body is drawn, exact for what is heard, since the sound is
made of periods. Longitudes are computed in a fixed J2000 ecliptic frame; using equinox-of-date
would drift every body's phase by precession.

**Exoplanet data.** Periods, semi-major axes and transit epochs come from the NASA Exoplanet
Archive, with period and epoch taken from the same published row so phase error does not
accumulate over the thousands of orbits since observation. `npm run exo` refetches.

**Audio.** Sixteen voices across three synthesis cores — filtered oscillators, modal resonators
and 2-operator FM — each with its own filter envelope, absolute-Hz body resonances and a noise
transient. Notes are scheduled ahead of time against the `AudioContext` clock, driven by a 25 ms
worker tick, so a dropped frame cannot shift a note. A note's ring time is always refitted to
the gap before that body returns, so no voice overlaps itself.

**Which voice a body gets is a presentation choice, not a measurement.** Kepler's third law makes
semi-major axis a monotone function of period, and mass and radius are unavailable for most of
these bodies, so period, orbital radius, rate, pitch and register are all the same number. No
rule drawn from the orbits can distinguish two bodies of similar period. Voices are therefore
spread across the ensemble by rank, dark at the bottom to bright at the top. Stereo alternates
between ears, because roughness is a within-ear effect and the pairs that clash are the ones
adjacent in pitch.

**Commands.**

```bash
npm install
npm run dev       # http://localhost:5173
npm run verify    # crossing counts, polyphony and timbre spread against prediction
npm run pulse     # onset autocorrelation: is there a meter?
npm run tune      # the speed each system should start at
```

`tools/` holds the measurement harnesses behind every number in this file. Deployment is a
GitHub Actions workflow that runs lint and verify before building, so a change that alters the
sound fails rather than ships.

## Licence

MIT. Voices are synthesised, so no sample licence enters the tree. `astronomy-engine` is MIT;
its npm tarball ships no licence file, so the text is vendored in `third_party/`.
