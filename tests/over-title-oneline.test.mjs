/**
 * OVER-TITLE-ONELINE-001 (v0.9.127)
 * Over title copy「你已經被制止」+ white-space:nowrap (no orphan wrap / no <br>).
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(12[7-9]|1[3-9]\d)/.test(html), 'cache-bust ≥0.9.127');
assert.ok(css.includes('OVER-TITLE-ONELINE-001'), 'ship id in CSS');
assert.ok(css.includes('v0.9.127'), 'version tag');
assert.ok(agent.includes('OVER-TITLE-ONELINE-001') || agent.includes('0.9.127'), 'AGENT_TASK');

assert.ok(strings.includes("over: ['你已經被制止', 'YOU WERE STOPPED']"), 'zh copy');
assert.ok(!strings.includes('你被制止咗'), 'old orphan-prone copy gone');
assert.ok(html.includes('你已經被制止'), 'html fallback');
assert.ok(!/<br\s*\/?>/i.test(html.match(/id="over-title"[^>]*>[\s\S]*?<\/h2>/)?.[0] || ''), 'no br in title');

assert.match(css, /#screen-over\s+\.title2[\s\S]*?white-space:\s*nowrap/, 'nowrap on title2');
assert.match(css, /#over-title[\s\S]*?white-space:\s*nowrap|#screen-over\s+\.title2,\s*\n?#over-title[\s\S]*?white-space:\s*nowrap/, 'nowrap covers #over-title');
assert.ok(css.includes('clamp(22px, 6.2vw, 36px)') || /font-size:\s*clamp\(/.test(css.slice(css.indexOf('OVER-TITLE-ONELINE-001'))), 'tighter clamp');
assert.match(css, /#screen-over\s+\.glitch::before[\s\S]*?white-space:\s*nowrap/, 'glitch nowrap');

// Preserve product rules
assert.ok(css.includes('--hud-rail-h: 54px'), 'rail height');
assert.ok(css.includes('min-height: 44px'), 'tap≥44');
assert.ok(!/Phase.?4.?Morph|unlock.?heavy/i.test(css.slice(css.indexOf('OVER-TITLE-ONELINE-001'))), 'no banned invent');

console.log('over-title-oneline.test.mjs: PASS');
