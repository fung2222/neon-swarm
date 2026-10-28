/**
 * FPS-ARIA-HIDDEN-001 (v0.9.113)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.113/.test(html), 'cache-bust');
assert.ok(html.includes('FPS-ARIA-HIDDEN-001'), 'ship id');
assert.ok(agent.includes('FPS-ARIA-HIDDEN-001') || agent.includes('0.9.113'), 'AGENT_TASK');
assert.ok(/id="fps"[^>]*aria-hidden="true"/.test(html), 'aria-hidden');
console.log('fps-aria-hidden.test.mjs: PASS');
