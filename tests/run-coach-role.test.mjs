/**
 * RUN-COACH-ROLE-001 (v0.9.106)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.106/.test(html), 'cache-bust');
assert.ok(html.includes('RUN-COACH-ROLE-001'), 'ship id');
assert.ok(agent.includes('RUN-COACH-ROLE-001') || agent.includes('0.9.106'), 'AGENT_TASK');
assert.ok(/id="run-coach"[^>]*role="status"/.test(html), 'role');
console.log('run-coach-role.test.mjs: PASS');
