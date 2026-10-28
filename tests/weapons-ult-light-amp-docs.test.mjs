/**
 * WEAPONS-ULT-LIGHT-AMP-DOCS-001 (v0.9.88)
 * WEAPONS.md documents U1 ×1.2 / U2 ×0.85; code still applies same.
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { branchStatMods } from '../js/weapons.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const wdoc = readFileSync(new URL('../docs/WEAPONS.md', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const weapons = readFileSync(new URL('../js/weapons.js', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(88|[8-9]\d)/.test(html) || /\?v=0\.9\.8[8-9]/.test(html), 'cache-bust ≥0.9.88');
assert.ok(wdoc.includes('WEAPONS-ULT-LIGHT-AMP-DOCS-001'), 'ship id');
assert.ok(agent.includes('WEAPONS-ULT-LIGHT-AMP-DOCS-001') || agent.includes('0.9.88'), 'AGENT_TASK');
assert.ok(wdoc.includes('dmgMul × 1.2') || wdoc.includes('dmgMul ×1.2') || wdoc.includes('× 1.2'), 'docs U1');
assert.ok(wdoc.includes('cdMul × 0.85') || wdoc.includes('cdMul ×0.85') || wdoc.includes('× 0.85'), 'docs U2');
assert.ok(weapons.includes("ult === 'U1'") && weapons.includes('1.2'), 'code U1');
assert.ok(weapons.includes("ult === 'U2'") && weapons.includes('0.85'), 'code U2');
const base = branchStatMods('gatling', 'A', null);
const u1 = branchStatMods('gatling', 'A', 'U1');
const u2 = branchStatMods('gatling', 'A', 'U2');
assert.ok(Math.abs(u1.dmgMul - base.dmgMul * 1.2) < 1e-9, 'U1 stacks');
assert.ok(Math.abs(u2.cdMul - base.cdMul * 0.85) < 1e-9, 'U2 stacks');
assert.ok(wdoc.includes('full unique ult kits remain') || wdoc.includes('still **stub**'), 'full kits stub');

console.log('weapons-ult-light-amp-docs.test.mjs: PASS');
