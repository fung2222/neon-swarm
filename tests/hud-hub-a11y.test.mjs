/**
 * HUD-HUB-A11Y-001 (v0.9.91)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.91/.test(html), 'cache-bust');
assert.ok(html.includes('HUD-HUB-A11Y-001'), 'ship id');
assert.ok(agent.includes('HUD-HUB-A11Y-001') || agent.includes('0.9.91'), 'AGENT_TASK');
assert.ok(html.includes('id="hud-hub"') && html.includes('role="region"'), 'role');
assert.ok(html.includes('aria-label="戰況 RUN STATUS"'), 'aria');
assert.ok(html.includes('class="hud-hub"'), 'hub kept');
console.log('hud-hub-a11y.test.mjs: PASS');
