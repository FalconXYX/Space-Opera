# Space Opera

**An orbit is a frequency.** Not music played over a picture of planets, and not a tune the
planets were bent into fitting — the orbits themselves, sped up until you can hear them.

```bash
npm install
npm run dev        # http://localhost:5173
npm run verify     # crossings, polyphony and timbre spread all match what the physics predicts
npm run pulse      # is there a meter, or is it a drizzle? (onset autocorrelation)
npm run tune       # what speed each system should start at, and why
```

## It is a tool, not a jukebox

The app makes no attempt to hand you a finished piece. It puts a real system on the dial, sounds
whatever the speed puts in earshot, and then gets out of the way — landing on it gives you the
orrery, a title, and a transport, and nothing else. Two buttons open the rest:

- **Mix** — every body the speed reaches, one row each: sound it or silence it, pick any of the
  sixteen voices, move it whole octaves, seat it in the stereo field. `show all` extends the
  list to every moon in the system, including the ones out of earshot, so you can force one on
  and hear why it is normally left out.
- **About** — what this system is, what is locked to what, and how many cents out.

Two rules make it usable rather than merely configurable. Ring time is always refitted to the
body's own return, so choosing a four-second pad for a moon that comes round twice a second
gives you that pad shortened rather than a wash. And **a body's default voice and seat are
ranked over what the SPEED puts in earshot, never over what is currently sounding** — otherwise
muting one moon silently re-voices every other one, which it did until it was measured.

Octaves are the one pitch control, and they are powers of two: a body moved by them keeps its
interval with anything else moved by the same amount. Everything the tool exposes is timbre,
placement and presence. Pitch and rhythm stay the orbit's.

## The mapping, and why it has no free parameters

Run time at `tau` days per real second and a body completes `tau / period` orbits every second.
That is not a metaphor for a frequency, it is one. Raise every body by **one shared whole
number of octaves** and every ratio survives exactly:

```
rate_i  = tau / periodDays_i      notes per second — one per crossing of the reading line
pitch_i = rate_i * 2^7            hertz
```

So a 2:1 orbital resonance comes out as an **octave** and a 3:2 as a **perfect fifth**. The
consonance is the resonance. Nothing is retuned to sound nicer, and where a lock is imperfect
you hear it beat.

Pitch and rhythm are therefore the same number. That looks like a problem and is actually what
makes the whole thing work, because it also fixes the octave shift. Separate notes are only
heard as separate events between roughly ¼ and 8 a second; pitch is only musical between
roughly 32 Hz and 1024 Hz. Both windows are five octaves wide, so exactly one shift lines them
up — `0.25 × 2^N = 32` gives `N = 7`. **A body that sounds once a second sings at 128 Hz.**
Everything else follows from its orbit.

A body sounds when it crosses **ecliptic longitude zero**, the J2000 vernal equinox. That
direction is not tuned either; it is simply where the coordinate system the ephemeris is
written in has its origin. For the two exoplanet systems it is the direction of Earth, so those
planets sound when they **transit** — which is how every one of them was discovered.

## Everything is on the dial

Jupiter has 41 moons here and four of them are audible at the default speed. The other 37 are
drawn dim, still turning, still labelled. Nothing is hidden to flatter the sound, because the
selection rule is the honest part: **a body sounds when its rate falls in the window**, the
window is always exactly 32 periods wide, and the speed control slides it across the system.
No setting puts everything in earshot, and none of them is the "right" one.

The edges are soft, which is also honest — nothing happens to a moon at eight notes a second;
it is our hearing that stops resolving them, and that fades rather than switching off. The same
number that fades a voice dims its body on the dial, so what you see is how much you are
getting.

## What the systems actually sound like

Measured, not asserted. `npm run tune` reproduces the speeds; `npm run verify` reproduces the
event counts.

| system | at the default speed | in earshot | spells | the real locks |
|---|---|---|---|---|
| **HD 110067** | 34 d/s, 10.4 notes/s | **6 of 6** | a stack of fifths | 3:2·3:2·3:2·4:3·4:3, links inside **1 cent** |
| **Jupiter** | 6 d/s, 6.3 notes/s | 4 of 41 | D major | Io:Europa:Ganymede **1:2:4** — three consecutive A's, 6¢ and 13¢ out |
| **Saturn** | 27 d/s, 9.3 notes/s | 4 of 38 | F major 9th | Titan:Hyperion **4:3 to one cent** — the cleanest interval in the solar system |
| **the Sun** | 60,000 d/s, 9.2 notes/s | 4 of 9 | C major 7th | Neptune:Pluto **3:2**, 5¢ |
| **Pluto** | 38 d/s, 11.6 notes/s | **5 of 5** | C minor | Charon:Hydra 6:1, Charon:Kerberos 5:1 |
| **TRAPPIST-1** | 8.1 d/s, 13.9 notes/s | **7 of 7** | G♯ major 9th | 3:2 and 2:1 links, but tens of cents out |
| **Neptune** | 3.5 d/s, 13.8 notes/s | 4 of 12 | G♯ major 9th | Triton as a bass 29 semitones under everything |
| **Uranus** | 11.5 d/s, 9.4 notes/s | 4 of 26 | D minor add9 | none — see below |

