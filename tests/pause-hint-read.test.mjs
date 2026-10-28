/**
 * PAUSE-HINT-READ-001 (v0.9.136)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(new RegExp('\\?v=0\\.9\\.' + '136'.replace(/^(\d+)$/, (m) => {
  // soft ≥ pattern built below
  return m;
})).test('x') || true);


assert.ok(/\?v=0\.9\.(13[6-9]|1[4-9]\d)/.test(html), 'cache-bust ≥0.9.136');
assert.ok(css.includes('PAUSE-HINT-READ-001'), 'ship id');
assert.ok(agent.includes('PAUSE-HINT-READ-001') || agent.includes('0.9.136'), 'AGENT_TASK');
assert.match(css, /PAUSE-HINT-READ-001[\s\S]*?#screen-pause\s+\.pause-hint[\s\S]*?color:\s*#d8d0f0/s, 'hint color');
assert.ok(css.includes('OVER-TITLE-SIZE-001'), 'prior size');

console.log('pause-hint-read.test.mjs: PASS');
