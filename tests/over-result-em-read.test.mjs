/**
 * OVER-RESULT-EM-READ-001 (v0.9.170)
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
  return m && Number(m[1]) >= 170;
})(), 'soft-pin ≥0.9.170');
assert.ok(agent.includes('OVER-RESULT-EM-READ-001') || agent.includes('0.9.170') || /0\.9\.\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');


assert.ok(css.includes('OVER-RESULT-EM-READ-001'), 'ship id');
assert.match(css, /OVER-RESULT-EM-READ-001[\s\S]*?#screen-over\s+\.result\s+em[\s\S]*?color:\s*#b0c8e8/s, 'em contrast');
assert.ok(css.includes('OVER-RESULT-READ-001'), 'prior result read kept');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');
assert.ok(strings.includes('畫質'), '畫質 label kept');

console.log('over-result-em-read.test.mjs: PASS');