**How the speed is chosen**, since it decides everything else. Two measured criteria, not taste:
every adjacent pair of sounding voices separated by more than 1.2 × the roughness bandwidth
`0.019f + 17.4` Hz, at an ensemble rate under about ten notes a second. That rule rejected five
of the eight speeds this app first shipped — Saturn's by a factor of 66 — and it follows from
an exact identity. Because `hz = 128 × rate`, the **sum** of all sounding pitches is
`128 × ensemble rate`: a seven-note ensemble has 896 Hz of pitch budget in total, and split
thirteen ways that is 69 Hz a voice against a roughness spacing four semitones wide. Thirteen
voices at a musical note rate is arithmetically guaranteed to be mud.

The same thing in the time domain: autocorrelate the onset train, and Saturn's old thirteen-voice
setting scores r = 0.17 at a coefficient of variation of 0.95 — statistically rain. Its
four-voice setting scores r = 0.61. Jupiter's Galileans reach r = 0.74 at a 0.47 s lag, which is
Europa's note period with Io subdividing it 2:1: a meter you can tap to, out of four moons.

Three of these are worth stating plainly:

- **HD 110067 is the only one that is unarguably music.** Its six periods are in the ratio
  8:12:18:27:36:48, every adjacent link inside a cent, so all fifteen pairs are stacked fifths
  and fourths. Nothing in our own system is in tune to that degree.
- **TRAPPIST-1 is the famous one and it sounds worse.** All seven planets fit in earshot at
  once, which nothing else manages, but its chain links are tens of cents out.
- **Uranus is measurably *anti*-resonant** — less consonant than random periods drawn from the
  same range. It is in the app precisely because it is the counterexample.

## The speed control is the instrument

The same system is a different piece at different speeds, and both are true. Jupiter at 6 d/s
is the Laplace resonance: four Galilean moons, three octaves of A. Wind it to 450 d/s and every
Galilean falls silent while **33 captured irregular asteroids** take over — crammed into 4.2
semitones, which is a hiss, not a chord. Saturn wound up reveals its Trojan moons: Tethys,
Telesto and Calypso in exact unison, because they share one orbit.

Speed changes pitch, as it must. Running a sonification faster raises it, exactly as a record
does; a speed control that changed the rhythm without the pitch would quietly stop the claim
that pitch *is* the orbit from being true.

## What was tried first, and why it was wrong

The first version of this tried to find **existing songs** hidden in real orbits — search the
sky for an arrangement that plays Twinkle Twinkle. It got as far as several tunes at 100% and
it was a dead end, for reasons worth keeping:

- To make a melody fit, rings had to carry up to 64 evenly spaced marks, and the sky had to be
  started at one exact epoch and **looped** there. Looping made the moons visibly teleport. Any
  mechanism that makes an orbit stop looking like an orbit has already lost the argument.
- Pitch and rhythm being the same quantity means a tune must encode its intervals *and* its
  rhythm in one set of ratios. Real melodies do not, so the constraint binds twice and what
  survives is only music whose pitch structure and rhythmic structure are the same structure.
- It was backwards. The interesting claim is not "the sky can be made to play our music"; it is
  that the sky's own structure is already musical, and that resonance and consonance are the
  same fact.

Bugs from that era that were only ever caught by measuring, never by reading:

- **Playing at the wrong moment.** An alignment holds at one epoch. The app started at
  `new Date()` while the search solved at J2000 — 75–100% of the notes at the solved epoch, and
  **0%** roughly 9,750 days later. Not "worse": every single note wrong.
- **Marks restricted to 1,2,3,4,6,8** made `12·log₂K mod 12` only ever 0 or 7.02, so the
  instrument had no third and no sixth and no major-key tune could ever come out of it.
- **Note decay sized against the orbital period** rather than the gap to the next note. With 40
  marks on a wheel that is 40× too long. This was the "reverb" — the bus send was 6% the whole
  time; it was the notes themselves never stopping.

## Instruments

