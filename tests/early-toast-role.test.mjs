/**
 * EARLY-TOAST-ROLE-001 (v0.9.107)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.107/.test(html), 'cache-bust');
assert.ok(html.includes('EARLY-TOAST-ROLE-001'), 'ship id');
assert.ok(agent.includes('EARLY-TOAST-ROLE-001') || agent.includes('0.9.107'), 'AGENT_TASK');
assert.ok(/id="early-toast"[^>]*role="status"/.test(html), 'role');
assert.ok(html.includes('aria-atomic="true"'), 'atomic');
console.log('early-toast-role.test.mjs: PASS');
