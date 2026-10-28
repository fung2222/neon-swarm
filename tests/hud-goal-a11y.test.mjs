/**
 * HUD-GOAL-A11Y-001 (v0.9.104)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.104/.test(html), 'cache-bust');
assert.ok(html.includes('HUD-GOAL-A11Y-001'), 'ship id');
assert.ok(agent.includes('HUD-GOAL-A11Y-001') || agent.includes('0.9.104'), 'AGENT_TASK');
assert.ok(/id="hud-goal"[^>]*role="status"/.test(html), 'role');
assert.ok(html.includes('aria-label="目標 GOAL"'), 'aria');
assert.ok(html.includes('id="goal-left"'), 'count kept');
console.log('hud-goal-a11y.test.mjs: PASS');
