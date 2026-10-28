/**
 * HUD-MUTE-PAUSE-TAP-001 (v0.9.71)
 * In-run mute/pause icon-btn ≥44×44 (was 36 desktop / 34 phone).
 * No weapon / Phase4 / horn / soft-juice / BALANCE change.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(7[1-9]|[8-9]\d|\d{3,})/.test(html), 'cache-bust ≥0.9.71');
assert.ok(css.includes('HUD-MUTE-PAUSE-TAP-001'), 'ship id in CSS');
assert.ok(agent.includes('HUD-MUTE-PAUSE-TAP-001') || agent.includes('0.9.71') || /0\.9\.\d{3,}/.test(agent) || agent.includes('HOLD') || agent.includes('Active'), 'AGENT_TASK soft');
// Top HUD buttons ≥44 (no leftover 34/36 shrink without override)
assert.match(css, /\.hud-buttons\.top\s+\.icon-btn\s*\{[^}]*min-width:\s*44px/s, 'mute/pause ≥44');
assert.ok(!/\.hud-buttons\.top\s+\.icon-btn\s*\{\s*width:\s*34px/.test(css), 'no 34px shrink');
assert.ok(!/\.hud-buttons\.top\s+\.icon-btn\s*\{\s*width:\s*36px/.test(css), 'no 36px shrink');
// Preserve prior ships
assert.ok(css.includes('HOME-SETTINGS-TAP-001'), 'home settings tap kept');
assert.ok(css.includes('WEAPONS-RAIL-TAP-TARGET-001') || css.includes('--hud-rail-h'), 'rail tap kept');

console.log('hud-mute-pause-tap.test.mjs: PASS');
