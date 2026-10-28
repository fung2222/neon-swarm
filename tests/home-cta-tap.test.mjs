/**
 * HOME-CTA-TAP-001 (v0.9.77)
 * Home play + endless neon-btn ≥44 (phone) / 48 desktop.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(77|[8-9]\d)/.test(html) || /\?v=0\.9\.7[7-9]/.test(html), 'cache-bust ≥0.9.77');
assert.ok(css.includes('HOME-CTA-TAP-001'), 'ship id in CSS');
assert.ok(agent.includes('HOME-CTA-TAP-001') || agent.includes('0.9.77'), 'AGENT_TASK');
assert.match(css, /#screen-start\s+#btn-play[\s\S]*?min-height:\s*48px/, 'play ≥48');
assert.match(css, /#btn-endless[\s\S]*?min-height:\s*48px/, 'endless ≥48 block');
assert.match(css, /@media\s*\(max-width:\s*760px\)\s*\{[^}]*#btn-play[^}]*min-height:\s*44px/s, 'play ≥44 phone');
assert.ok(css.includes('OVER-CTA-TAP-001'), 'prior over cta kept');
assert.ok(css.includes('HOME-MECH-CARD-TAP-001') || css.includes('mech-card'), 'mech card prior');

console.log('home-cta-tap.test.mjs: PASS');
