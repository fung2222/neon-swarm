/**
 * BOSS-HP-A11Y-001 (v0.9.95)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.95/.test(html), 'cache-bust');
assert.ok(html.includes('BOSS-HP-A11Y-001'), 'ship id');
assert.ok(agent.includes('BOSS-HP-A11Y-001') || agent.includes('0.9.95'), 'AGENT_TASK');
assert.ok(/id="boss-hp"[^>]*role="region"/.test(html), 'role');
assert.ok(html.includes('aria-label="首領血量 BOSS HP"'), 'aria');
console.log('boss-hp-a11y.test.mjs: PASS');
