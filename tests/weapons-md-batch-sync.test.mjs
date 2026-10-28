/**
 * WEAPONS-MD-BATCH-SYNC-001 (v0.9.116)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const wdoc = readFileSync(new URL('../docs/WEAPONS.md', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.116/.test(html), 'cache-bust');
assert.ok(wdoc.includes('WEAPONS-MD-BATCH-SYNC-001'), 'ship id');
assert.ok(agent.includes('WEAPONS-MD-BATCH-SYNC-001') || agent.includes('0.9.116'), 'AGENT_TASK');
assert.ok(wdoc.includes('v0.9.116'), 'tip');
assert.ok(wdoc.includes('Level screen dialog a11y'), 'status row');
console.log('weapons-md-batch-sync.test.mjs: PASS');
