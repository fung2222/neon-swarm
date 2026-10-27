/**
 * WEAPONS-REDESIGN-001 catalog / branch stubs.
 * Run: node tests/weapons-catalog.test.mjs
 */
import assert from 'assert';
import {
  WEAPON_CATALOG, PRIMARY_IDS, SECONDARY_IDS, THROW_IDS, ALL_WEAPON_IDS,
  LOADOUT_CAPS, ultimateIdStubs, weaponDef, normalizeWeaponId,
} from '../js/config.js';

assert.equal(PRIMARY_IDS.length, 5);
assert.equal(SECONDARY_IDS.length, 5);
assert.equal(THROW_IDS.length, 4);
assert.equal(ALL_WEAPON_IDS.length, 14);
assert.deepEqual(LOADOUT_CAPS, { primary: 2, secondary: 2, throw: 2, total: 6 });

const zhPrimary = ['機關雷射炮', '離子光束', '追蹤爆彈', '火神', '零度激光'];
const zhSecondary = ['硫酸槍', '散彈槍', '緩速槍', '攻擊兵衛', '黑洞炮'];
const zhThrow = ['破片榴彈', '冷卻彈', '閃光彈', '重力彈'];
assert.deepEqual(PRIMARY_IDS.map((id) => WEAPON_CATALOG[id].zh), zhPrimary);
assert.deepEqual(SECONDARY_IDS.map((id) => WEAPON_CATALOG[id].zh), zhSecondary);
assert.deepEqual(THROW_IDS.map((id) => WEAPON_CATALOG[id].zh), zhThrow);

for (const id of PRIMARY_IDS) {
  const d = WEAPON_CATALOG[id];
  assert.equal(d.maxLv, 5);
  assert.equal(d.branches, 3);
  assert.equal(d.ultsPerBranch, 2);
  assert.equal(ultimateIdStubs(id).length, 6);
  assert.ok(Array.isArray(d.counters) && d.counters.length >= 1);
  assert.ok(d.base && d.base.hit > 0);
}
for (const id of SECONDARY_IDS) {
  const d = WEAPON_CATALOG[id];
  assert.equal(d.maxLv, 5);
  assert.equal(d.branches, 2);
  assert.equal(d.ultsPerBranch, 0);
  assert.ok(d.resource);
  assert.equal(ultimateIdStubs(id).length, 0);
}
for (const id of THROW_IDS) {
  const d = WEAPON_CATALOG[id];
  assert.equal(d.maxLv, 5);
  assert.equal(d.branches, 2);
}

assert.equal(normalizeWeaponId('mg'), 'gatling');
assert.equal(normalizeWeaponId('laser'), 'ion_beam');
assert.equal(normalizeWeaponId('rocket'), 'tracking_bomb');
assert.equal(normalizeWeaponId('grenade'), 'frag');
assert.equal(normalizeWeaponId('plasma'), 'acid_gun');
assert.equal(weaponDef('shotgun').category, 'secondary');

const exemplars = ALL_WEAPON_IDS.filter((id) => WEAPON_CATALOG[id].exemplar);
assert.ok(exemplars.includes('gatling'));
assert.ok(exemplars.includes('ion_beam'));
assert.ok(exemplars.includes('shotgun'));
assert.ok(exemplars.includes('acid_gun'));
assert.ok(exemplars.includes('frag'));

console.log('weapons-catalog OK', { ids: ALL_WEAPON_IDS.length, exemplars });
