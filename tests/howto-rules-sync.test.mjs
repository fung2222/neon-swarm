/**
 * HOWTO-RULES-SYNC-001 (v0.9.83)
 * help.rules mentions 2+2+2 / magnet / stick hide; no soft-juice invent.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(83|[8-9]\d)/.test(html) || /\?v=0\.9\.8[3-9]/.test(html), 'cache-bust ≥0.9.83');
assert.ok(strings.includes('HOWTO-RULES-SYNC-001'), 'ship id');
assert.ok(agent.includes('HOWTO-RULES-SYNC-001') || agent.includes('0.9.83'), 'AGENT_TASK');
assert.ok(strings.includes('2 主') && strings.includes('2 副') && strings.includes('2 投'), 'zh 2+2+2');
assert.ok(strings.includes('2 primary') && strings.includes('2 secondary') && strings.includes('2 throw'), 'en 2+2+2');
assert.ok(strings.includes('磁鐵') && strings.includes('magnet'), 'magnet drop');
assert.ok(strings.includes('搖桿淨喺手指按下') || strings.includes('Stick shows only while pressed'), 'stick hide');
assert.ok(strings.includes('HOWTO-CONTROLS-SYNC-001'), 'prior howto controls kept');
assert.ok(!/soft.?juice|果汁|震動回饋 toast/i.test(strings.split("help.rules")[1].split("'help.controls'")[0]), 'no soft-juice invent in rules');

console.log('howto-rules-sync.test.mjs: PASS');
