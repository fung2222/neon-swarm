/**
 * Phase 6 weapon pickup choice — no silent overwrite (v0.9.11).
 * Run: node tests/weapon-pickup.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { CARDS, CARDS_BY_ID, buildWeaponPickupOffer, cardExhausted } from '../js/config.js';

const laser = CARDS_BY_ID.laser;
assert.ok(laser && laser.max === 5, 'laser card');

// ---- Helper: pure offer builder ----
{
  const notOwned = buildWeaponPickupOffer('laser', {});
  assert.equal(notOwned.mode, 'take');
  assert.equal(notOwned.stacks, 0);
  assert.ok(notOwned.choices.some((c) => c.pickupAction === 'take' && c.id === 'laser'));
  assert.ok(notOwned.choices.some((c) => c.pickupAction === 'keep'));
  assert.equal(notOwned.choices.length, 2);

  const owned = buildWeaponPickupOffer('laser', { laser: 2 });
  assert.equal(owned.mode, 'upgrade');
  assert.ok(owned.choices.some((c) => c.pickupAction === 'upgrade'));
  assert.ok(owned.choices.some((c) => c.pickupAction === 'keep'));

  const atMax = buildWeaponPickupOffer('laser', { laser: 5 });
  assert.equal(atMax.mode, 'max');
  assert.ok(atMax.atMax);
  assert.ok(atMax.choices.some((c) => c.pickupAction === 'convertHeal'));
  assert.ok(atMax.choices.some((c) => c.pickupAction === 'keep'));
  assert.ok(!atMax.choices.some((c) => c.id === 'laser'), 'must not offer another laser stack at max');

  assert.equal(buildWeaponPickupOffer('nope', {}), null);
  assert.equal(buildWeaponPickupOffer('armor', {}), null, 'armor is not a weapon crate');
}

// ---- Not owned: take grants via taken path ----
{
  const g = new Game({ seed: 7 });
  assert.equal(g.laser, 0);
  assert.equal(g.taken.laser || 0, 0);
  g.gems.push({
    x: g.px, z: g.pz, xp: 0, r: 0.22, life: 22, pop: 0, letter: 'W',
    kind: 'weapon', weapon: 'laser',
  });
  const { events } = g.step(1 / 30);
  const offer = events.find((e) => e.type === 'weaponOffer');
  const level = events.find((e) => e.type === 'levelup' && e.from === 'pickup');
  assert.ok(offer, 'weaponOffer event');
  assert.equal(offer.mode, 'take');
  assert.ok(level, 'levelup from pickup');
  assert.ok(g.pausedForLevel, 'run paused until choice');
  assert.equal(g.pendingFrom, 'pickup');
  assert.equal(g.laser, 0, 'must not grant before choice');
  assert.equal(g.taken.laser || 0, 0, 'must not touch taken before choice');

  const take = g.pendingCards.find((c) => c.pickupAction === 'take');
  g.applyCard(take);
  assert.equal(g.laser, 1);
  assert.equal(g.taken.laser, 1);
  assert.equal(g.pausedForLevel, false);
  assert.equal(g.pendingCards, null);
}

// ---- Owned below max: upgrade vs keep ----
{
  const g = new Game({ seed: 9 });
  g.applyCard(laser);
  assert.equal(g.taken.laser, 1);
  g.gems.push({
    x: g.px, z: g.pz, xp: 0, r: 0.22, life: 22, pop: 0, letter: 'W',
    kind: 'weapon', weapon: 'laser',
  });
  const { events } = g.step(1 / 30);
  const offer = events.find((e) => e.type === 'weaponOffer');
  assert.equal(offer.mode, 'upgrade');
  const before = g.laser;
  // Keep: no stack change
  const keep = g.pendingCards.find((c) => c.pickupAction === 'keep');
  g.applyCard(keep);
  assert.equal(g.laser, before);
  assert.equal(g.taken.laser, 1);
  assert.equal(g.taken._pickup_keep, undefined, 'keep must not pollute taken');
  assert.equal(g.pausedForLevel, false);
}

{
  const g = new Game({ seed: 11 });
  g.applyCard(laser);
  g.gems.push({
    x: g.px, z: g.pz, xp: 0, r: 0.22, life: 22, pop: 0, letter: 'W',
    kind: 'weapon', weapon: 'laser',
  });
  g.step(1 / 30);
  const up = g.pendingCards.find((c) => c.pickupAction === 'upgrade');
  g.applyCard(up);
  assert.equal(g.laser, 2);
  assert.equal(g.taken.laser, 2);
}

// ---- At max: keep / convertHeal — never silent grant ----
{
  const g = new Game({ seed: 13 });
  for (let i = 0; i < laser.max; i++) g.applyCard(laser);
  assert.equal(g.taken.laser, laser.max);
  assert.ok(cardExhausted(laser, g.taken));
  g.hp = Math.max(1, g.maxHp - 4);
  const hpBefore = g.hp;
  g.gems.push({
    x: g.px, z: g.pz, xp: 0, r: 0.22, life: 22, pop: 0, letter: 'W',
    kind: 'weapon', weapon: 'laser',
  });
  const { events } = g.step(1 / 30);
  const offer = events.find((e) => e.type === 'weaponOffer');
  assert.equal(offer.mode, 'max');
  assert.ok(g.pausedForLevel, 'at-max still pauses with UI');
  assert.equal(g.taken.laser, laser.max, 'no silent stack bump');

  const heal = g.pendingCards.find((c) => c.pickupAction === 'convertHeal');
  g.applyCard(heal);
  assert.equal(g.taken.laser, laser.max);
  assert.equal(g.taken._pickup_heal, undefined);
  assert.equal(g.hp, Math.min(g.maxHp, hpBefore + 2));
  assert.equal(g.pausedForLevel, false);
}

{
  const g = new Game({ seed: 15 });
  for (let i = 0; i < laser.max; i++) g.applyCard(laser);
  g.gems.push({
    x: g.px, z: g.pz, xp: 0, r: 0.22, life: 22, pop: 0, letter: 'W',
    kind: 'weapon', weapon: 'laser',
  });
  g.step(1 / 30);
  const keep = g.pendingCards.find((c) => c.pickupAction === 'keep');
  g.applyCard(keep);
  assert.equal(g.taken.laser, laser.max);
  assert.equal(g.pausedForLevel, false);
}

// ---- While already paused for level-up, weapon crate stays on ground ----
{
  const g = new Game({ seed: 17 });
  g._levelUp();
  assert.ok(g.pausedForLevel);
  const n0 = g.gems.length;
  g.gems.push({
    x: g.px, z: g.pz, xp: 0, r: 0.22, life: 22, pop: 0, letter: 'W',
    kind: 'weapon', weapon: 'shotgun',
  });
  // step early-outs while paused — gem untouched
  const { events } = g.step(1 / 30);
  assert.equal(events.length, 0);
  assert.equal(g.gems.length, n0 + 1);
  assert.ok(g.gems.some((x) => x.kind === 'weapon'));
}

// ---- Uncapped weapon (dmg) take still works ----
{
  const g = new Game({ seed: 19 });
  g.gems.push({
    x: g.px, z: g.pz, xp: 0, r: 0.22, life: 22, pop: 0, letter: 'W',
    kind: 'weapon', weapon: 'dmg',
  });
  const before = g.bulletDmg;
  g.step(1 / 30);
  assert.equal(g.pendingFrom, 'pickup');
  const take = g.pendingCards.find((c) => c.pickupAction === 'take');
  g.applyCard(take);
  assert.equal(g.taken.dmg, 1);
  assert.ok(Math.abs(g.bulletDmg - (before + 0.35)) < 1e-9);
}


// ---- v0.9.29 copy polish: take / upgrade / keep phrasing ----
{
  const take = buildWeaponPickupOffer('laser', {}, ['mg', null, null, null]);
  assert.equal(take.mode, 'take');
  const t = take.choices.find((c) => c.pickupAction === 'take');
  assert.ok(t.zh.startsWith('裝上'), t.zh);
  const k = take.choices.find((c) => c.pickupAction === 'keep');
  assert.ok(k.descZh.includes('恢復戰鬥'), k.descZh);

  const up = buildWeaponPickupOffer('laser', { laser: 1 }, ['mg', 'laser', null, null]);
  assert.equal(up.mode, 'upgrade');
  const u = up.choices.find((c) => c.pickupAction === 'upgrade');
  assert.ok(u.zh.includes('升級') && u.zh.includes('Lv1→2'), u.zh);
}

console.log('weapon-pickup OK', {
  cards: CARDS.filter((c) => c.kind === 'weapon').length,
  modes: ['take', 'upgrade', 'max', 'keep'],
});
