/**
 * HUD-HUB-FLUSH-TOP-001 (v0.9.143)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../vendor/cyber-kit/ui/ui.js', import.meta.url), 'utf8');

assert.ok(html.includes('?v=0.9.143') || /\\?v=0\\.9\\.\\d+/.test(html), 'cache-bust tip');
assert.ok(agent.includes('HUD-HUB-FLUSH-TOP-001') || agent.includes('0.9.143'), 'AGENT_TASK');


assert.ok(css.includes('HUD-HUB-FLUSH-TOP-001'), 'ship id');
assert.match(css, /--hud-hub-top:\s*var\(--sa-top\)/, 'flush sa-top');
assert.ok(!/--hud-hub-top:\s*calc\([68]px \+ var\(--sa-top\)\)/.test(css), 'no 6/8px gap');
assert.ok(css.includes('--hud-hub-max-w'), 'hub width kept');

console.log('hud-hub-flush-top.test.mjs: PASS');