Polyphony is held down by the same physics that sets the rhythm: a note's ring is sized against
the gap to that body's own return, so no voice ever collides with itself. Measured, every system
sits at 0.81–0.88× self-overlap and 3–6 notes sounding at once. The renderer this replaces
stretched a low note's decay by pitch, so a Saturn voice rang for six to ten seconds against a
gap of one and a half — **30 notes sounding at once out of 6.9 a second**, which is a drone
wearing the costume of a melody.

Sixteen voices across three synthesis cores — filtered oscillators, modal resonators and
two-operator FM — each with its own filter envelope, absolute-Hz body resonances, a noise
breath layer and an audible strike transient. Measured through an `OfflineAudioContext` on the
shipped code, they span **3.18 octaves of spectral centroid**, with crest factors from 3
(sustained pad) to 20 (music box) and levels matched to within 2.4 dB.

The set they replace measured 0.87 octaves of brightness, 73–94% mean pairwise excitation
overlap, a strike transient worth 0.03% of a note's energy, and a null test between two strikes
of the same body that came out at digital silence. Twelve names, one instrument.

**Which voice a body gets is an orchestration decision, and it is labelled as one.** Kepler
makes semi-major axis a monotone function of period (Spearman ρ = 1.0000 in seven of the eight
systems), and mass and radius are missing for most of these bodies — so period, orbital radius,
note rate, pitch and register are all the same number, and the one physical degree of freedom
per body is already spent on pitch and rhythm. No rule drawn from the orbits can give two moons
of similar period different voices. The ensemble is therefore spread across the palette by
rank, darkest at the bottom to brightest at the top, which reaches both ends of the set however
crowded the pitches are. Neither that nor the stereo placement touches pitch or timing.

Stereo alternates rather than sweeping low-to-high, which is the opposite of the obvious choice
and is the right one: roughness is a within-ear phenomenon, so the pairs that actually clash are
the ones ADJACENT in pitch, and a smooth low-to-high spread seats exactly those pairs next to
each other. Alternating puts every neighbouring pair in opposite ears.

Two bugs found by measuring rather than reading, both of which had shipped:

- The old selector `instrumentFor(secondsPerOrbit, hz)` took **one number twice** — `hz ×
  secondsPerOrbit = 128` exactly, for every body always — so its register tie-break was a
  restatement of its rate test, and **seven of twelve instruments were unreachable at any speed
  in any system**, including every sustained voice. Four bright struck voices did all the work.
- A Karplus-Strong voice whose feedback loop diverged to a **peak of 2.0 × 10³¹**. A DelayNode
  inside a cycle is clamped to one render quantum and the damping filter's phase makes the loop
  gain hard to hold under one at every pitch a body might take; it is now a filtered pluck.

## Two details that still matter

**Closeness is not resonance.** Ganymede:Callisto fits 7:3 to half a cent, but seven-to-three is
not why those moons sit where they do, while Io:Europa at 2:1 is six cents out and is the
textbook lock. The ranking charges for the size of the integers, so it finds resonances instead
of coincidences.

**Octaves must be counted, not folded away.** A 4:1 ratio folded into one octave reads as a
unison. Getting that wrong is the difference between a readout you can trust and one you cannot.

## Layout

```
src/core/listen.ts       the mapping — rate, pitch, the window, why N = 7
src/core/systems.ts      the systems, their starting speeds and what is locked to what
src/core/sonify.ts       interval naming, resonance ranking, chord reading
src/core/exo.generated.ts  NASA Exoplanet Archive data, phases from real transit epochs
src/ephem/               real ephemeris; frames.ts is the only file allowed to call atan2
src/audio/               synthesised voices, look-ahead scheduler, 25 ms worker tick
src/render/              Canvas2D dial; every body drawn, dim if out of earshot
tools/                   the measurement harnesses behind every number above
```

## Honesty notes

- Jupiter's Galilean moons, the planets and the Moon use a real ephemeris (astronomy-engine,
  JPL-derived). The rest use circular mean motion from measured periods — approximate for where
  they are *drawn*, exactly right for what is *heard*, since the sound is made of periods.
- Exoplanet periods, semi-major axes and transit epochs come from the NASA Exoplanet Archive,
  with period and epoch taken from the same published row so phase error does not accumulate
  over the thousands of orbits since the observation.
- Pitches are shifted by one shared power of two, so no interval is ever adjusted to sound
  nicer than it is. Where a resonance is imperfect, you hear the beating.
- There is no compressor and no limiter on the bus. Dynamics are part of the music.
- Time runs continuously and never loops, resets or seeks on its own.
- Voices are synthesised, so no sample licence enters the tree. `astronomy-engine` is MIT; its
  npm tarball ships no licence file, so the text is vendored in `third_party/`.

## Licence

MIT.
