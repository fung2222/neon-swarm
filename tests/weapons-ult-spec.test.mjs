/**
 * WEAPONS-ULT-SPEC-001 (v0.9.121) — unique U1/U2 kits documented; light amp fallback until code.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const wdoc = readFileSync(new URL('../docs/WEAPONS.md', import.meta.url), 'utf8');
const handoff = readFileSync(new URL('../docs/HANDOFF.md', import.meta.url), 'utf8');

assert.ok(html.includes('?v=0.9.121'), 'cache-bust 0.9.121');
assert.ok(agent.includes('WEAPONS-ULT-SPEC-001'), 'AGENT_TASK id');
assert.ok(agent.includes('WEAPONS-ULT-KITS-001'), 'Active beat');
assert.ok(!agent.includes('full ult invent') || agent.includes('lifted'), 'ban lifted note');
assert.ok(wdoc.includes('WEAPONS-ULT-SPEC-001'), 'WEAPONS ship id');
assert.ok(wdoc.includes('OVERCLOCK BURST'), 'gatling A U1');
assert.ok(wdoc.includes('CONE NOVA'), 'gatling C U1');
assert.ok(wdoc.includes('CHAIN STORM'), 'ion B U1');
assert.ok(wdoc.includes('PENTA WARHEAD'), 'tracking A U1');
assert.ok(wdoc.includes('BURN STORM'), 'vulcan B U1');
assert.ok(wdoc.includes('FROST NOVA'), 'zero B U1');
assert.ok(wdoc.includes('CRYSTAL BASTION'), 'zero C U1');
assert.ok(wdoc.includes('light amp remains live **fallback**') || wdoc.includes('light amp remains'), 'fallback note');
assert.ok(handoff.includes('0.9.121'), 'HANDOFF tip');
assert.ok(handoff.includes('WEAPONS-ULT-KITS-001'), 'HANDOFF Active');

console.log('weapons-ult-spec.test.mjs: PASS');
