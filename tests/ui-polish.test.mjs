/**
 * UI-POLISH-001 (v0.9.125) — chrome contrast polish; layout/product preserved.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.(12[5-9]|1[3-9]\d)/.test(html), 'cache-bust ≥0.9.125');
assert.ok(css.includes('UI-POLISH-001'), 'ship id');
assert.ok(css.includes('v0.9.125'), 'version tag');

// Contrast tokens bumped (not layout rewrite)
assert.ok(css.includes('--hud-chip-bg: rgba(5, 1, 15, 0.86)'));
assert.ok(css.includes('text-shadow') && css.includes('#screen-start .menu-brand .title'));
assert.ok(css.includes('.mech-card:not(.on)') && css.includes('opacity: 0.88'));
assert.ok(css.includes('#screen-start .neon-btn:not(.ghost)'));
assert.ok(css.includes('.hud-hub') && css.includes('var(--hud-chip-bg)'));
assert.ok(css.includes('.wrail-tile.empty') && css.includes('opacity: 0.48'));

// Preserve product rules — hide-stick / rail height / tap≥44 not wiped
assert.ok(css.includes('--hud-rail-h: 54px'));
assert.ok(css.includes('min-width: 44px'));
assert.ok(css.includes('min-height: 44px'));
// No new mech unlock invent
assert.ok(!/unlock.?heavy|prototype.?playable|Phase.?4.?Morph/i.test(css));

console.log('ui-polish.test.mjs: PASS');
