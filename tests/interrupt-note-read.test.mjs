/**
 * INTERRUPT-NOTE-READ-001 (v0.9.183)
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
  return m && Number(m[1]) >= 183;
})(), 'soft-pin ≥0.9.183');
assert.ok(agent.includes('INTERRUPT-NOTE-READ-001') || agent.includes('0.9.183') || /0\.9\.\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');


assert.ok(css.includes('INTERRUPT-NOTE-READ-001'), 'ship id');
assert.match(css, /INTERRUPT-NOTE-READ-001[\s\S]*?\.interrupt-note[\s\S]*?color:\s*#ffc0d0/s, 'note contrast');
assert.ok(css.includes('GFX-BODY-READ-001'), 'gfx body prior');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');
assert.ok(strings.includes('畫質'), '畫質 label kept');

console.log('interrupt-note-read.test.mjs: PASS');
