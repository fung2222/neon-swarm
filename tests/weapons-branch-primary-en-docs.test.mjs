/**
 * WEAPONS-BRANCH-PRIMARY-EN-DOCS-001 (v0.9.85)
 * Primary branch naming table documents EN titles (parity with sec/throw).
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const wdoc = readFileSync(new URL('../docs/WEAPONS.md', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const weapons = readFileSync(new URL('../js/weapons.js', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(85|[8-9]\d)/.test(html) || /\?v=0\.9\.8[5-9]/.test(html), 'cache-bust ≥0.9.85');
assert.ok(wdoc.includes('WEAPONS-BRANCH-PRIMARY-EN-DOCS-001'), 'ship id');
assert.ok(agent.includes('WEAPONS-BRANCH-PRIMARY-EN-DOCS-001') || agent.includes('0.9.85'), 'AGENT_TASK');
assert.ok(wdoc.includes('OVERHEAT BURST') && wdoc.includes('AP CORE') && wdoc.includes('SCATTER NET'), 'gatling EN');
assert.ok(wdoc.includes('LONG FOCUS') && wdoc.includes('CHAIN ARC') && wdoc.includes('SLIT CUT'), 'ion EN');
assert.ok(wdoc.includes('KAMIKAZE DRONE') && wdoc.includes('GUN FORTRESS') && wdoc.includes('CRYSTAL SHIELD'), 'more EN');
assert.ok(wdoc.includes('Branch naming (primary)') || wdoc.includes('live in code · EN documented'), 'title live');
assert.ok(weapons.includes("branchNamesEn: ['OVERHEAT BURST'"), 'code still has EN');
assert.ok(!wdoc.includes('Branch naming stubs (primary)'), 'stubs title retired');

console.log('weapons-branch-primary-en-docs.test.mjs: PASS');
