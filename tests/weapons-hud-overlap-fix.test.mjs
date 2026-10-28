/**
 * WEAPONS-HUD-OVERLAP-FIX-001 (v0.9.60)
 * In-run HUD vertical rhythm: no shared bands; weapon-status under XP only.
 * Run: node tests/weapons-hud-overlap-fix.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(6\d|[7-9]\d)/.test(html), 'cache-bust ≥0.9.60');
assert.ok(css.includes('WEAPONS-HUD-OVERLAP-FIX-001'), 'ship id in CSS');
assert.ok(css.includes('--hud-row1-top'), 'row1 token');
assert.ok(css.includes('--hud-xp-top'), 'xp token');
assert.ok(css.includes('--hud-wstat-top'), 'wstat token');
assert.ok(css.includes('--hud-side-top'), 'side token');
assert.ok(css.includes('--hud-stick-clear'), 'stick clear token');
assert.ok(css.includes('--hud-chip-radius'), 'unified chip tokens kept');

// weapon-status must use reserved band under XP (not floating over row1)
assert.match(css, /\.weapon-status\s*\{[^}]*top:\s*var\(--hud-wstat-top\)/s);
assert.match(css, /\.weapon-status\s*\{[^}]*transform:\s*none/s);
assert.ok(!/weapon-status\s*\{[^}]*top:\s*calc\(3[46]px/s.test(css), 'no legacy 34/36px weapon-status top');

// XP alone on its band
assert.match(css, /\.xp-bar\s*\{[^}]*top:\s*var\(--hud-xp-top\)/s);

// Row1 panels + buttons share --hud-row1-top
assert.match(css, /\.hud-panel\s*\{[^}]*top:\s*var\(--hud-row1-top\)/s);
assert.match(css, /\.hud-buttons\.top\s*\{[^}]*top:\s*var\(--hud-row1-top\)/s);

// Goal / zone below XP+status
assert.match(css, /\.hud-goal\s*\{[^}]*top:\s*var\(--hud-side-top\)/s);
assert.match(css, /\.hud-zone\s*\{[^}]*top:\s*calc\(var\(--hud-side-top\)/s);

// Stick raised above rail band
assert.match(css, /\.stick\s*\{[^}]*bottom:\s*var\(--hud-stick-clear\)/s);

// DOM still has weapon-status + rail (syncWeaponHud intact)
assert.ok(html.includes('id="weapon-status"'), 'weapon-status in DOM');
assert.ok(html.includes('id="weapon-rail"'), 'weapon-rail in DOM');
assert.ok(main.includes('syncWeaponHud'), 'syncWeaponHud kept');
assert.ok(main.includes('TAP_WINDOW_MS'), 'multi-tap kept');
assert.ok(main.includes('activateSecondaryFromTap') || main.includes('secondaryBurst'), 'burst path kept');

assert.ok(agent.includes('WEAPONS-HUD-OVERLAP-FIX-001') || agent.includes('0.9.60'), 'AGENT_TASK ship id');

console.log('weapons-hud-overlap-fix.test.mjs: PASS');
