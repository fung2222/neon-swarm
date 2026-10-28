/**
 * EARLY-TOAST-EN-READ-001 (v0.9.179)
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
  return m && Number(m[1]) >= 179;
})(), 'soft-pin ≥0.9.179');
assert.ok(agent.includes('EARLY-TOAST-EN-READ-001') || agent.includes('0.9.179') || /0\.9\.\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');


assert.ok(css.includes('EARLY-TOAST-EN-READ-001'), 'ship id');
assert.match(css, /EARLY-TOAST-EN-READ-001[\s\S]*?\.early-toast-en[\s\S]*?color:\s*#9ecfff/s, 'en contrast');
assert.ok(css.includes('COACH-READ-001'), 'coach read prior kept');
assert.ok(html.includes('EARLY-TOAST-ROLE-001') || html.includes('early-toast'), 'toast role prior');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');
assert.ok(strings.includes('畫質'), '畫質 label kept');

console.log('early-toast-en-read.test.mjs: PASS');
