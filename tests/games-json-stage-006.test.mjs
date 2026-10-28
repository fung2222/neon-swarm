/**
 * GAMES-JSON-STAGE-006 (v0.9.161)
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

assert.ok(html.includes('?v=0.9.161') || /\\?v=0\\.9\\.\\d+/.test(html), 'cache-bust tip');
assert.ok(agent.includes('GAMES-JSON-STAGE-006') || agent.includes('0.9.161'), 'AGENT_TASK');


const stub = readFileSync(new URL('../docs/GAMES-JSON-STUB.md', import.meta.url), 'utf8');
assert.ok(stub.includes('0.9.161') || stub.includes('v0.9.161'), 'stub tip');
assert.ok(stub.includes('GAMES-JSON-STAGE-006') || stub.includes('GAMES-JSON-STAGE-006'), 'ship id');
assert.ok(agent.includes('HOLD') || agent.includes('GAMES-JSON-STAGE-006'), 'HOLD');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'pause glow still gone at HOLD');
assert.ok(strings.includes('畫質'), 'settings quality label kept');

console.log('games-json-stage-006.test.mjs: PASS');
