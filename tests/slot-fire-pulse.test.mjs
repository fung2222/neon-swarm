/**
 * PHASE6-SLOT-FIRE-PULSE-001 (v0.9.49)
 * Run: node tests/slot-fire-pulse.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { CARDS_BY_ID } from '../js/config.js';
import { slotIndexForWeapon, SLOT_FIRE_PULSE_MS } from '../js/slot-fire-pulse.js';

assert.equal(SLOT_FIRE_PULSE_MS, 140);
assert.ok(SLOT_FIRE_PULSE_MS >= 100 && SLOT_FIRE_PULSE_MS <= 220, 'pulse brief, not toast-long');

assert.equal(slotIndexForWeapon(['mg', 'laser', null, null], 'mg'), 0);
assert.equal(slotIndexForWeapon(['mg', 'laser', null, null], 'laser'), 1);
assert.equal(slotIndexForWeapon(['mg', 'laser', null, null], 'rocket'), -1);
assert.equal(slotIndexForWeapon(['mg', null, null, null], null), -1);
assert.equal(slotIndexForWeapon(null, 'mg'), -1);
assert.equal(slotIndexForWeapon(undefined, 'mg'), -1);
assert.equal(slotIndexForWeapon([], 'mg'), -1);

// Fire events carry weapon id that maps to HUD slot
{
  const g = new Game({ seed: 11 });
  g.applyCard(CARDS_BY_ID.laser);
  g.applyCard(CARDS_BY_ID.shotgun);
  assert.deepEqual(g.weaponSlots, ['mg', 'laser', 'shotgun', null]);

  // spawn nearby fodder so weapons can acquire
  for (let i = 0; i < 6; i++) {
    g.enemies.push({
      id: 9000 + i, kind: 'staffer', x: g.px + 2 + i * 0.3, z: g.pz + 1,
      hp: 40, maxHp: 40, r: 0.45, speed: 0, alive: true, score: 1,
    });
  }
  const seen = new Set();
  for (let n = 0; n < 90; n++) {
    const { events } = g.step(1 / 60);
    for (const ev of events) {
      if (ev.type !== 'fire' || !ev.weapon) continue;
      const idx = slotIndexForWeapon(g.weaponSlots, ev.weapon);
      assert.ok(idx >= 0, `fired weapon ${ev.weapon} must be in slots`);
      assert.equal(g.weaponSlots[idx], ev.weapon);
      seen.add(ev.weapon);
    }
  }
  assert.ok(seen.has('mg'), 'mg should fire');
  // laser/shotgun may or may not fire in 90 frames depending on CD — at least mapping works for any that did
  for (const w of seen) {
    assert.ok(g.weaponSlots.includes(w));
  }
}

// Orphan weapon not in slots → index -1 (no pulse)
{
  const g = new Game({ seed: 13 });
  assert.equal(slotIndexForWeapon(g.weaponSlots, 'plasma'), -1);
}

console.log('slot-fire-pulse.test.mjs: PASS');
