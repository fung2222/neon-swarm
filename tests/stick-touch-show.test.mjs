/**
 * STICK-TOUCH-SHOW-001 (v0.9.65)
 * Idle virtual stick fully invisible; show only under finger while pressed; hide on release.
 * Run: node tests/stick-touch-show.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(6[5-9]|[7-9]\d)/.test(html), 'cache-bust ≥0.9.65');
assert.ok(css.includes('STICK-TOUCH-SHOW-001'), 'ship id in CSS');
assert.ok(main.includes('STICK-TOUCH-SHOW-001'), 'ship id in main');
assert.ok(agent.includes('STICK-TOUCH-SHOW-001') || /0\.9\.6[5-9]/.test(agent), 'AGENT_TASK mentions ship');

// Idle stick must not be a visible corner ghost
assert.match(css, /\.stick\s*\{[^}]*opacity:\s*0/s, 'default stick opacity 0');
assert.match(css, /\.stick\s*\{[^}]*visibility:\s*hidden/s, 'default stick visibility hidden');
assert.ok(!/opacity:\s*0\.28/.test(css.match(/\.stick[\s\S]*?\.stick-base/)?.[0] || ''), 'no 0.28 idle opacity in stick block');
assert.match(css, /\.stick\.ready\s*\{[^}]*opacity:\s*0/s, 'ready no longer reveals stick');
assert.match(css, /\.stick\.ready\.hint-pulse\s*\{[^}]*opacity:\s*0/s, 'hint-pulse no longer reveals stick');
assert.match(css, /\.stick\.following,\s*\.stick\.active\s*\{[^}]*opacity:\s*1/s, 'active stick opaque');
assert.match(css, /\.stick\.following,\s*\.stick\.active\s*\{[^}]*visibility:\s*visible/s, 'active stick visible');

// startRun / resume keep hidden; no pulseStickHint on start; resetHome re-hides
assert.ok(main.includes("classList.add('hidden')"), 're-hide path present');
assert.ok(!/if \(touch\) pulseStickHint\(\)/.test(main), 'startRun must not pulse idle stick hint');
assert.ok(main.includes("root.classList.add('hidden')"), 'resetHome adds hidden on release');
assert.ok(main.includes("root.classList.remove('hidden')"), 'begin removes hidden on press');
assert.ok(main.includes('placeAt'), 'relocate under finger kept');
assert.ok(main.includes('TAP_WINDOW_MS'), 'multi-tap kept');
assert.ok(main.includes('activateSecondaryFromTap') || main.includes('noteTap'), 'dbl-tap path kept');
assert.ok(main.includes('activateThrowFromTap') || main.includes('n >= 3'), 'tpl-tap path kept');

console.log('stick-touch-show.test.mjs: PASS');
