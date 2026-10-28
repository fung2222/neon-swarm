/**
 * OVER-RESULT-READ-001 (v0.9.132) — over result/hi-line phone readability.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(13[2-9]|1[4-9]\d)/.test(html), 'cache-bust ≥0.9.132');
assert.ok(css.includes('OVER-RESULT-READ-001'), 'ship id');
assert.ok(agent.includes('OVER-RESULT-READ-001') || agent.includes('0.9.132'), 'AGENT_TASK');
assert.match(css, /#screen-over\s+\.hi-line\s*\{[^}]*color:\s*#ffe600/s, 'hi-line yellow');
assert.match(css, /#screen-over\s+\.result\s+i\s*\{[^}]*color:\s*#ffe600/s, 'best yellow');
assert.ok(css.includes('OVER-TITLE-ONELINE-001'), 'prior title kept');
console.log('over-result-read.test.mjs: PASS');
