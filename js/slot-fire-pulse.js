/**
 * PHASE6-SLOT-FIRE-PULSE-001 (v0.9.49)
 * Brief HUD slot highlight when that weapon fires — multi-bar readability.
 * Pure helpers; DOM wiring lives in main.js.
 */

/** How long the CSS pulse class stays (ms). Short enough for MG RoF restart. */
export const SLOT_FIRE_PULSE_MS = 140;

/**
 * Index of `weaponId` in the HUD bar, or -1 if not armed / unknown.
 * @param {(string|null)[]|null|undefined} weaponSlots
 * @param {string|null|undefined} weaponId
 */
export function slotIndexForWeapon(weaponSlots, weaponId) {
  if (!weaponId || !Array.isArray(weaponSlots)) return -1;
  return weaponSlots.indexOf(weaponId);
}
