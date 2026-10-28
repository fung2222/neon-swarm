/**
 * HIT-FEEL-PIPELINE-TIP-002 (v0.9.166)
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
  return m && Number(m[1]) >= 166;
})(), 'soft-pin ≥0.9.166');
assert.ok(agent.includes('HIT-FEEL-PIPELINE-TIP-002') || agent.includes('0.9.166') || /0\.9\.\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');


const hf = readFileSync(new URL('../docs/HIT-FEEL-DEVICE.md', import.meta.url), 'utf8');
assert.ok(hf.includes('HIT-FEEL-PIPELINE-TIP-002'), 'ship id');
assert.ok(hf.includes('Safe pipeline tip now') && hf.includes('0.9.166'), 'pipeline tip');
assert.ok(hf.includes('v=0.9.50'), 'device-verified baseline kept');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');

console.log('hit-feel-pipeline-tip-002.test.mjs: PASS');
