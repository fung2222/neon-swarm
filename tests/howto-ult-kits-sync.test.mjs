/**
 * HOWTO-ULT-KITS-SYNC-001 (v0.9.129) — howto rules mention unique ult kits (not light-amp stub).
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(129|1[3-9]\d)/.test(html), 'cache-bust ≥0.9.129');
assert.ok(agent.includes('HOWTO-ULT-KITS-SYNC-001') || agent.includes('0.9.129'), 'AGENT_TASK');
assert.ok(strings.includes('獨特大招'), 'zh unique ult');
assert.ok(strings.includes('unique ult kits'), 'en unique ult');
assert.ok(!strings.includes('大招加成'), 'old zh gone');
assert.ok(!strings.includes('light ult amps'), 'old en gone');
assert.ok(strings.includes('2 主＋2 副＋2 投') || strings.includes('2 primary'), '2+2+2 kept');
assert.ok(strings.includes('HOWTO-ULT-KITS-SYNC-001'), 'ship comment');
console.log('howto-ult-kits-sync.test.mjs: PASS');
