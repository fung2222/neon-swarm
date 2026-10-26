/**
 * Phase 6 multi-slot inventory (v0.9.28).
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
} from '../js/config.js';

assert.equal(WEAPON_SLOT_MAX, 4);
assert.ok(isSlotWeapon('mg') && isSlotWeapon('laser') && !isSlotWeapon('dmg'));
assert.deepEqual(emptyWeaponSlots(), ['mg', null, null, null]);
assert.ok(hasEmptyWeaponSlot(emptyWeaponSlots()));
assert.equal(weaponSlotLevel('mg', {}), 1);
assert.equal(weaponSlotLevel('mg', { dmg: 2 }), 2);
assert.equal(weaponSlotLevel('laser', { laser: 3 }), 3);

// ---- Start loadout: slot0 = mg ----
{
  const g = new Game({ seed: 1 });
  assert.deepEqual(g.weaponSlots, ['mg', null, null, null]);
  assert.equal(g.weaponSlots.filter(Boolean).length, 1);
}

// ---- Take fills next empty slot ----
{
  const g = new Game({ seed: 3 });
  g.applyCard(CARDS_BY_ID.laser);
  assert.equal(g.laser, 1);
  assert.equal(g.taken.laser, 1);
  assert.deepEqual(g.weaponSlots, ['mg', 'laser', null, null]);

  g.applyCard(CARDS_BY_ID.shotgun);
  assert.deepEqual(g.weaponSlots, ['mg', 'laser', 'shotgun', null]);

  g.applyCard(CARDS_BY_ID.rocket);
  assert.deepEqual(g.weaponSlots, ['mg', 'laser', 'shotgun', 'rocket']);
  assert.ok(!hasEmptyWeaponSlot(g.weaponSlots));
}

// ---- Upgrade bumps stacks, does not duplicate slot ----
{
  const g = new Game({ seed: 5 });
  g.applyCard(CARDS_BY_ID.laser);
  g.applyCard(CARDS_BY_ID.laser);
  assert.equal(g.taken.laser, 2);
  assert.equal(g.laser, 2);
  assert.deepEqual(g.weaponSlots, ['mg', 'laser', null, null]);
}

// ---- Modifiers (dmg) do not take a slot ----
{
  const g = new Game({ seed: 7 });
  g.applyCard(CARDS_BY_ID.dmg);
  assert.equal(g.taken.dmg, 1);
  assert.deepEqual(g.weaponSlots, ['mg', null, null, null]);
}

// ---- Pickup take fills slot ----
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
  assert.equal(g.grenade, 1);
  assert.ok(g.weaponSlots.includes('grenade'));
}

// ---- Full slots + new type → swap offer (never silent) ----
{
  const slots = ['mg', 'laser', 'shotgun', 'rocket'];
  const offer = buildWeaponPickupOffer('plasma', { laser: 1, shotgun: 1, rocket: 1 }, slots);
  assert.equal(offer.mode, 'swap');
  assert.ok(offer.choices.every((c) => c.pickupAction !== 'take'));
  assert.ok(offer.choices.some((c) => c.pickupAction === 'swap' && c.swapOut === 'laser'));
  assert.ok(offer.choices.some((c) => c.pickupAction === 'keep'));
}

{
  const g = new Game({ seed: 11 });
  g.applyCard(CARDS_BY_ID.laser);
  g.applyCard(CARDS_BY_ID.shotgun);
  g.applyCard(CARDS_BY_ID.rocket);
  assert.ok(!hasEmptyWeaponSlot(g.weaponSlots));

  g.gems.push({
    x: g.px, z: g.pz, xp: 0, r: 0.22, life: 22, pop: 0, letter: 'W',
    kind: 'weapon', weapon: 'plasma',
  });
  const { events } = g.step(1 / 30);
  const offerEv = events.find((e) => e.type === 'weaponOffer');
  assert.ok(offerEv);
  assert.equal(offerEv.mode, 'swap');
  assert.ok(g.pausedForLevel);
  assert.equal(g.plasma, 0, 'must not grant before swap choice');

  const swap = g.pendingCards.find((c) => c.pickupAction === 'swap' && c.swapOut === 'shotgun');
  assert.ok(swap, 'swap shotgun choice');
  g.applyCard(swap);
  assert.equal(g.plasma, 1);
  assert.equal(g.shotgun, 0, 'swapped-out shotgun cleared');
  assert.equal(g.taken.shotgun, undefined);
  assert.ok(g.weaponSlots.includes('plasma'));
  assert.ok(!g.weaponSlots.includes('shotgun'));
  assert.ok(g.weaponSlots.includes('mg'), 'mg stays');
  assert.equal(g.pausedForLevel, false);
}

// ---- Keep on full inventory ----
{
  const g = new Game({ seed: 13 });
  g.applyCard(CARDS_BY_ID.laser);
  g.applyCard(CARDS_BY_ID.shotgun);
  g.applyCard(CARDS_BY_ID.rocket);
  g.gems.push({
    x: g.px, z: g.pz, xp: 0, r: 0.22, life: 22, pop: 0, letter: 'W',
    kind: 'weapon', weapon: 'grenade',
  });
  g.step(1 / 30);
  assert.equal(g.pendingCards.find((c) => c.pickupAction === 'swap') != null, true);
  g.applyCard(g.pendingCards.find((c) => c.pickupAction === 'keep'));
  assert.equal(g.grenade, 0);
  assert.deepEqual(g.weaponSlots, ['mg', 'laser', 'shotgun', 'rocket']);
}

// ---- Level-up new weapon with full slots → swap UI (not silent) ----
{
  const g = new Game({ seed: 15 });
  g.applyCard(CARDS_BY_ID.laser);
  g.applyCard(CARDS_BY_ID.shotgun);
  g.applyCard(CARDS_BY_ID.rocket);
  g.applyCard(CARDS_BY_ID.grenade); // deferred: should open swap, not add 5th
  assert.equal(g.grenade, 0, 'level-up deferred to swap — no silent grant');
  assert.ok(g.pausedForLevel);
  assert.equal(g.pendingFrom, 'pickup');
  assert.ok(g.pendingCards.some((c) => c.pickupAction === 'swap'));
  const swap = g.pendingCards.find((c) => c.pickupAction === 'swap' && c.swapOut === 'rocket');
  g.applyCard(swap);
  assert.equal(g.grenade, 1);
  assert.equal(g.rocket, 0);
  assert.ok(g.weaponSlots.includes('grenade'));
  assert.ok(!g.weaponSlots.includes('rocket'));
}


// ---- v0.9.29: only slotted weapons fire (orphan stacks pruned / gated) ----
{
  const g = new Game({ seed: 21 });
  g.applyCard(CARDS_BY_ID.laser);
  g.applyCard(CARDS_BY_ID.shotgun);
  g.applyCard(CARDS_BY_ID.rocket);
  // Simulate pre-slot orphan: plasma combat prop + taken without a slot
  g.plasma = 2;
  g.taken.plasma = 2;
  assert.ok(!g.weaponSlots.includes('plasma'));
  g._pruneUnslottedWeapons();
  assert.equal(g.plasma, 0, 'orphan plasma combat cleared');
  assert.equal(g.taken.plasma, undefined, 'orphan plasma taken cleared');

  // Gate: even if combat prop sneaks back, unslotted must not arm
  g.plasma = 3;
  assert.equal(g._slotArmed('plasma'), false);
  assert.equal(g._slotArmed('laser'), true);
  assert.equal(g._slotArmed('mg'), true);
}

// ---- convertHeal copy exposes heal amount ----
{
  const offer = buildWeaponPickupOffer('laser', { laser: 4 }, ['mg', 'laser', null, null]);
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
