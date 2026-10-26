/**
 * Safe-area tokens + chrome coverage (v0.9.37 / PHASE6-SAFE-AREA-001).
 * Run: node tests/safe-area.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(ROOT, 'css/game.css'), 'utf8');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');

assert.match(html, /viewport-fit\s*=\s*cover/);
assert.match(html, /\?v=0\.9\.\d+/);

assert.match(css, /:root\s*\{[^}]*--sa-top:\s*env\(safe-area-inset-top,\s*0px\)/s);
assert.match(css, /--sa-right:\s*env\(safe-area-inset-right,\s*0px\)/);
assert.match(css, /--sa-bottom:\s*env\(safe-area-inset-bottom,\s*0px\)/);
assert.match(css, /--sa-left:\s*env\(safe-area-inset-left,\s*0px\)/);

// Must NOT be circular
assert.doesNotMatch(css, /--sa-top:\s*var\(--sa-top\)/);

const mustUse = [
  ['.hud-left {', 'var(--sa-left)'],
  ['.hud-buttons.top', 'var(--sa-right)'],
  ['.hud-goal {', 'var(--sa-top)'],
  ['.xp-bar {\n', 'var(--sa-bottom)'],
  ['.stick {\n', 'var(--sa-left)'],
  ['.stick {\n', 'var(--sa-bottom)'],
  ['.weapon-slots {', 'var(--sa-bottom)'],
  ['.beat-banner {', 'var(--sa-top)'],
  ['#screen-pause,', 'var(--sa-top)'],
  ['#screen-over,', 'var(--sa-bottom)'],
  ['#screen-level,', 'var(--sa-left)'],
];

for (const [sel, token] of mustUse) {
  const idx = css.indexOf(sel);
  assert.ok(idx >= 0, `missing selector ${sel}`);
  const window = css.slice(idx, idx + 900);
  assert.ok(window.includes(token), `${sel} should reference ${token}`);
}

// Decorative HUD chrome stays non-interactive
assert.match(css, /#hud \.hud-panel[\s\S]*?pointer-events:\s*none/);
assert.match(css, /\.weapon-slots[\s\S]*?pointer-events:\s*none/);
assert.match(css, /\.beat-banner[\s\S]*?pointer-events:\s*none/);

console.log('safe-area.test.mjs OK');
