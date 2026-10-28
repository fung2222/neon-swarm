/**
 * PAUSE-CTA-TAP-001 (v0.9.81)
 * Pause-screen resume/restart/quit neon-btn ≥44 (phone) / 48 desktop.
 * No weapon / Phase4 / horn / soft-juice / BALANCE change.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(81|[8-9]\d)/.test(html) || /\?v=0\.9\.8[1-9]/.test(html), 'cache-bust ≥0.9.81');
assert.ok(css.includes('PAUSE-CTA-TAP-001'), 'ship id in CSS');
assert.ok(agent.includes('PAUSE-CTA-TAP-001') || agent.includes('0.9.81'), 'AGENT_TASK');
assert.match(css, /#screen-pause\s+\.neon-btn\s*\{[^}]*min-height:\s*48px/s, 'pause CTA ≥48 desktop');
assert.match(css, /@media\s*\(max-width:\s*520px\)\s*\{[^}]*#screen-pause\s+\.neon-btn[^}]*min-height:\s*44px/s, 'pause CTA ≥44 phone');
assert.ok(css.includes('OVER-CTA-TAP-001'), 'prior over CTA kept');
assert.ok(css.includes('HOME-CTA-TAP-001'), 'prior home CTA kept');

console.log('pause-cta-tap.test.mjs: PASS');
