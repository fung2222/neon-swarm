/**
 * OVER-TITLE-SIZE-001 (v0.9.134) — bigger one-line over title; keep nowrap.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(13[4-9]|1[4-9]\d)/.test(html), 'cache-bust ≥0.9.134');
assert.ok(css.includes('OVER-TITLE-SIZE-001'), 'ship id');
assert.ok(css.includes('v0.9.134'), 'version tag');
assert.ok(agent.includes('OVER-TITLE-SIZE-001') || agent.includes('0.9.134'), 'AGENT_TASK');
assert.ok(css.includes('clamp(28px, 9vw, 48px)'), 'bigger zh clamp');
assert.match(css, /OVER-TITLE-SIZE-001[\s\S]*?#screen-over\s+\.title2[\s\S]*?font-size:\s*clamp\(28px/s, 'size rule on title2');
assert.ok(css.includes('OVER-TITLE-ONELINE-001'), 'prior oneline kept');
assert.match(css, /#screen-over\s+\.title2[\s\S]*?white-space:\s*nowrap/, 'nowrap preserved');
assert.match(css, /#screen-over\s+\.glitch::before[\s\S]*?white-space:\s*nowrap/, 'glitch nowrap');
assert.ok(css.includes('--hud-rail-h: 54px'), 'rail height');
assert.ok(css.includes('min-height: 44px'), 'tap≥44');
console.log('over-title-size.test.mjs: PASS');
