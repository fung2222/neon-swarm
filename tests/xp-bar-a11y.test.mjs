/**
 * XP-BAR-A11Y-001 (v0.9.102)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.102/.test(html), 'cache-bust');
assert.ok(html.includes('XP-BAR-A11Y-001'), 'ship id');
assert.ok(agent.includes('XP-BAR-A11Y-001') || agent.includes('0.9.102'), 'AGENT_TASK');
assert.ok(html.includes('role="progressbar"') && html.includes('aria-label="經驗 XP"'), 'progressbar');
assert.ok(html.includes('aria-valuemin="0"') && html.includes('aria-valuemax="100"'), 'range');
assert.ok(html.includes('id="hud-hub"'), 'hub kept');
console.log('xp-bar-a11y.test.mjs: PASS');
