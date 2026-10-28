/**
 * PAUSE-CTA-ARIA-SYNC-001 (v0.9.156)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../vendor/cyber-kit/ui/ui.js', import.meta.url), 'utf8');
const hand = readFileSync(new URL('../docs/HANDOFF.md', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');

assert.ok(html.includes('?v=0.9.156') || /\\?v=0\\.9\\.\\d+/.test(html), 'cache-bust tip');
assert.ok(agent.includes('PAUSE-CTA-ARIA-SYNC-001') || agent.includes('0.9.156'), 'AGENT_TASK');


assert.ok(html.includes('PAUSE-CTA-ARIA-SYNC-001'), 'ship id');
assert.ok(html.includes('btn-resume') && html.includes('data-i18n-attr="aria-label:resume"'), 'resume aria');
assert.ok(html.includes('data-i18n-attr="aria-label:restart"'), 'restart aria');
assert.ok(html.includes('data-i18n-attr="aria-label:quit"'), 'quit aria');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'still no pause glow');

console.log('pause-cta-aria-sync.test.mjs: PASS');
