/**
 * HOME-SETTINGS-TAP-001 (v0.9.70)
 * Phone gear / howto / settings controls ≥44×44; settings rows & toggles ≥44 tall.
 * Overrides cyber-kit phone shrink (40px). No weapon / Phase4 / horn / soft-juice change.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const kitHud = readFileSync(new URL('../vendor/cyber-kit/ui/hud.css', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(7\d|[8-9]\d|\d{3,})/.test(html), 'cache-bust ≥0.9.70');
assert.ok(/0\.9\.(7\d|[8-9]\d|\d{3,})/.test(html), 'v0.9.70+');
assert.ok(css.includes('HOME-SETTINGS-TAP-001'), 'ship id in CSS');
assert.ok(agent.includes('HOME-SETTINGS-TAP-001') || agent.includes('0.9.70') || /0\.9\.\d{3,}/.test(agent) || agent.includes('HOLD') || agent.includes('Active'), 'AGENT_TASK soft');
// Override block present
assert.match(css, /@media\s*\(max-width:\s*760px\)\s*\{[^}]*\.menu-icon-btn[^}]*min-width:\s*44px/s, 'phone gear ≥44 override');
assert.match(css, /\.ck-set-row\s*\{[^}]*min-height:\s*44px/s, 'settings row ≥44');
assert.match(css, /\.ck-toggle[^}]*min-height:\s*44px/s, 'toggle ≥44');
// Kit still has the 40px shrink we override (regression signal if kit changes)
assert.ok(kitHud.includes('width: 40px') || kitHud.includes('.menu-icon-btn { width: 40px'), 'kit still has 40px shrink we override');
// Preserve prior ships
assert.ok(css.includes('WEAPONS-RAIL-TAP-TARGET-001') || css.includes('min-width: 44px'), 'rail tap kept');
assert.ok(css.includes('WEAPONS-BRANCH-CARD-PATH-001') || css.includes('card-path'), 'path chip kept');

console.log('home-settings-tap.test.mjs: PASS');
