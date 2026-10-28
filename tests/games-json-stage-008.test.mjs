/**
 * GAMES-JSON-STAGE-008 (v0.9.185)
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
  return m && Number(m[1]) >= 185;
})(), 'soft-pin ≥0.9.185');
assert.ok(agent.includes('GAMES-JSON-STAGE-008') || agent.includes('0.9.185') || /0\.9\.\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');


const stub = readFileSync(new URL('../docs/GAMES-JSON-STUB.md', import.meta.url), 'utf8');
assert.ok(stub.includes('0.9.185') || stub.includes('v0.9.185'), 'stub tip');
assert.ok(stub.includes('GAMES-JSON-STAGE-008') || stub.includes('GAMES-JSON-STAGE-008'), 'ship id');
assert.ok(agent.includes('HOLD') || agent.includes('GAMES-JSON-STAGE-008'), 'HOLD');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'pause glow still gone at HOLD');
assert.ok(strings.includes('畫質'), 'settings quality label kept');
assert.ok(html.includes('SHARE-BTN-ARIA-FALLBACK-001') && html.includes('META-COLOR-SCHEME-001'), 'share aria + meta');
assert.ok(!html.includes('id="btn-glow"'), 'no btn-glow');

console.log('games-json-stage-008.test.mjs: PASS');
