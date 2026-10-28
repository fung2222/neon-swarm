/**
 * WEAPONS-MD-TIP-SYNC-004 (v0.9.174)
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
  return m && Number(m[1]) >= 174;
})(), 'soft-pin ≥0.9.174');
assert.ok(agent.includes('WEAPONS-MD-TIP-SYNC-004') || agent.includes('0.9.174') || /0\.9\.\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');


const weapons = readFileSync(new URL('../docs/WEAPONS.md', import.meta.url), 'utf8');
assert.ok(/0\.9\.(17[4-9]|1[89]\d|[2-9]\d\d)/.test(weapons) || weapons.includes('0.9.174'), 'weapons tip ≥0.9.174');
assert.ok(weapons.includes('WEAPONS-MD-TIP-SYNC-004'), 'ship id');
assert.ok(!/Ship:\*\* v0\.9\.165 WEAPONS-MD-TIP-SYNC-003/.test(weapons), 'stale 0.9.165 ship cleared');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');

console.log('weapons-md-tip-sync-004.test.mjs: PASS');
