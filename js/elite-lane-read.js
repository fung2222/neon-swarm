/**
 * PHASE6-ELITE-LANE-READ-001 (v0.9.50)
 * Thicker / brighter elite charge warning lanes for phone readability.
 * Not a new elite; not Phase 4 Morph.
 */

/** Pre-v0.9.50 baselines (for regression asserts). */
export const ELITE_LANE_LEGACY = {
  dualWidth: 0.85,
  singleWidth: 1.1,
  opacityBase: 0.42,
  opacityGain: 0.50,
  color: 0xff6a1a,
  colorTwin: 0xff8a1a,
  y: 0.06,
};

/** v0.9.50 phone-readable charge lanes. */
export const ELITE_LANE = {
  dualWidth: 1.28,
  singleWidth: 1.62,
  opacityBase: 0.58,
  opacityGain: 0.40,
  /** Brighter danger-orange (still ≠ player cyan / décor teal). */
  color: 0xff7a14,
  colorTwin: 0xff9a28,
  y: 0.09,
};

export function eliteLaneOpacity(u) {
  const t = Math.max(0, Math.min(1, u == null ? 0 : u));
  return ELITE_LANE.opacityBase + t * ELITE_LANE.opacityGain;
}

export function eliteLaneWidth(dual) {
  return dual ? ELITE_LANE.dualWidth : ELITE_LANE.singleWidth;
}
