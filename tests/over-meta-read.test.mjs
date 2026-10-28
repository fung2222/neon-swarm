/**
 * OVER-META-READ-001 (v0.9.130) — over meta panel phone readability chrome.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(13[0-9]|1[4-9]\d)/.test(html), 'cache-bust ≥0.9.130');
assert.ok(css.includes('OVER-META-READ-001'), 'ship id');
assert.ok(agent.includes('OVER-META-READ-001') || agent.includes('0.9.130'), 'AGENT_TASK');
assert.match(css, /#screen-over\s+\.over-meta\s*\{[^}]*border:\s*1px solid rgba\(0,\s*229,\s*255/s, 'cyan border');
assert.match(css, /#screen-over\s+\.over-meta-row\s+span\s*\{[^}]*color:\s*#9ecfff/s, 'label cyan');
assert.match(css, /#screen-over\s+\.over-meta-row\s+b\s*\{[^}]*overflow-wrap:\s*anywhere/s, 'loadout wrap');
assert.ok(css.includes('OVER-TITLE-ONELINE-001'), 'prior title kept');
console.log('over-meta-read.test.mjs: PASS');
