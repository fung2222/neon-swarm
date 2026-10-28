/**
 * README-TIP-SYNC-001 (v0.9.115)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const md = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.115/.test(html), 'cache-bust');
assert.ok(md.includes('README-TIP-SYNC-001'), 'ship id');
assert.ok(agent.includes('README-TIP-SYNC-001') || agent.includes('0.9.115'), 'AGENT_TASK');
assert.ok(md.includes('?v=0.9.115'), 'tip');
assert.ok(!/\?v=0\.9\.60/.test(md), 'stale tip gone');
console.log('readme-tip-sync.test.mjs: PASS');
