/**
 * SHARE-BTN-ARIA-FALLBACK-001 (v0.9.178)
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
  return m && Number(m[1]) >= 178;
})(), 'soft-pin ≥0.9.178');
assert.ok(agent.includes('SHARE-BTN-ARIA-FALLBACK-001') || agent.includes('0.9.178') || /0\.9\.\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');


assert.ok(html.includes('SHARE-BTN-ARIA-FALLBACK-001'), 'ship id');
assert.ok(/id="btn-share"[^>]*aria-label="分享戰績 SHARE RUN"/.test(html), 'static aria fallback');
assert.ok(main.includes('SHARE-BTN-ARIA-001') && main.includes('shareButtonLabels'), 'JS aria prior kept');
assert.ok(html.includes('SHARE-FALLBACK-SYNC-001') || html.includes('分享戰績'), 'share labels kept');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glow');

console.log('share-btn-aria-fallback.test.mjs: PASS');
