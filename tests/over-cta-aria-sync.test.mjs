/**
 * OVER-CTA-ARIA-SYNC-001 (v0.9.167)
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

assert.ok((() => {
  const m = html.match(/\?v=0\.9\.(\d+)/);
  return m && Number(m[1]) >= 167;
})(), 'soft-pin ≥0.9.167');
assert.ok(agent.includes('OVER-CTA-ARIA-SYNC-001') || agent.includes('0.9.167') || /0\.9\.\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');


assert.ok(html.includes('OVER-CTA-ARIA-SYNC-001'), 'ship id');
assert.ok(html.includes('btn-retry') && html.includes('data-i18n-attr="aria-label:retry"'), 'retry aria');
assert.ok(html.includes('data-i18n-attr="aria-label:menu"'), 'menu aria');
assert.ok(html.includes('PAUSE-CTA-ARIA-SYNC-001'), 'pause aria prior kept');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');

console.log('over-cta-aria-sync.test.mjs: PASS');
