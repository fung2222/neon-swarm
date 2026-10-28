/**
 * MECH-PICK-ARIA-SYNC-001 (v0.9.112)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.112/.test(html), 'cache-bust');
assert.ok(html.includes('MECH-PICK-ARIA-SYNC-001'), 'ship id');
assert.ok(agent.includes('MECH-PICK-ARIA-SYNC-001') || agent.includes('0.9.112'), 'AGENT_TASK');
assert.ok(html.includes('role="radiogroup"'), 'radiogroup');
assert.ok(html.includes('aria-label="機體選取 FRAME PICK"'), 'aria');
console.log('mech-pick-aria-sync.test.mjs: PASS');
