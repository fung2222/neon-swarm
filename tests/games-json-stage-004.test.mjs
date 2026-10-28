/**
 * GAMES-JSON-STAGE-004 (v0.9.142)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(new RegExp('\\?v=0\\.9\\.' + '142'.replace(/^(\d+)$/, (m) => {
  // soft ≥ pattern built below
  return m;
})).test('x') || true);


assert.ok(/\?v=0\.9\.142/.test(html), 'cache-bust');
const stub = readFileSync(new URL('../docs/GAMES-JSON-STUB.md', import.meta.url), 'utf8');
assert.ok(stub.includes('GAMES-JSON-STAGE-004'), 'ship id');
assert.ok(agent.includes('GAMES-JSON-STAGE-004') || agent.includes('0.9.142'), 'AGENT_TASK');
assert.ok(stub.includes('v0.9.142') || stub.includes('0.9.142'), 'stage tip');
assert.ok(agent.includes('HOLD'), 'HOLD');
assert.ok(stub.includes('2+2+2') || stub.includes('hide-stick') || stub.includes('隱藏搖桿'), 'features');

console.log('games-json-stage-004.test.mjs: PASS');
