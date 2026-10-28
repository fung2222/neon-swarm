/**
 * UI-LAYOUT-HOME-HUD-001 (v0.9.52) — home gear settings + top XP/slots layout hooks.
 * Run: node tests/ui-layout-home-hud.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(ROOT, 'css/game.css'), 'utf8');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const main = readFileSync(join(ROOT, 'js/main.js'), 'utf8');

assert.match(html, /\?v=0\.9\.(5[4-9]|[6-9]\d)/); // ≥0.9.54 (HOME-SETTINGS-TAP-001 relaxed)
assert.ok(!html.includes('id="btn-mute-menu"'), 'home mute must live in gear, not loose chrome');
assert.ok(html.includes('id="btn-mute"'), 'in-run mute remains');
assert.ok(html.includes('id="xp-bar"') || html.includes('class="xp-bar"') || css.includes('.xp-bar'), 'xp bar present');
assert.ok(html.includes('weapon-slots') || css.includes('.weapon-slots'), 'weapon slots present');

// XP + slots anchored to TOP (not bottom play thumb zone)
{
  const xpIdx = css.indexOf('/* v0.9.52: XP bar at TOP');
  assert.ok(xpIdx >= 0, 'xp top comment');
  const xpWin = css.slice(css.indexOf('.xp-bar {'), css.indexOf('.xp-bar {') + 500);
  assert.ok(xpWin.includes('top: calc(') && xpWin.includes('var(--sa-top)'), 'xp uses sa-top');
  assert.ok(xpWin.includes('bottom: auto'), 'xp not bottom-anchored');
}
{
  const wsIdx = css.indexOf('.weapon-slots {');
  assert.ok(wsIdx >= 0);
  const win = css.slice(wsIdx, wsIdx + 550);
  assert.ok(win.includes('top: calc(') && win.includes('var(--sa-top)'), 'slots use sa-top');
  assert.ok(win.includes('bottom: auto'), 'slots not bottom-anchored');
}

// Mech cards shrunk + selected highlight
assert.ok(css.includes('UI-LAYOUT-HOME-HUD-001') || css.includes('v0.9.52: shrink cards'), 'layout marker');
assert.match(css, /\.mech-card\.on\s*\{[^}]*scale\(1\.04\)/s);
assert.match(css, /\.mech-card:not\(\.on\)\s*\{\s*opacity:\s*0\.78/);

// CTA pulled toward bottom (lower --menu-cta-bottom floors than pre-0.9.52)
assert.match(css, /--menu-cta-bottom:\s*max\(52px/);
assert.match(css, /--menu-cta-bottom:\s*max\(28px/);
assert.match(css, /--menu-cta-bottom:\s*max\(40px/);
assert.match(css, /--menu-cta-bottom:\s*max\(36px/);

// Gear settings owns mute
assert.ok(main.includes('ui.mountSettings'), 'mountSettings');
assert.ok(main.includes('toggleMutePersist()'), 'settings mute persist');
assert.ok(!main.includes('btn-mute-menu'), 'no menu mute id in main');

console.log('ui-layout-home-hud.test.mjs OK');
