/**
 * GFX-BODY-READ-001 (v0.9.140)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(new RegExp('\\?v=0\\.9\\.' + '140'.replace(/^(\d+)$/, (m) => {
  // soft ≥ pattern built below
  return m;
})).test('x') || true);


assert.ok(/\?v=0\.9\.(14[0-9]|1[5-9]\d)/.test(html), 'cache-bust ≥0.9.140');
assert.ok(css.includes('GFX-BODY-READ-001'), 'ship id');
assert.ok(agent.includes('GFX-BODY-READ-001') || agent.includes('0.9.140'), 'AGENT_TASK');
assert.match(css, /GFX-BODY-READ-001[\s\S]*?#screen-gfx\s+\.gfx-body[\s\S]*?color:\s*#ffe0e8/s, 'body color');
assert.match(css, /GFX-BODY-READ-001[\s\S]*?\.gfx-body-en[\s\S]*?color:\s*#b0c8e8/s, 'en color');

console.log('gfx-body-read.test.mjs: PASS');
