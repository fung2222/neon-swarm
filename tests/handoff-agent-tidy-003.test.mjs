/**
 * HANDOFF-AGENT-TIDY-003 (v0.9.184)
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
  return m && Number(m[1]) >= 184;
})(), 'soft-pin ≥0.9.184');
assert.ok(agent.includes('HANDOFF-AGENT-TIDY-003') || agent.includes('0.9.184') || /0\.9\.\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');


assert.ok(hand.includes('HANDOFF-AGENT-TIDY-003'), 'handoff note');
assert.ok(hand.includes('btn-glow') || hand.includes('畫質'), 'glow/quality note');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'code still clean');
assert.ok(html.includes('SHARE-BTN-ARIA-FALLBACK-001') && html.includes('META-COLOR-SCHEME-001'), 'aria/meta shipped');
assert.ok(strings.includes('畫質'), '畫質 label');

console.log('handoff-agent-tidy-003.test.mjs: PASS');
