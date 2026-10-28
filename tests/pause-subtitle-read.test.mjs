/**
 * PAUSE-SUBTITLE-READ-001 (v0.9.137)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(new RegExp('\\?v=0\\.9\\.' + '137'.replace(/^(\d+)$/, (m) => {
  // soft ≥ pattern built below
  return m;
})).test('x') || true);


assert.ok(/\?v=0\.9\.(13[7-9]|1[4-9]\d)/.test(html), 'cache-bust ≥0.9.137');
assert.ok(css.includes('PAUSE-SUBTITLE-READ-001'), 'ship id');
assert.ok(agent.includes('PAUSE-SUBTITLE-READ-001') || agent.includes('0.9.137'), 'AGENT_TASK');
assert.match(css, /PAUSE-SUBTITLE-READ-001[\s\S]*?#screen-pause\s+\.title-en[\s\S]*?color:\s*#9ecfff/s, 'cyan en');
assert.match(css, /PAUSE-SUBTITLE-READ-001[\s\S]*?white-space:\s*nowrap/s, 'nowrap');

console.log('pause-subtitle-read.test.mjs: PASS');
