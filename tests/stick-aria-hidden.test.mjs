/**
 * STICK-ARIA-HIDDEN-001 (v0.9.110)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.110/.test(html), 'cache-bust');
assert.ok(html.includes('STICK-ARIA-HIDDEN-001'), 'ship id');
assert.ok(agent.includes('STICK-ARIA-HIDDEN-001') || agent.includes('0.9.110'), 'AGENT_TASK');
assert.ok(/id="stick"[^>]*aria-hidden="true"/.test(html), 'aria-hidden');
assert.ok(html.includes('data-no-input'), 'no-input kept');
console.log('stick-aria-hidden.test.mjs: PASS');
