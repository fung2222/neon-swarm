/**
 * HOME-MECH-CARD-TAP-001 (v0.9.72)
 * Home mech cards phone min-height ≥44. No unlock invent / Phase4 / horn.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(72|[8-9]\d)/.test(html) || /\?v=0\.9\.7[2-9]/.test(html), 'cache-bust ≥0.9.72');
assert.ok(css.includes('HOME-MECH-CARD-TAP-001'), 'ship id in CSS');
assert.ok(agent.includes('HOME-MECH-CARD-TAP-001') || agent.includes('0.9.72'), 'AGENT_TASK');
assert.match(css, /\.mech-card\s*\{[^}]*min-height:\s*44px/s, 'mech-card ≥44');
assert.ok(css.includes('HUD-MUTE-PAUSE-TAP-001'), 'mute-pause kept');
assert.ok(css.includes('HOME-SETTINGS-TAP-001'), 'settings tap kept');

console.log('home-mech-card-tap.test.mjs: PASS');
