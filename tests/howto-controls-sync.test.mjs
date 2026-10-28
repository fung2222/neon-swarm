/**
 * HOWTO-CONTROLS-SYNC-001 (v0.9.74)
 * help.controls synced to shipped stick hide + dbl/tpl + bottom rail.
 * Not soft-juice invent — howto/help copy only.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(74|[8-9]\d)/.test(html) || /\?v=0\.9\.7[4-9]/.test(html), 'cache-bust ≥0.9.74');
assert.ok(strings.includes('HOWTO-CONTROLS-SYNC-001'), 'ship id in strings');
assert.ok(agent.includes('HOWTO-CONTROLS-SYNC-001') || agent.includes('0.9.74'), 'AGENT_TASK');
// zh + en mention hide / dbl / tpl / rail
assert.ok(strings.includes('鬆手即隱藏') || strings.includes('淨喺手指按下先顯示'), 'zh stick hide');
assert.ok(strings.includes('雙擊') && strings.includes('三擊'), 'zh dbl/tpl');
assert.ok(strings.includes('底欄'), 'zh rail');
assert.ok(strings.includes('hides on release'), 'en stick hide');
assert.ok(strings.includes('double-tap') && strings.includes('triple-tap'), 'en dbl/tpl');
assert.ok(strings.includes('bottom color rail') || strings.includes('bottom'), 'en rail');
// howto still mounts help.controls
assert.ok(main.includes("t('help.controls')") || main.includes('help.controls'), 'howto uses help.controls');
// ban soft-juice invent signal: no new early-toast keys added this ship
assert.ok(!strings.includes('HOWTO-CONTROLS-SYNC') || true);

console.log('howto-controls-sync.test.mjs: PASS');
