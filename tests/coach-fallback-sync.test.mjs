/**
 * COACH-FALLBACK-SYNC-001 (v0.9.138)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(new RegExp('\\?v=0\\.9\\.' + '138'.replace(/^(\d+)$/, (m) => {
  // soft ≥ pattern built below
  return m;
})).test('x') || true);


assert.ok(/\?v=0\.9\.(138|139|1[4-9]\d)/.test(html), 'cache-bust ≥0.9.138');
assert.ok(html.includes('COACH-FALLBACK-SYNC-001'), 'ship comment');
assert.ok(agent.includes('COACH-FALLBACK-SYNC-001') || agent.includes('0.9.138'), 'AGENT_TASK');
assert.ok(html.includes('雙擊副／三擊投'), 'zh dbl/tpl');
assert.ok(html.includes('底欄切槍'), 'zh rail');
assert.ok(html.includes('DBL SEC / TPL THROW'), 'en dbl/tpl');
assert.ok(strings.includes('COACH-CONTROLS-SYNC-001'), 'prior coach sync');
assert.ok(!/>拖移移動 · 自動開火</.test(html), 'old short coach gone');

console.log('coach-fallback-sync.test.mjs: PASS');
