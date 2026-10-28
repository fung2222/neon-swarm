/**
 * OVER-NOTE-READ-001 (v0.9.131) — over death-note / killedBy phone readability.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.131/.test(html), 'cache-bust');
assert.ok(css.includes('OVER-NOTE-READ-001'), 'ship id');
assert.ok(agent.includes('OVER-NOTE-READ-001') || agent.includes('0.9.131'), 'AGENT_TASK');
assert.match(css, /#screen-over\s+#over-note[^{]*\{[^}]*color:\s*#ffe08a/s, 'amber');
assert.match(css, /#screen-over\s+#over-note[^{]*\{[^}]*opacity:\s*1/s, 'full opacity');
assert.ok(css.includes('OVER-TITLE-ONELINE-001'), 'prior title kept');
console.log('over-note-read.test.mjs: PASS');
