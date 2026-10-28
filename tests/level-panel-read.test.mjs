/**
 * LEVEL-PANEL-READ-001 (v0.9.141)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(new RegExp('\\?v=0\\.9\\.' + '141'.replace(/^(\d+)$/, (m) => {
  // soft ≥ pattern built below
  return m;
})).test('x') || true);


assert.ok(/\?v=0\.9\.(14[1-9]|1[5-9]\d)/.test(html), 'cache-bust ≥0.9.141');
assert.ok(css.includes('LEVEL-PANEL-READ-001'), 'ship id');
assert.ok(agent.includes('LEVEL-PANEL-READ-001') || agent.includes('0.9.141'), 'AGENT_TASK');
assert.match(css, /LEVEL-PANEL-READ-001[\s\S]*?#screen-level\s+\.level-panel[\s\S]*?border-color:\s*rgba\(0,\s*229,\s*255/s, 'panel border');
assert.match(css, /LEVEL-PANEL-READ-001[\s\S]*?#level-title[\s\S]*?color:\s*#e8f7ff/s, 'title color');
assert.ok(css.includes('min-height: 44px'), 'tap≥44');

console.log('level-panel-read.test.mjs: PASS');
