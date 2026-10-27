/**
 * Phase 6 multi-slot inventory → v0.9.54 WEAPONS-REDESIGN-001 (2P+2S+2T).
 * Run: node tests/inventory.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import {
  CARDS_BY_ID,
  buildWeaponPickupOffer,
  emptyWeaponSlots,
  WEAPON_SLOT_MAX,
  isSlotWeapon,
  hasEmptyWeaponSlot,
  weaponSlotLevel,
  normalizeWeaponId,
  flattenLoadout,
} from '../js/config.js';

assert.equal(WEAPON_SLOT_MAX, 6);
assert.ok(isSlotWeapon('mg') && isSlotWeapon('laser') && isSlotWeapon('gatling') && !isSlotWeapon('dmg'));
assert.deepEqual(emptyWeaponSlots(), ['gatling', null, null, null, null, null]);
assert.ok(hasEmptyWeaponSlot(emptyWeaponSlots()));
assert.equal(weaponSlotLevel('mg', {}), 1);
assert.equal(weaponSlotLevel('mg', { dmg: 2 }), 2);
assert.equal(weaponSlotLevel('gatling', { gatling: 3 }), 3);
assert.equal(weaponSlotLevel('laser', { laser: 3 }), 3);
assert.equal(normalizeWeaponId('mg'), 'gatling');
assert.equal(normalizeWeaponId('plasma'), 'acid_gun');

// ---- Start loadout: P0 = gatling ----
{
  const g = new Game({ seed: 1 });
  assert.deepEqual(g.weaponSlots, ['gatling', null, null, null, null, null]);
  assert.deepEqual(g.loadout.primary, ['gatling', null]);
  assert.equal(g.weaponSlots.filter(Boolean).length, 1);
}

// ---- Take fills category banks (P / S / T) ----
{
  const g = new Game({ seed: 3 });
  g.applyCard(CARDS_BY_ID.laser);
  assert.ok(g.laser >= 1 || g.ion_beam >= 1);
  assert.equal(g.taken.ion_beam, 1);
  assert.deepEqual(g.loadout.primary, ['gatling', 'ion_beam']);
  assert.deepEqual(g.weaponSlots, ['gatling', 'ion_beam', null, null, null, null]);

  g.applyCard(CARDS_BY_ID.shotgun);
  assert.deepEqual(g.loadout.secondary, ['shotgun', null]);
  assert.deepEqual(g.weaponSlots, ['gatling', 'ion_beam', 'shotgun', null, null, null]);

  g.applyCard(CARDS_BY_ID.grenade);
  assert.deepEqual(g.loadout.throw, ['frag', null]);
  assert.ok(g.weaponSlots.includes('frag'));
}

// ---- Primary category full → swap (not silent) ----
{
  const g = new Game({ seed: 4 });
  g.applyCard(CARDS_BY_ID.laser); // fills P1
  g.applyCard(CARDS_BY_ID.rocket); // 3rd primary → swap
  assert.equal(g.tracking_bomb || g.rocket || 0, 0, 'no silent grant');
  assert.ok(g.pausedForLevel);
  assert.ok(g.pendingCards.some((c) => c.pickupAction === 'swap' && c.swapOut === 'ion_beam'));
  const swap = g.pendingCards.find((c) => c.pickupAction === 'swap' && c.swapOut === 'ion_beam');
  g.applyCard(swap);
  assert.ok(g.weaponSlots.includes('tracking_bomb'));
  assert.ok(!g.weaponSlots.includes('ion_beam'));
  assert.ok(g.weaponSlots.includes('gatling'), 'starter stays');
}

// ---- Upgrade bumps stacks, does not duplicate slot ----
{
  const g = new Game({ seed: 5 });
  g.applyCard(CARDS_BY_ID.laser);
  g.applyCard(CARDS_BY_ID.laser);
  assert.equal(g.taken.ion_beam, 2);
  assert.deepEqual(g.loadout.primary, ['gatling', 'ion_beam']);
}

// ---- Modifiers (dmg) do not take a slot ----
{
  const g = new Game({ seed: 7 });
  g.applyCard(CARDS_BY_ID.dmg);
  assert.equal(g.taken.dmg, 1);
  assert.deepEqual(g.weaponSlots, ['gatling', null, null, null, null, null]);
}

// ---- Pickup take fills throw bank ----
{
  const g = new Game({ seed: 9 });
  g.gems.push({
    x: g.px, z: g.pz, xp: 0, r: 0.22, life: 22, pop: 0, letter: 'W',
    kind: 'weapon', weapon: 'grenade',
  });
  g.step(1 / 30);
  assert.equal(g.pendingFrom, 'pickup');
  const take = g.pendingCards.find((c) => c.pickupAction === 'take');
  g.applyCard(take);
  assert.ok((g.grenade || 0) >= 1 || (g.frag || 0) >= 1);
  assert.ok(g.weaponSlots.includes('frag'));
}

// ---- Category-full offer builder ----
{
  const slots = ['gatling', 'ion_beam', 'shotgun', null, null, null];
  const offer = buildWeaponPickupOffer('tracking_bomb', { ion_beam: 1, shotgun: 1 }, slots);
  assert.equal(offer.mode, 'swap');
  assert.ok(offer.choices.every((c) => c.pickupAction !== 'take'));
  assert.ok(offer.choices.some((c) => c.pickupAction === 'swap' && c.swapOut === 'ion_beam'));
  assert.ok(offer.choices.some((c) => c.pickupAction === 'keep'));
}

// ---- Full 6-slot bank + new type → swap ----
{
  const g = new Game({ seed: 11 });
  g.applyCard(CARDS_BY_ID.laser);
  g.applyCard(CARDS_BY_ID.shotgun);
  g.applyCard(CARDS_BY_ID.plasma);
  g.applyCard(CARDS_BY_ID.grenade);
  g.applyCard(CARDS_BY_ID.chill);
  assert.ok(!hasEmptyWeaponSlot(g.weaponSlots));
  assert.deepEqual(g.weaponSlots, ['gatling', 'ion_beam', 'shotgun', 'acid_gun', 'frag', 'chill']);

  g.gems.push({
    x: g.px, z: g.pz, xp: 0, r: 0.22, life: 22, pop: 0, letter: 'W',
    kind: 'weapon', weapon: 'vulcan',
  });
  const { events } = g.step(1 / 30);
  const offerEv = events.find((e) => e.type === 'weaponOffer');
  assert.ok(offerEv);
  assert.equal(offerEv.mode, 'swap');
  assert.ok(g.pausedForLevel);
  assert.equal(g.vulcan || 0, 0, 'must not grant before swap choice');

  const swap = g.pendingCards.find((c) => c.pickupAction === 'swap' && c.swapOut === 'ion_beam');
  assert.ok(swap, 'swap ion_beam choice');
  g.applyCard(swap);
  assert.ok((g.vulcan || 0) >= 1);
  assert.ok(g.weaponSlots.includes('vulcan'));
  assert.ok(!g.weaponSlots.includes('ion_beam'));
  assert.ok(g.weaponSlots.includes('gatling'), 'gatling stays');
  assert.equal(g.pausedForLevel, false);
}

// ---- Keep on full inventory ----
{
  const g = new Game({ seed: 13 });
  g.applyCard(CARDS_BY_ID.laser);
  g.applyCard(CARDS_BY_ID.shotgun);
  g.applyCard(CARDS_BY_ID.plasma);
  g.applyCard(CARDS_BY_ID.grenade);
  g.applyCard(CARDS_BY_ID.chill);
  const before = g.weaponSlots.slice();
  g.gems.push({
    x: g.px, z: g.pz, xp: 0, r: 0.22, life: 22, pop: 0, letter: 'W',
    kind: 'weapon', weapon: 'flash',
  });
  g.step(1 / 30);
  assert.equal(g.pendingCards.find((c) => c.pickupAction === 'swap') != null, true);
  g.applyCard(g.pendingCards.find((c) => c.pickupAction === 'keep'));
  assert.equal(g.flash || 0, 0);
  assert.deepEqual(g.weaponSlots, before);
}

// ---- Level-up new weapon with category full → swap UI ----
{
  const g = new Game({ seed: 15 });
  g.applyCard(CARDS_BY_ID.laser); // P full with gatling
  g.applyCard(CARDS_BY_ID.vulcan); // deferred swap
  assert.equal(g.vulcan || 0, 0, 'level-up deferred to swap — no silent grant');
  assert.ok(g.pausedForLevel);
  assert.equal(g.pendingFrom, 'pickup');
  assert.ok(g.pendingCards.some((c) => c.pickupAction === 'swap'));
  const swap = g.pendingCards.find((c) => c.pickupAction === 'swap' && c.swapOut === 'ion_beam');
  g.applyCard(swap);
  assert.ok((g.vulcan || 0) >= 1);
  assert.ok(g.weaponSlots.includes('vulcan'));
  assert.ok(!g.weaponSlots.includes('ion_beam'));
}

// ---- only slotted weapons fire ----
{
  const g = new Game({ seed: 21 });
  g.applyCard(CARDS_BY_ID.laser);
  g.applyCard(CARDS_BY_ID.shotgun);
  g.plasma = 2;
  g.taken.plasma = 2;
  g.taken.acid_gun = 2;
  assert.ok(!g.weaponSlots.includes('plasma') && !g.weaponSlots.includes('acid_gun'));
  g._pruneUnslottedWeapons();
  assert.equal(g.plasma, 0, 'orphan plasma combat cleared');
  assert.equal(g.taken.plasma, undefined, 'orphan plasma taken cleared');

  g.plasma = 3;
  assert.equal(g._slotArmed('plasma'), false);
  assert.equal(g._slotArmed('acid_gun'), false);
  assert.equal(g._slotArmed('laser'), true);
  assert.equal(g._slotArmed('ion_beam'), true);
  assert.equal(g._slotArmed('mg'), true);
  assert.equal(g._slotArmed('gatling'), true);
}

// ---- convertHeal copy exposes heal amount (at max Lv5) ----
{
  const offer = buildWeaponPickupOffer('ion_beam', { ion_beam: 5, laser: 5 }, ['gatling', 'ion_beam', null, null, null, null]);
  assert.equal(offer.mode, 'max');
  const heal = offer.choices.find((c) => c.pickupAction === 'convertHeal');
  assert.ok(heal);
  assert.equal(heal.healAmount, 2);
  assert.ok(heal.zh.includes('+2'));
  assert.ok(heal.descZh.includes('2'));
  const keep = offer.choices.find((c) => c.pickupAction === 'keep');
  assert.ok(keep.zh.includes('繼續跑') || keep.zh.includes('唔要'));
}

console.log('inventory OK', {
  max: WEAPON_SLOT_MAX,
  start: emptyWeaponSlots(),
  modes: ['take', 'upgrade', 'max', 'swap', 'keep'],
});
