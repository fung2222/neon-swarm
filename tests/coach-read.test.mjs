/**
 * COACH-READ-001 (v0.9.139)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(new RegExp('\\?v=0\\.9\\.' + '139'.replace(/^(\d+)$/, (m) => {
  // soft ≥ pattern built below
  return m;
})).test('x') || true);


assert.ok(/\?v=0\.9\.(139|1[4-9]\d)/.test(html), 'cache-bust ≥0.9.139');
assert.ok(css.includes('COACH-READ-001'), 'ship id');
assert.ok(agent.includes('COACH-READ-001') || agent.includes('0.9.139'), 'AGENT_TASK');
assert.match(css, /COACH-READ-001[\s\S]*?\.run-coach-zh[\s\S]*?color:\s*#f0ffff/s, 'zh color');
assert.match(css, /COACH-READ-001[\s\S]*?\.run-coach-en[\s\S]*?color:\s*#9ecfff/s, 'en color');

console.log('coach-read.test.mjs: PASS');
