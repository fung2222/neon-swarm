/**
 * PAUSE-HINT-SYNC-001 (v0.9.87)
 * pauseHint mentions P/Esc + resume; no soft-juice invent.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(87|[8-9]\d)/.test(html) || /\?v=0\.9\.8[7-9]/.test(html), 'cache-bust ≥0.9.87');
assert.ok(strings.includes('PAUSE-HINT-SYNC-001'), 'ship id');
assert.ok(agent.includes('PAUSE-HINT-SYNC-001') || agent.includes('0.9.87'), 'AGENT_TASK');
assert.ok(strings.includes("P／Esc 暫停") || strings.includes('P／Esc'), 'zh P/Esc');
assert.ok(strings.includes('P / ESC PAUSE'), 'en P/Esc');
assert.ok(strings.includes('NO AUTO-RESUME') || strings.includes('唔會自動恢復'), 'no auto-resume kept');
assert.ok(strings.includes('HOWTO-CONTROLS-SYNC-001'), 'howto prior');
assert.ok(!/soft.?juice/i.test(strings.split('pauseHint')[1].split('resume:')[0]), 'no soft-juice');

console.log('pause-hint-sync.test.mjs: PASS');
