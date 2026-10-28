/**
 * BEAT-BANNER-ROLE-001 (v0.9.105)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.105/.test(html), 'cache-bust');
assert.ok(html.includes('BEAT-BANNER-ROLE-001'), 'ship id');
assert.ok(agent.includes('BEAT-BANNER-ROLE-001') || agent.includes('0.9.105'), 'AGENT_TASK');
assert.ok(/id="beat-banner"[^>]*role="status"/.test(html), 'role');
assert.ok(html.includes('aria-live="polite"'), 'live');
console.log('beat-banner-role.test.mjs: PASS');
