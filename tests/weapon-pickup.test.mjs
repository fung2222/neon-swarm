/**
 * Phase 6 weapon pickup choice — catalog ids (v0.9.58 legacy purge).
 * Legacy crate ids (laser/…) still normalize to catalog cards.
 * Run: node tests/weapon-pickup.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { CARDS, CARDS_BY_ID, buildWeaponPickupOffer, cardExhausted, pickCards } from '../js/config.js';

assert.ok(!CARDS_BY_ID.laser && !CARDS_BY_ID.rocket && !CARDS_BY_ID.grenade && !CARDS_BY_ID.plasma,
  'legacy unlock cards purged from CARDS');
const ion = CARDS_BY_ID.ion_beam;
assert.ok(ion && ion.max === 5 && ion.zh === '離子光束', 'ion_beam catalog card');

// ---- Helper: pure offer builder (catalog id) ----
{
  const notOwned = buildWeaponPickupOffer('ion_beam', {});
  assert.equal(notOwned.mode, 'take');
  assert.equal(notOwned.stacks, 0);
  assert.ok(notOwned.choices.some((c) => c.pickupAction === 'take' && c.id === 'ion_beam'));
  assert.ok(notOwned.choices.some((c) => c.pickupAction === 'keep'));
  assert.equal(notOwned.choices.length, 2);

  const owned = buildWeaponPickupOffer('ion_beam', { ion_beam: 2 });
  assert.equal(owned.mode, 'upgrade');
  assert.ok(owned.choices.some((c) => c.pickupAction === 'upgrade'));

  const atMax = buildWeaponPickupOffer('ion_beam', { ion_beam: 5 });
  assert.equal(atMax.mode, 'max');
  assert.ok(atMax.atMax);
  assert.ok(atMax.choices.some((c) => c.pickupAction === 'convertHeal'));
  assert.ok(!atMax.choices.some((c) => c.id === 'ion_beam'), 'no stack at max');

  // Legacy alias crate id still resolves to catalog card copy
  const legacy = buildWeaponPickupOffer('laser', {});
  assert.ok(legacy, 'laser alias resolves');
  assert.equal(legacy.mode, 'take');
  assert.equal(legacy.choices.find((c) => c.pickupAction === 'take').id, 'ion_beam');
  assert.equal(legacy.choices.find((c) => c.pickupAction === 'take').zh.includes('離子') || legacy.choices.find((c) => c.pickupAction === 'take').zh.includes('裝上'), true);

  assert.equal(buildWeaponPickupOffer('nope', {}), null);
  assert.equal(buildWeaponPickupOffer('armor', {}), null, 'armor is not a weapon crate');
}

// ---- Not owned: take grants via taken path ----
{
  const g = new Game({ seed: 7 });
  assert.equal(g.ion_beam || 0, 0);
  g.gems.push({
    x: g.px, z: g.pz, xp: 0, r: 0.22, life: 22, pop: 0, letter: 'W',
    kind: 'weapon', weapon: 'ion_beam',
  });
  const { events } = g.step(1 / 30);
  const offer = events.find((e) => e.type === 'weaponOffer');
  assert.ok(offer, 'weaponOffer event');
  assert.equal(offer.mode, 'take');
  assert.equal(g.ion_beam || 0, 0, 'must not grant before choice');
  const take = g.pendingCards.find((c) => c.pickupAction === 'take');
  g.applyCard(take);
  assert.ok((g.ion_beam || 0) >= 1);
  assert.equal(g.taken.ion_beam, 1);
}

// ---- Legacy laser gem → ion_beam ----
{
  const g = new Game({ seed: 8 });
  g.gems.push({
    x: g.px, z: g.pz, xp: 0, r: 0.22, life: 22, pop: 0, letter: 'W',
    kind: 'weapon', weapon: 'laser',
  });
  g.step(1 / 30);
  const take = g.pendingCards.find((c) => c.pickupAction === 'take');
  assert.ok(take);
  assert.equal(take.id, 'ion_beam');
  assert.ok(take.zh.includes('離子') || take.zh.includes('裝上'));
  g.applyCard(take);
  assert.ok((g.ion_beam || 0) >= 1 || (g.laser || 0) >= 1);
}

// ---- Owned upgrade ----
{
  const g = new Game({ seed: 9 });
  g.applyCard(ion);
  assert.equal(g.taken.ion_beam, 1);
  g.gems.push({
    x: g.px, z: g.pz, xp: 0, r: 0.22, life: 22, pop: 0, letter: 'W',
    kind: 'weapon', weapon: 'ion_beam',
  });
  g.step(1 / 30);
  const before = g.ion_beam;
  g.applyCard(g.pendingCards.find((c) => c.pickupAction === 'keep'));
  assert.equal(g.ion_beam, before);
  assert.equal(g.taken.ion_beam, 1);

  g.gems.push({
    x: g.px, z: g.pz, xp: 0, r: 0.22, life: 22, pop: 0, letter: 'W',
    kind: 'weapon', weapon: 'ion_beam',
  });
  g.step(1 / 30);
  g.applyCard(g.pendingCards.find((c) => c.pickupAction === 'upgrade'));
  assert.equal(g.taken.ion_beam, 2);
}

// ---- At max → convertHeal ----
{
  const g = new Game({ seed: 11 });
  // Seed stacks + slot without walking branch/ult offer queue
  g.ion_beam = ion.max;
  g.laser = ion.max;
  g.taken.ion_beam = ion.max;
  g.loadout.primary[1] = 'ion_beam';
  g.weaponSlots = ['gatling', 'ion_beam', null, null, null, null];
  g.weaponBranches = { ion_beam: 'A' };
  g.weaponUlts = { ion_beam: 'U1' };
  assert.ok(cardExhausted(ion, g.taken));
  g.gems.push({
    x: g.px, z: g.pz, xp: 0, r: 0.22, life: 22, pop: 0, letter: 'W',
    kind: 'weapon', weapon: 'ion_beam',
  });
  g.step(1 / 30);
  assert.ok(g.pendingCards && g.pendingCards.some((c) => c.pickupAction === 'convertHeal'),
    'expected convertHeal, got ' + JSON.stringify(g.pendingCards && g.pendingCards.map((c) => c.pickupAction)));
  assert.equal(g.taken.ion_beam, ion.max, 'no silent stack bump');
  g.applyCard(g.pendingCards.find((c) => c.pickupAction === 'keep'));
  assert.equal(g.taken.ion_beam, ion.max);
}

// ---- Slots-aware take / upgrade ----
{
  const take = buildWeaponPickupOffer('ion_beam', {}, ['gatling', null, null, null, null, null]);
  assert.equal(take.mode, 'take');
  const up = buildWeaponPickupOffer('ion_beam', { ion_beam: 1 }, ['gatling', 'ion_beam', null, null, null, null]);
  assert.equal(up.mode, 'upgrade');
}

// ---- pickCards never offers purged legacy titles ----
{
  const seen = new Set();
  let rngState = 1;
  const rng = () => { rngState = (rngState * 1664525 + 1013904223) >>> 0; return (rngState >>> 0) / 0xffffffff; };
  for (let i = 0; i < 80; i++) {
    for (const c of pickCards(rng, 3, {})) seen.add(c.id);
  }
  for (const bad of ['laser', 'rocket', 'grenade', 'plasma']) {
    assert.ok(!seen.has(bad), 'pickCards must not offer ' + bad);
  }
  assert.ok(seen.has('ion_beam') || seen.has('gatling'), 'catalog weapons appear');
  const bannedNames = [/鐳射炮/, /火箭炮/, /^電漿/, /手榴彈／迫擊/];
  for (const c of CARDS) {
    for (const re of bannedNames) {
      assert.ok(!re.test(c.zh || ''), 'banned zh on ' + c.id + ': ' + c.zh);
    }
  }
}

console.log('weapon-pickup.test.mjs: PASS');
