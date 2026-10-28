/**
 * WEAPONS-ULT-EN-LABELS-001 (v0.9.82)
 * U1/U2 use light-amp labels (POWER/CADENCE AMP); no FORM I stub; no full ult invent.
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { ultOptions, ULT_STUB_LABELS } from '../js/weapons.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const weapons = readFileSync(new URL('../js/weapons.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const wdoc = readFileSync(new URL('../docs/WEAPONS.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(82|[8-9]\d)/.test(html) || /\?v=0\.9\.8[2-9]/.test(html), 'cache-bust ≥0.9.82');
assert.ok(weapons.includes('WEAPONS-ULT-EN-LABELS-001'), 'ship id');
assert.ok(agent.includes('WEAPONS-ULT-EN-LABELS-001') || agent.includes('0.9.82'), 'AGENT_TASK');
assert.strictEqual(ULT_STUB_LABELS.U1.en, 'POWER AMP');
assert.strictEqual(ULT_STUB_LABELS.U2.en, 'CADENCE AMP');
assert.strictEqual(ULT_STUB_LABELS.U1.zh, '傷害強化');
assert.strictEqual(ULT_STUB_LABELS.U2.zh, '射速強化');
assert.ok(!weapons.includes("'FORM I'") && !weapons.includes('"FORM I"'), 'no FORM I');
assert.ok(!weapons.includes("'FORM II'") && !weapons.includes('"FORM II"'), 'no FORM II');
const opts = ultOptions('gatling', 'A');
assert.ok(opts.length === 2, '2 ults');
assert.ok(opts[0].en.includes('POWER AMP'), 'U1 en');
assert.ok(opts[1].en.includes('CADENCE AMP'), 'U2 en');
assert.ok(opts[0].descEn.includes('1.2'), 'U1 desc dmg');
assert.ok(opts[1].descEn.includes('0.85'), 'U2 desc cd');
assert.ok(wdoc.includes('WEAPONS-ULT-EN-LABELS-001') || wdoc.includes('POWER AMP'), 'WEAPONS docs');
assert.ok(weapons.includes('full kit later') || weapons.includes('完整招式後續'), 'full kits still stub');

console.log('weapons-ult-en-labels.test.mjs: PASS');
