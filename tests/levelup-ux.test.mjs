/**
 * Phase 6 level-up card UX smoke (v0.9.31) + v0.9.58 catalog ids.
 * Run: node tests/levelup-ux.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { CARDS, isSlotWeapon, hasEmptyWeaponSlot, emptyWeaponSlots, buildWeaponPickupOffer } from '../js/config.js';

const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');

assert.ok(css.includes('.card-title'), 'card-title style');
assert.ok(css.includes('.card-slot-hint'), 'slot hint style');
assert.ok(css.includes('.stack-bar'), 'stack progress bar');
assert.ok(css.includes('min-height: 96px') || css.includes('min-height:96px'), 'mobile tap height');
assert.ok(main.includes('card-slot-hint'), 'slot hint render');
assert.ok(main.includes('stack-fill'), 'stack fill render');
assert.ok(main.includes('hasEmptyWeaponSlot'), 'slot helper imported');
assert.ok(main.includes('card-title-en'), 'zh+EN title hierarchy');

// Pickup offer builders still produce keep / take / swap / convertHeal
{
  const slots = emptyWeaponSlots();
  const take = buildWeaponPickupOffer('ion_beam', {}, slots);
  assert.ok(take && Array.isArray(take.choices));
  const modes = new Set(take.choices.map((c) => c.pickupAction).filter(Boolean));
  assert.equal(take.mode, 'take');
  assert.ok(modes.has('keep'), 'keep action present');
  assert.ok(modes.has('take'), 'take action present');
  // legacy alias still resolves
  const legacy = buildWeaponPickupOffer('laser', {}, slots);
  assert.equal(legacy.mode, 'take');
  assert.equal(legacy.choices.find((c) => c.pickupAction === 'take').id, 'ion_beam');
}
{
  const full = ['gatling', 'ion_beam', 'shotgun', 'acid_gun', 'frag', 'chill'];
  const offer = buildWeaponPickupOffer('vulcan', { ion_beam: 1, shotgun: 1, acid_gun: 1, frag: 1, chill: 1 }, full);
  assert.equal(offer.mode, 'swap');
  const acts = offer.choices.map((c) => c.pickupAction);
  assert.ok(acts.includes('swap'), 'swap when full');
  assert.ok(acts.includes('keep'), 'keep when full');
}
{
  const maxed = buildWeaponPickupOffer('ion_beam', { ion_beam: 5 }, ['gatling', 'ion_beam', null, null, null, null]);
  assert.equal(maxed.mode, 'max');
  const acts = maxed.choices.map((c) => c.pickupAction);
  assert.ok(acts.includes('convertHeal'), 'maxed ion convertHeal');
  assert.ok(acts.includes('keep'), 'maxed keep');
}

assert.ok(CARDS.some((c) => c.kind === 'weapon' && isSlotWeapon(c.id)));
assert.ok(hasEmptyWeaponSlot(['gatling', null, null, null, null, null]));
assert.ok(!hasEmptyWeaponSlot(['gatling', 'ion_beam', 'shotgun', 'acid_gun', 'frag', 'chill']));
assert.ok(!CARDS.some((c) => ['laser', 'rocket', 'grenade', 'plasma'].includes(c.id)), 'legacy unlock cards gone');

console.log('levelup-ux OK');
