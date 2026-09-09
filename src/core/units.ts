/**
 * Branded units. The time-compression bug is the expensive one: two of the source
 * designs shipped two different units for it in a single document, a factor of 86400
 * apart. Make it a compile error instead.
 */

/** Terrestrial Time, days since J2000.0. The ONLY internal clock.
 *  Civil dates are a DISPLAY conversion carrying an explicit error bar: delta-T is
 *  74,325 s (20.6 h) at year -3000, with a formal uncertainty of hours. */
export type TT = number & { readonly __brand: 'TT' }

/** Listening seconds from the start of the rendered excerpt. */
export type Listen = number & { readonly __brand: 'Listen' }

/** AudioContext seconds. `AudioContext.currentTime` lives here. */
export type Audio = number & { readonly __brand: 'Audio' }

/** THE time-compression factor: simulation DAYS per LISTENING SECOND.
 *  There is exactly one unit for this in the entire codebase. */
export type Tau = number & { readonly __brand: 'Tau' }

/** Fixed-J2000-ecliptic longitude, degrees in [0, 360). */
export type Deg = number & { readonly __brand: 'Deg' }

export const tt = (n: number) => n as TT
export const deg = (n: number) => n as Deg
export const tau = (n: number) => n as Tau
export const audio = (n: number) => n as Audio

/** Signed shortest angular distance, in (-180, 180]. */
export const wrap180 = (d: number): number => {
  let x = d % 360
  if (x > 180) x -= 360
  if (x <= -180) x += 360
  return x
}

export const wrap360 = (d: number): number => ((d % 360) + 360) % 360
