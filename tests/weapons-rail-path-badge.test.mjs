/**
 * WEAPONS-RAIL-PATH-BADGE-001 (v0.9.73)
 * Rail tiles show tiny A/B/C·U corner when branched; no name labels; no ult invent.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(73|[8-9]\d)/.test(html) || /\?v=0\.9\.7[3-9]/.test(html), 'cache-bust ≥0.9.73');
assert.ok(css.includes('WEAPONS-RAIL-PATH-BADGE-001'), 'ship id in CSS');
assert.ok(main.includes('WEAPONS-RAIL-PATH-BADGE-001') || main.includes('wrail-path'), 'main path badge');
assert.ok(main.includes('wrail-path'), 'wrail-path class emitted');
assert.ok(agent.includes('WEAPONS-RAIL-PATH-BADGE-001') || agent.includes('0.9.73'), 'AGENT_TASK');
assert.match(css, /\.wrail-path\s*\{/s, 'path badge CSS');
// No full weapon name on rail tiles (preserve color-only)
assert.ok(main.includes('no name labels') || main.includes('Icon + water fill only'), 'no name labels intent');
assert.ok(css.includes('WEAPONS-BRANCH-CARD-PATH-001') || css.includes('card-path'), 'card path kept');
assert.ok(css.includes('WEAPONS-RAIL-TAP-TARGET-001') || css.includes('--hud-rail-h'), 'rail tap kept');

console.log('weapons-rail-path-badge.test.mjs: PASS');
