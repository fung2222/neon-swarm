/**
 * SOFTPIN-CTA-TAP-001 (v0.9.162)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const over = readFileSync(new URL('./over-cta-tap.test.mjs', import.meta.url), 'utf8');
const home = readFileSync(new URL('./home-cta-tap.test.mjs', import.meta.url), 'utf8');
const pause = readFileSync(new URL('./pause-cta-tap.test.mjs', import.meta.url), 'utf8');
const gfx = readFileSync(new URL('./gfx-reload-tap.test.mjs', import.meta.url), 'utf8');
const mech = readFileSync(new URL('./home-mech-card-tap.test.mjs', import.meta.url), 'utf8');

assert.ok((() => { const m = html.match(/\?v=0\.9\.(\d+)/); return m && Number(m[1]) >= 162; })(), 'soft-pin ≥0.9.162');
assert.ok(agent.includes('SOFTPIN-CTA-TAP-001') || agent.includes('0.9.162') || /HOLD|Active/.test(agent), 'AGENT_TASK soft');
assert.ok(over.includes('Number(m[1]) >= 76'), 'over softpin');
assert.ok(home.includes('Number(m[1]) >= 77'), 'home softpin');
assert.ok(pause.includes('Number(m[1]) >= 81'), 'pause softpin');
assert.ok(gfx.includes('Number(m[1]) >= 79'), 'gfx softpin');
assert.ok(mech.includes('Number(m[1]) >= 72'), 'mech softpin');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');

console.log('softpin-cta-tap.test.mjs: PASS');
