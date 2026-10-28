/**
 * HUD-ZONE-A11Y-001 (v0.9.103)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.103/.test(html), 'cache-bust');
assert.ok(html.includes('HUD-ZONE-A11Y-001'), 'ship id');
assert.ok(agent.includes('HUD-ZONE-A11Y-001') || agent.includes('0.9.103'), 'AGENT_TASK');
assert.ok(/id="hud-zone"[^>]*role="status"/.test(html), 'role');
assert.ok(html.includes('aria-label="區域 ZONE"'), 'aria');
console.log('hud-zone-a11y.test.mjs: PASS');
