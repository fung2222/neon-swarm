/**
 * WEAPONS-REDESIGN-001 loadout helpers + Game select/fire modes.
 * Run: node tests/weapons-loadout.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import {
  starterLoadout, flattenLoadout, addToLoadout, emptyLoadout,
  initialResource, CARDS_BY_ID,
} from '../js/config.js';
import { slotIndexForWeapon as pulseIndex } from '../js/slot-fire-pulse.js';

const L = starterLoadout();
assert.deepEqual(flattenLoadout(L), ['gatling', null, null, null, null, null]);
assert.equal(addToLoadout(L, 'ion_beam'), 1);
assert.equal(addToLoadout(L, 'shotgun'), 0);
assert.equal(addToLoadout(L, 'frag'), 0);
assert.equal(addToLoadout(L, 'vulcan'), -1, 'primary full');
assert.deepEqual(flattenLoadout(L), ['gatling', 'ion_beam', 'shotgun', null, 'frag', null]);

const res = initialResource('shotgun');
assert.equal(res.type, 'ammo');
assert.equal(res.max, 8);
assert.equal(res.current, 8);
assert.equal(initialResource('gatling'), null);

{
  const g = new Game({ seed: 42 });
  g.applyCard(CARDS_BY_ID.ion_beam);
  g.applyCard(CARDS_BY_ID.shotgun);
  g.applyCard(CARDS_BY_ID.frag);
  assert.equal(g.fireMode, 'primary');
  assert.equal(g.activePrimaryId(), 'gatling');

  // select secondary tile (flat index 2)
  assert.equal(g.selectWeaponTile(2), true);
  assert.equal(g.fireMode, 'secondary');
  assert.equal(g.activeSecondaryId(), 'shotgun');
  assert.ok(g.weaponResources.shotgun);
  assert.ok(g.weaponResources.shotgun.current > 0);

  // drain secondary → auto back
  g.weaponResources.shotgun.current = 0;
  g._tickWeapons(0.016, []);
  assert.equal(g.fireMode, 'primary');

  // throw tap
  assert.equal(g.selectWeaponTile(4), true);
  assert.equal(g._throwRequest, 'frag');
  g._throwRequest = null;
  assert.equal(g.requestThrow('frag'), true);
  assert.equal(g._throwRequest, 'frag');

  // switch primary to ion_beam (index 1)
  assert.equal(g.selectWeaponTile(1), true);
  assert.equal(g.fireMode, 'primary');
  assert.equal(g.activePrimaryId(), 'ion_beam');
}

assert.equal(pulseIndex(['gatling', 'ion_beam', null, null, null, null], 'mg'), 0);
assert.equal(pulseIndex(['gatling', 'ion_beam', null, null, null, null], 'laser'), 1);
assert.equal(pulseIndex(['gatling', null, 'shotgun', null, null, null], 'shotgun'), 2);

console.log('weapons-loadout OK');
