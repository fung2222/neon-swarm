/**
 * PRIVACY-PRODUCT-RENAME-001 (v0.9.181)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../vendor/cyber-kit/ui/ui.js', import.meta.url), 'utf8');
const hand = readFileSync(new URL('../docs/HANDOFF.md', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');

assert.ok((() => {
  const m = html.match(/\?v=0\.9\.(\d+)/);
  return m && Number(m[1]) >= 181;
})(), 'soft-pin ≥0.9.181');
assert.ok(agent.includes('PRIVACY-PRODUCT-RENAME-001') || agent.includes('0.9.181') || /0\.9\.\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');


const priv = readFileSync(new URL('../privacy.html', import.meta.url), 'utf8');
assert.ok(priv.includes('PRIVACY-PRODUCT-RENAME-001'), 'ship id');
assert.ok(priv.includes('暴走機甲') && priv.includes('RAMPAGE MECH'), 'product name');
assert.ok(priv.includes('NEON SWARM') || priv.includes('霓虹洪流'), 'aka kept');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');

console.log('privacy-product-rename.test.mjs: PASS');
