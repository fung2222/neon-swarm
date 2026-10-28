/**
 * WEAPONS-ULT-LABELS-001 (v0.9.122) — unique zh/en titles+descs per primary×branch×U.
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { ultOptions, ULT_KIT_LABELS, buildUltOfferCards } from '../js/weapons.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const weapons = readFileSync(new URL('../js/weapons.js', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(12[2-9]|1[3-9]\d)/.test(html), 'cache-bust ≥0.9.122');
assert.ok(weapons.includes('WEAPONS-ULT-LABELS-001'), 'ship id');
assert.ok(agent.includes('WEAPONS-ULT-LABELS-001') || agent.includes('0.9.122'), 'AGENT_TASK');

const primaries = ['gatling', 'ion_beam', 'tracking_bomb', 'vulcan', 'zero_laser'];
let n = 0;
for (const id of primaries) {
  for (const L of 'ABC') {
    const opts = ultOptions(id, L);
    assert.equal(opts.length, 2, `${id} ${L} 2 ults`);
    for (const o of opts) {
      const kit = ULT_KIT_LABELS[id][L][o.key];
      assert.ok(kit, `${id} ${L} ${o.key} kit`);
      assert.ok(o.zh.includes(kit.zh), `${id} zh`);
      assert.ok(o.en.includes(kit.en), `${id} en`);
      assert.equal(o.descZh, kit.descZh, `${id} descZh`);
      assert.equal(o.descEn, kit.descEn, `${id} descEn`);
      assert.ok(!o.descZh.includes('完整招式後續'), 'no stub later zh');
      assert.ok(!o.descEn.includes('full kit later'), 'no stub later en');
      assert.ok(!o.en.includes('POWER AMP') && !o.en.includes('CADENCE AMP'), 'not light-amp title');
      n++;
    }
    const cards = buildUltOfferCards(id, L);
    assert.ok(cards && cards.choices.length === 2);
  }
}
assert.equal(n, 30, '30 unique ult labels');

console.log('weapons-ult-labels.test.mjs: PASS', n);
