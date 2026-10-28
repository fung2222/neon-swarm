/**
 * SHARE-CONFIRM-ROLE-001 (v0.9.119)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.119/.test(html), 'cache-bust');
assert.ok(html.includes('SHARE-CONFIRM-ROLE-001'), 'ship id');
assert.ok(agent.includes('SHARE-CONFIRM-ROLE-001') || agent.includes('0.9.119'), 'AGENT_TASK');
assert.ok(/id="share-confirm"[^>]*role="status"/.test(html), 'role');
assert.ok(main.includes('SHARE-BTN-ARIA-001'), 'share aria kept');
console.log('share-confirm-role.test.mjs: PASS');
