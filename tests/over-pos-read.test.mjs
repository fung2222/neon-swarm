/**
 * OVER-POS-READ-001 (v0.9.180)
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
  return m && Number(m[1]) >= 180;
})(), 'soft-pin ≥0.9.180');
assert.ok(agent.includes('OVER-POS-READ-001') || agent.includes('0.9.180') || /0\.9\.\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');


assert.ok(css.includes('OVER-POS-READ-001'), 'ship id');
assert.match(css, /OVER-POS-READ-001[\s\S]*?#screen-over\s+\.over-pos[\s\S]*?color:\s*#b8ffe8/s, 'pos contrast');
assert.ok(css.includes('OVER-RESULT-EM-READ-001'), 'result em prior');
assert.ok(html.includes('over-pos'), 'over-pos kept');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');

console.log('over-pos-read.test.mjs: PASS');
