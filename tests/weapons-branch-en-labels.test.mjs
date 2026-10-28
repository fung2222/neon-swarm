/**
 * WEAPONS-BRANCH-EN-LABELS-001 (v0.9.80)
 * Every catalog weapon has branchNamesEn; branchOptions.en is not stub PATH A.
 * No full ult invent / BALANCE-PASS.
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { WEAPON_CATALOG, branchOptions, weaponDef } from '../js/weapons.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const weaponsSrc = readFileSync(new URL('../js/weapons.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const wdoc = readFileSync(new URL('../docs/WEAPONS.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(80|[8-9]\d)/.test(html) || /\?v=0\.9\.80/.test(html), 'cache-bust ≥0.9.80');
assert.ok(weaponsSrc.includes('WEAPONS-BRANCH-EN-LABELS-001'), 'ship id in weapons.js');
assert.ok(agent.includes('WEAPONS-BRANCH-EN-LABELS-001') || agent.includes('0.9.80'), 'AGENT_TASK');
assert.ok(wdoc.includes('Branch naming stubs (secondary)'), 'WEAPONS sec naming table');
assert.ok(wdoc.includes('Branch naming stubs (throw)'), 'WEAPONS throw naming table');

const ids = Object.keys(WEAPON_CATALOG);
assert.ok(ids.length >= 14, 'catalog size');
for (const id of ids) {
  const d = weaponDef(id);
  assert.ok(Array.isArray(d.branchNames) && d.branchNames.length >= 2, id + ' branchNames');
  assert.ok(Array.isArray(d.branchNamesEn) && d.branchNamesEn.length === d.branchNames.length, id + ' branchNamesEn');
  const opts = branchOptions(id);
  assert.ok(opts.length === d.branchNames.length, id + ' options len');
  for (const o of opts) {
    assert.ok(o.en && !/^PATH [A-C]$/.test(o.en), id + ' en not PATH stub: ' + o.en);
    assert.ok(o.en === d.branchNamesEn[o.index], id + ' en matches branchNamesEn');
  }
}

console.log('weapons-branch-en-labels.test.mjs: PASS', ids.length);
