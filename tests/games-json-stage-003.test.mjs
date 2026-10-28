/**
 * GAMES-JSON-STAGE-003 (v0.9.120)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const stub = readFileSync(new URL('../docs/GAMES-JSON-STUB.md', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.120/.test(html), 'cache-bust');
assert.ok(stub.includes('GAMES-JSON-STAGE-003'), 'ship id');
assert.ok(agent.includes('GAMES-JSON-STAGE-003') || agent.includes('0.9.120'), 'AGENT_TASK');
assert.ok(stub.includes('v0.9.120'), 'stage tip');
assert.ok(agent.includes('HOLD'), 'HOLD');
assert.ok(stub.includes('2+2+2') || stub.includes('hide-stick') || stub.includes('隱藏搖桿'), 'features');
console.log('games-json-stage-003.test.mjs: PASS');
