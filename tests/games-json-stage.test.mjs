/**
 * GAMES-JSON-STAGE-001 (v0.9.89)
 * games.json stub stage bumped off ancient v0.3.3 to current tip.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const stub = readFileSync(new URL('../docs/GAMES-JSON-STUB.md', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(89|90|[9]\d)/.test(html) || /\?v=0\.9\.89/.test(html) || /\?v=0\.9\.90/.test(html), 'cache-bust ≥0.9.89');
assert.ok(stub.includes('GAMES-JSON-STAGE-001'), 'ship id');
assert.ok(agent.includes('GAMES-JSON-STAGE-001') || agent.includes('0.9.89'), 'AGENT_TASK');
assert.ok(stub.includes('v0.9.89'), 'stage mentions tip');
assert.ok(!stub.includes('v0.3.3'), 'old stage gone');
assert.ok(stub.includes('2+2+2') || stub.includes('hide-stick') || stub.includes('隱藏搖桿'), 'features');

console.log('games-json-stage.test.mjs: PASS');
