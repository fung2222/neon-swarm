/**
 * Commute / background auto-pause helpers (v0.9.20).
 * Pure predicates — unit-testable without DOM/WebGL.
 * Auto-pause only from active `play`; never auto-resume on visible.
 */

/** States that mean an active combat run (not menu / pause / over / cards). */
export function shouldAutoPauseOnHidden(state) {
  return state === 'play';
}

/**
 * Next app state when the document becomes hidden / pagehide fires.
 * Idempotent for pause/menu/over/level.
 */
export function stateAfterBackground(state) {
  return shouldAutoPauseOnHidden(state) ? 'pause' : state;
}
