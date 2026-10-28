/**
 * HUD-GEAR-PAUSE-CORNERS-001 (v0.9.145)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../vendor/cyber-kit/ui/ui.js', import.meta.url), 'utf8');

assert.ok(html.includes('?v=0.9.145') || /\\?v=0\\.9\\.\\d+/.test(html), 'cache-bust tip');
assert.ok(agent.includes('HUD-GEAR-PAUSE-CORNERS-001') || agent.includes('0.9.145'), 'AGENT_TASK');


assert.ok(css.includes('HUD-GEAR-PAUSE-CORNERS-001'), 'ship id');
assert.ok(css.includes('--hud-chrome-under'), 'chrome under var');
assert.match(css, /\.hud-buttons\.top[^{]*\{[^}]*justify-content:\s*space-between/s, 'L/R corners');
assert.match(css, /\.hud-buttons\.top[^{]*\{[^}]*flex-direction:\s*row/s, 'row under hub');
assert.match(css, /\.hud-buttons\.top\s+\.icon-btn[^{]*\{[^}]*min-width:\s*44px/s, '≥44');

console.log('hud-gear-pause-corners.test.mjs: PASS');
