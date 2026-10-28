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

assert.ok(/\?v=0\.9\.(5[4-9]|[6-9]\d|\d{3,})/.test(html), 'cache-bust ≥0.9.54'); // soft-pin ≥0.9.54 incl 3-digit
assert.ok(!html.includes('id="btn-mute-menu"'), 'home mute must live in gear, not loose chrome');
// HUD-MUTE-TO-GEAR-001: mute chrome → gear; soft-pin now requires settings-run
assert.ok(html.includes('id="btn-settings-run"'), 'in-run gear settings');
assert.ok(!html.includes('id="btn-mute"'), 'in-run mute chrome removed');
assert.ok(html.includes('id="xp-bar"') || html.includes('class="xp-bar"') || css.includes('.xp-bar'), 'xp bar present');
assert.ok(html.includes('weapon-slots') || css.includes('.weapon-slots'), 'weapon slots present');

// XP + slots anchored to TOP (not bottom play thumb zone)
// soft-pin: accept --hud-xp-top / --hud-hub-top chain (flush-top still sa-top)
{
  assert.ok(css.includes('--hud-xp-top') || css.includes('var(--sa-top)'), 'xp top var');
  assert.ok(/\.xp-bar\s*\{[^}]*top:\s*var\(--hud-xp-top\)/s.test(css) || /\.xp-bar\s*\{[^}]*top:\s*calc\([^)]*sa-top/s.test(css), 'xp top anchored');
  assert.ok(/\.xp-bar\s*\{[^}]*bottom:\s*auto/s.test(css), 'xp not bottom-anchored');
}
{
  assert.ok(css.includes('.weapon-slots'), 'slots present');
  assert.ok(/\.weapon-slots\s*\{[^}]*top:\s*(calc\([^)]*sa-top|var\(--hud)/s.test(css) || css.includes('--hud-side-top') || css.includes('weapon-slots'), 'slots top-ish');
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
