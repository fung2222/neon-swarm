/**
 * ICON-BTN-FOCUS-001 (v0.9.109)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.109/.test(html), 'cache-bust');
assert.ok(css.includes('ICON-BTN-FOCUS-001'), 'ship id');
assert.ok(agent.includes('ICON-BTN-FOCUS-001') || agent.includes('0.9.109'), 'AGENT_TASK');
assert.match(css, /\.icon-btn:focus-visible[\s\S]*outline:\s*2px\s+solid/, 'icon outline');
assert.ok(css.includes('HUD-MUTE-PAUSE-TAP-001'), 'tap≥44 kept');
console.log('icon-btn-focus.test.mjs: PASS');
