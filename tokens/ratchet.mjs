/*
  The drift ratchet. A measured count must never exceed its baseline (invariant
  X1's growth half). Factored out of check.mjs so it is reachable as a unit
  (WO-6.2, decision R-24); check.mjs is the only runtime consumer.
*/

/**
 * The ids whose current count grew past the baseline. A baseline that has no
 * entry for a count does not constrain it (a new measurement is not yet
 * baselined), matching check.mjs's `baseline[id] !== undefined` guard.
 */
export function ratchetExceeded(counts, baseline) {
  return Object.entries(counts)
    .filter(([id, count]) => baseline[id] !== undefined && count > baseline[id])
    .map(([id]) => id)
}
