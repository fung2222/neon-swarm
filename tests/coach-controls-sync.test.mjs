/**
 * COACH-CONTROLS-SYNC-001 (v0.9.78)
 * coach.move / coach.wasd mention dbl/tpl/rail — mirrors howto; no soft-juice invent.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(78|[8-9]\d)/.test(html) || /\?v=0\.9\.7[8-9]/.test(html), 'cache-bust ≥0.9.78');
assert.ok(strings.includes('COACH-CONTROLS-SYNC-001'), 'ship id in strings');
assert.ok(agent.includes('COACH-CONTROLS-SYNC-001') || agent.includes('0.9.78'), 'AGENT_TASK');
assert.ok(strings.includes('雙擊') && strings.includes('三擊'), 'zh dbl/tpl in coach');
assert.ok(strings.includes('底欄'), 'zh rail in coach');
assert.ok(strings.includes('DBL SEC') && strings.includes('TPL THROW'), 'en dbl/tpl');
assert.ok(strings.includes('RAIL'), 'en rail');
assert.ok(main.includes("t('coach.move')") || main.includes('coach.move'), 'coach still used');
assert.ok(strings.includes('HOWTO-CONTROLS-SYNC-001'), 'howto prior kept');

console.log('coach-controls-sync.test.mjs: PASS');
