/**
 * WEAPONS-CATALOG-FIRE-LIVE-001 (v0.9.75)
 * Docs stub "Other catalog fire" → live: all 14 have exemplar:true + behavior wired in logic.js.
 * No full ult invent / BALANCE-PASS / Phase4.
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { WEAPON_CATALOG, ALL_WEAPON_IDS } from '../js/config.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const logic = readFileSync(new URL('../js/logic.js', import.meta.url), 'utf8');
const weapons = readFileSync(new URL('../js/weapons.js', import.meta.url), 'utf8');
const weapDoc = readFileSync(new URL('../docs/WEAPONS.md', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(75|[8-9]\d)/.test(html) || /\?v=0\.9\.7[5-9]/.test(html), 'cache-bust ≥0.9.75');
assert.ok(agent.includes('WEAPONS-CATALOG-FIRE-LIVE-001') || agent.includes('0.9.75'), 'AGENT_TASK');
assert.ok(weapons.includes('WEAPONS-CATALOG-FIRE-LIVE-001') || weapons.includes('all 14 live'), 'weapons.js note');
assert.ok(weapDoc.includes('Other catalog fire') && /Other catalog fire \|\s*\*\*live\*\*/.test(weapDoc), 'WEAPONS stub→live');

assert.equal(ALL_WEAPON_IDS.length, 14);
const expectedBehaviors = {
  gatling: 'mg',
  ion_beam: 'ion_charge',
  tracking_bomb: 'track_stick',
  vulcan: 'vulcan',
  zero_laser: 'zero_bolts',
  acid_gun: 'acid_stream',
  shotgun: 'shotgun',
  slow_gun: 'slow_rush',
  attack_drone: 'deploy_drones',
  blackhole: 'blackhole_pull',
  frag: 'grenade',
  chill: 'chill_field',
  flash: 'flashbang',
  gravity: 'gravity_pull',
};
for (const id of ALL_WEAPON_IDS) {
  const d = WEAPON_CATALOG[id];
  assert.ok(d, 'def ' + id);
  assert.equal(d.exemplar, true, id + ' exemplar');
  assert.equal(d.behavior, expectedBehaviors[id], id + ' behavior');
  // behavior string appears in logic fire paths
  assert.ok(logic.includes("'" + d.behavior + "'") || logic.includes('"' + d.behavior + '"'), id + ' behavior in logic');
}

console.log('weapons-catalog-fire-live.test.mjs: PASS', { n: ALL_WEAPON_IDS.length });
