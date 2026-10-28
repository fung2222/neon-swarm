/**
 * GAMES-JSON-STAGE-005 (v0.9.153)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../vendor/cyber-kit/ui/ui.js', import.meta.url), 'utf8');

assert.ok(html.includes('?v=0.9.153') || /\\?v=0\\.9\\.\\d+/.test(html), 'cache-bust tip');
assert.ok(agent.includes('GAMES-JSON-STAGE-005') || agent.includes('0.9.153'), 'AGENT_TASK');


const stub = readFileSync(new URL('../docs/GAMES-JSON-STUB.md', import.meta.url), 'utf8');
assert.ok(stub.includes('0.9.153') || stub.includes('v0.9.153'), 'stub tip');
assert.ok(agent.includes('HOLD') || agent.includes('GAMES-JSON-STAGE-005'), 'HOLD');

console.log('games-json-stage-005.test.mjs: PASS');
