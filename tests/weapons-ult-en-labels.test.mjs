/**
 * WEAPONS-ULT-EN-LABELS-001 (v0.9.82) — historical light-amp labels kept as ULT_STUB_LABELS fallback.
 * Unique kits (v0.9.122+) supersede card copy; stubs remain exported.
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { ultOptions, ULT_STUB_LABELS, ULT_KIT_LABELS } from '../js/weapons.js';

const weapons = readFileSync(new URL('../js/weapons.js', import.meta.url), 'utf8');

assert.strictEqual(ULT_STUB_LABELS.U1.en, 'POWER AMP');
assert.strictEqual(ULT_STUB_LABELS.U2.en, 'CADENCE AMP');
assert.strictEqual(ULT_STUB_LABELS.U1.zh, '傷害強化');
assert.strictEqual(ULT_STUB_LABELS.U2.zh, '射速強化');
assert.ok(!weapons.includes("'FORM I'") && !weapons.includes('"FORM I"'), 'no FORM I');
assert.ok(ULT_KIT_LABELS && ULT_KIT_LABELS.gatling, 'unique kits present');
const opts = ultOptions('gatling', 'A');
assert.ok(opts.length === 2, '2 ults');
assert.ok(opts[0].en.includes('OVERCLOCK BURST'), 'unique U1');
assert.ok(opts[1].en.includes('COOLANT JET'), 'unique U2');
assert.ok(!opts[0].descZh.includes('完整招式後續'), 'no stub later');

console.log('weapons-ult-en-labels.test.mjs: PASS (unique kits supersede)');
