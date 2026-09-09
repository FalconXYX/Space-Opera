/**
 * A 25 ms heartbeat, in a worker.
 *
 * Main-thread timers throttle to about 1 Hz in a background tab and rAF is paused
 * entirely, so neither can drive audio scheduling. Worker timers are not throttled the
 * same way. This file does nothing else, deliberately.
 */
const TICK_MS = 25
setInterval(() => { postMessage(0) }, TICK_MS)
