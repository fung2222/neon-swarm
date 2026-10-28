/**
 * GFX-RELOAD-TAP-001 (v0.9.79)
 * Gfx recover reload CTA ≥44 phone / 48 desktop. No deep GPU invent.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(79|[8-9]\d)/.test(html) || /\?v=0\.9\.79/.test(html), 'cache-bust ≥0.9.79');
assert.ok(css.includes('GFX-RELOAD-TAP-001'), 'ship id in CSS');
assert.ok(agent.includes('GFX-RELOAD-TAP-001') || agent.includes('0.9.79'), 'AGENT_TASK');
assert.match(css, /#btn-gfx-reload[\s\S]*?min-height:\s*48px/, 'reload ≥48');
assert.match(css, /@media\s*\(max-width:\s*520px\)\s*\{[^}]*#btn-gfx-reload[^}]*min-height:\s*44px/s, 'reload ≥44 phone');
assert.ok(css.includes('HOME-CTA-TAP-001'), 'prior home cta');
assert.ok(css.includes('OVER-CTA-TAP-001'), 'prior over cta');
assert.ok(html.includes('btn-gfx-reload'), 'reload button exists');

console.log('gfx-reload-tap.test.mjs: PASS');
