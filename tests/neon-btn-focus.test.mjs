/**
 * NEON-BTN-FOCUS-001 (v0.9.108)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.108/.test(html), 'cache-bust');
assert.ok(css.includes('NEON-BTN-FOCUS-001'), 'ship id');
assert.ok(agent.includes('NEON-BTN-FOCUS-001') || agent.includes('0.9.108'), 'AGENT_TASK');
assert.match(css, /\.neon-btn:focus-visible\s*\{[^}]*outline:\s*2px\s+solid/s, 'outline');
assert.ok(css.includes('#00e5ff'), 'cyan');
console.log('neon-btn-focus.test.mjs: PASS');
