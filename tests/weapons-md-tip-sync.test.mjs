/**
 * WEAPONS-MD-TIP-SYNC-001 (v0.9.98)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const wdoc = readFileSync(new URL('../docs/WEAPONS.md', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.98/.test(html), 'cache-bust');
assert.ok(wdoc.includes('WEAPONS-MD-TIP-SYNC-001'), 'ship id');
assert.ok(agent.includes('WEAPONS-MD-TIP-SYNC-001') || agent.includes('0.9.98'), 'AGENT_TASK');
assert.ok(wdoc.includes('v0.9.98'), 'tip');
assert.ok(!/Ship:\*\* v0\.9\.75 catalog-fire-live · howto-controls-sync/.test(wdoc), 'stale tip gone');
assert.ok(wdoc.includes('HUD hub region a11y'), 'status row');
console.log('weapons-md-tip-sync.test.mjs: PASS');
