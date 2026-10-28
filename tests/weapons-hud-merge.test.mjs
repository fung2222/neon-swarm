/**
 * WEAPONS-HUD-MERGE-001 (v0.9.61)
 * Centered hub + bottom color-only water-cooldown rail; no rail name labels.
 * Run: node tests/weapons-hud-merge.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(6[1-9]|[7-9]\d)/.test(html), 'cache-bust ≥0.9.61');
assert.ok(html.includes('id="hud-hub"'), 'hud-hub in DOM');
assert.ok(html.includes('id="hub-hp-fill"'), 'HP bar fill');
assert.ok(html.includes('id="xp-pct"'), 'XP % display');
assert.ok(html.includes('id="weapon-rail"'), 'weapon-rail kept');
assert.ok(html.includes('hidden') && html.includes('id="weapon-status"'), 'weapon-status hidden');

assert.ok(css.includes('WEAPONS-HUD-MERGE-001'), 'ship id in CSS');
assert.ok(css.includes('--hud-hub-top'), 'hub top token');
assert.ok(css.includes('--hud-stick-clear'), 'stick clear token');
assert.ok(css.includes('--wrail-primary'), 'primary color token');
assert.ok(css.includes('--wrail-secondary'), 'secondary color token');
assert.ok(css.includes('--wrail-throw'), 'throw color token');
assert.ok(css.includes('wrail-fill'), 'water fill class');
assert.match(css, /\.weapon-rail\s*\{[^}]*justify-content:\s*space-evenly/s);
assert.match(css, /\.weapon-rail\s*\{[^}]*bottom:\s*calc\(/s);
assert.ok(css.includes('display: none !important') && css.includes('.wrail-label'), 'labels hidden');
assert.ok(css.includes('.weapon-status') && /weapon-status\s*\{[^}]*display:\s*none/s.test(css), 'status hidden');

assert.ok(main.includes('_tileFillRatio'), 'fill ratio helper');
assert.ok(main.includes('_railFillSnap'), 'fill snap for HUD refresh');
assert.ok(main.includes('wrail-fill'), 'rail fill markup');
assert.ok(main.includes('xp-pct'), 'xp pct update');
assert.ok(main.includes('hub-hp-fill'), 'hp bar update');
assert.ok(!/lab\.className = 'wrail-label'/.test(main), 'no rail label create');
assert.ok(main.includes('TAP_WINDOW_MS'), 'multi-tap kept');
assert.ok(main.includes('activateSecondaryFromTap'), 'secondary tap kept');
assert.ok(readFileSync(new URL('../js/logic.js', import.meta.url), 'utf8').includes('secondaryBurstMax'), 'burst max in logic');

assert.ok(agent.includes('WEAPONS-HUD-MERGE-001') || agent.includes('0.9.61'), 'AGENT_TASK ship id');

console.log('weapons-hud-merge.test.mjs: PASS');
