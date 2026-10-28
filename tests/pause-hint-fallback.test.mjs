/**
 * PAUSE-HINT-FALLBACK-001 (v0.9.135)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(new RegExp('\\?v=0\\.9\\.' + '135'.replace(/^(\d+)$/, (m) => {
  // soft ≥ pattern built below
  return m;
})).test('x') || true);


assert.ok(/\?v=0\.9\.(13[5-9]|1[4-9]\d)/.test(html), 'cache-bust ≥0.9.135');
assert.ok(html.includes('PAUSE-HINT-FALLBACK-001'), 'ship comment');
assert.ok(agent.includes('PAUSE-HINT-FALLBACK-001') || agent.includes('0.9.135'), 'AGENT_TASK');
assert.ok(html.includes('P／Esc 暫停'), 'zh fallback P/Esc');
assert.ok(html.includes('唔會自動恢復'), 'zh no auto-resume');
assert.ok(strings.includes('PAUSE-HINT-SYNC-001'), 'prior sync');
assert.ok(!/>點「繼續」返戰場 · 背景唔會自動恢復</.test(html), 'old short fallback gone');

console.log('pause-hint-fallback.test.mjs: PASS');
