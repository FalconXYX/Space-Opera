# Space Opera

An interactive orrery that translates orbital mechanics into sound.

**[Live Demo](https://parthjain.ca/Space-Opera/)**

Eight real celestial systems and 144 bodies. Each body sounds a note as it completes an orbit. Speeding up the simulation shifts those orbits into human hearing range, turning orbital resonances into musical chords.

Inspired by Steve Mould's video _[The Planets Are Weirdly In Sync](https://www.youtube.com/watch?v=Qyn64b4LNJ0)_.

---

## The Concept

An orbital period is really just a frequency that cycles far too slowly for humans to hear. When celestial bodies share an orbital resonance (orbiting at clean ratios like 2:1 or 3:2), those proportions match the ratios behind musical intervals like octaves and fifths.

Space Opera shifts the clock so these cycles reach audible pitch. Because every body shares the same octave shift and pitches are never forced into standard musical scales, the natural harmony (or dissonance) of each system plays out exactly as the physics dictates.

---

## What It Does

- **Real Orbital Systems:** Simulates 8 celestial systems and 144 bodies, including our Solar System, the moons of Jupiter and Saturn, and several multi-planet exoplanetary systems.
- **Speed-Based Frequency Window:** The speed slider acts as the main tuning dial. Speeding up the simulation brings fast-moving inner moons above the hearing threshold while pulling slower outer planets or asteroids into audible range.
- **Per-Body Mixer:** Each body has its own channel strip where you can mute, solo, pan across stereo channels, shift pitch by whole octaves, or swap between 16 custom synthesizer presets.

---

## Engineering Highlights

- **Performance & State Management:** Built as a client-only application that isolates heavy canvas redraws from the core simulation loop, preventing UI stutter during high-speed multi-body motion.
- **Precision Audio & Scheduling:** Audio events are scheduled independently of the visual render loop using the native Web Audio clock, preventing timing drift and dropped notes when the frame rate drops.
- **Data Ingestion & Testing:** Integrates real JPL and NASA ephemeris datasets with strict epoch matching to prevent phase drift, backed by an automated CI test suite that validates numerical accuracy before deployment.

---

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Graphics:** HTML5 Canvas 2D
- **Audio DSP:** Web Audio API
- **Data:** NASA Exoplanet Archive, JPL Horizons, `astronomy-engine`

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone [https://github.com/your-username/space-opera.git](https://github.com/your-username/space-opera.git)
   cd space-opera
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the local dev server:

   ```bash
   npm run dev
   ```

4. Run the verification suite:
   ```bash
   npm run verify
   ```

---

## License

MIT. `astronomy-engine` is MIT licensed and vendored in `third_party/`.
