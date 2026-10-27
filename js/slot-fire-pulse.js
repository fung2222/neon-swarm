/**
 * PHASE6-SLOT-FIRE-PULSE-001 (v0.9.49) + v0.9.53 normalize aliases.
 * Brief HUD slot highlight when that weapon fires — multi-bar readability.
 * Pure helpers; DOM wiring lives in main.js.
 */

/** How long the CSS pulse class stays (ms). Short enough for MG RoF restart. */
export const SLOT_FIRE_PULSE_MS = 140;

const ALIAS = {
  mg: 'gatling', laser: 'ion_beam', rocket: 'tracking_bomb',
  grenade: 'frag', plasma: 'acid_gun',
};

function norm(id) {
  if (!id) return null;
  return ALIAS[id] || id;
}

/**
 * Index of `weaponId` in the HUD bar, or -1 if not armed / unknown.
 * Matches legacy aliases (mg↔gatling, …).
 */
export function slotIndexForWeapon(weaponSlots, weaponId) {
  if (!weaponId || !Array.isArray(weaponSlots)) return -1;
  const want = norm(weaponId);
  let i = weaponSlots.indexOf(weaponId);
  if (i >= 0) return i;
  i = weaponSlots.indexOf(want);
  if (i >= 0) return i;
  for (let j = 0; j < weaponSlots.length; j++) {
    if (norm(weaponSlots[j]) === want) return j;
  }
  return -1;
}
