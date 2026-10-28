/**
 * WEAPONS-RAIL-TAP-TARGET-001 (v0.9.68)
 * Phone rail tiles ≥44×44; --hud-rail-h raised; preserve fill-edge + stick contracts.
 * Run: node tests/weapons-rail-tap-target.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(68|69|[7-9]\d)/.test(html), 'cache-bust ≥0.9.68');
assert.ok(css.includes('WEAPONS-RAIL-TAP-TARGET-001') || css.includes('min-width: 44px'), 'ship CSS');
assert.ok(main.includes('0.9.68') || main.includes('WEAPONS-RAIL-TAP-TARGET-001'), 'ship in main');
assert.ok(agent.includes('WEAPONS-RAIL-TAP-TARGET-001') || agent.includes('0.9.68') || agent.includes('HOLD'), 'AGENT_TASK');

assert.match(css, /--hud-rail-h:\s*54px/, 'rail height 54');
assert.match(css, /\.wrail-tile\s*\{[^}]*min-width:\s*44px/s, 'tile min-width 44');
assert.match(css, /\.wrail-tile\s*\{[^}]*min-height:\s*44px/s, 'tile min-height 44');
assert.match(css, /@media\s*\(max-width:\s*420px\)\s*\{[^}]*\.wrail-tile\s*\{[^}]*width:\s*44px/s, 'phone tile 44');

// Preserve
assert.ok(main.includes('WEAPONS-RAIL-FILL-EDGE-001') || main.includes('_tileFillEdge'), 'fill-edge kept');
assert.ok(main.includes('maxBottom') || main.includes('STICK-RAIL-CLAMP'), 'clamp kept');
assert.match(css, /\.stick\s*\{[^}]*opacity:\s*0/s, 'stick idle hide');
assert.ok(main.includes('TAP_WINDOW_MS'), 'multi-tap');
assert.ok(main.includes('secondaryBurstMax') || main.includes('activateSecondaryFromTap'), 'burst path');
assert.match(css, /\.wrail-tile\.drained/, 'drained CSS kept');

console.log('weapons-rail-tap-target.test.mjs: PASS');
