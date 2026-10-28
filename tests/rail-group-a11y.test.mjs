/**
 * RAIL-GROUP-A11Y-001 (v0.9.90)
 * wrail-group has role=group + aria-label P/S/T; no visible name labels.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.90/.test(html), 'cache-bust 0.9.90');
assert.ok(main.includes('RAIL-GROUP-A11Y-001'), 'ship id');
assert.ok(agent.includes('RAIL-GROUP-A11Y-001') || agent.includes('0.9.90'), 'AGENT_TASK');
assert.ok(main.includes("setAttribute('role', 'group')"), 'role=group');
assert.ok(main.includes("setAttribute('aria-label'"), 'aria-label');
assert.ok(main.includes('主武器') && main.includes('Primary'), 'aria copy');
assert.ok(main.includes('副武器') && main.includes('投擲'), 'aria zh');
// color-only preserved — labels stay display:none
assert.ok(css.includes('.weapon-rail .wrail-label'), 'label rule exists');
assert.match(css, /\.weapon-rail\s+\.wrail-label[\s\S]{0,80}display:\s*none/, 'no visible labels');
assert.ok(main.includes('Color-only groups') || main.includes('no text labels on rail'), 'color-only comment kept');

console.log('rail-group-a11y.test.mjs: PASS');
