/**
 * WEAPONS-HUD-RAIL-CLEAR-001 (v0.9.62)
 * Stick clearance above water rail; hub clears mute/pause; stronger water fill.
 * Run: node tests/weapons-hud-rail-clear.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(html.includes('?v=0.9.62'), 'cache-bust 0.9.62');
assert.ok(css.includes('WEAPONS-HUD-RAIL-CLEAR-001'), 'ship id in CSS');
assert.ok(css.includes('--hud-stick-clear'), 'stick clear token');
assert.match(css, /--hud-stick-clear:\s*calc\(var\(--hud-rail-h\)\s*\+\s*36px/);
assert.match(css, /--hud-hub-max-w:\s*min\(360px,\s*calc\(100vw\s*-\s*124px/);
assert.ok(css.includes('--weapon-primary'), 'shared primary token');
assert.ok(css.includes('--weapon-secondary'), 'shared secondary token');
assert.ok(css.includes('--weapon-throw'), 'shared throw token');
assert.ok(css.includes('box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22)'), 'water meniscus');
assert.ok(css.includes('.wrail-tile.secondary.active'), 'secondary active glow');
assert.ok(css.includes('.hud-buttons.top'), 'mute/pause z bump');
assert.ok(agent.includes('WEAPONS-HUD-RAIL-CLEAR-001') || agent.includes('0.9.62'), 'AGENT_TASK mentions ship');

console.log('weapons-hud-rail-clear.test.mjs: PASS');
