/**
 * OVER-SUBTITLE-CHROME-001 (v0.9.128) — over EN subtitle chrome readable on phone.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.128/.test(html), 'cache-bust');
assert.ok(css.includes('OVER-SUBTITLE-CHROME-001'), 'ship id');
assert.ok(agent.includes('OVER-SUBTITLE-CHROME-001') || agent.includes('0.9.128'), 'AGENT_TASK');
assert.match(css, /#screen-over\s+\.title-en\s*\{[^}]*letter-spacing:\s*0\.22em/s, 'tracking');
assert.match(css, /#screen-over\s+\.title-en\s*\{[^}]*white-space:\s*nowrap/s, 'nowrap');
assert.ok(css.includes('OVER-TITLE-ONELINE-001'), 'prior title kept');
console.log('over-subtitle-chrome.test.mjs: PASS');
