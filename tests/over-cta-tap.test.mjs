/**
 * OVER-CTA-TAP-001 (v0.9.76)
 * Over-screen retry/menu/share neon-btn ≥44 (phone) / 48 desktop.
 * No weapon / Phase4 / horn / soft-juice / BALANCE change.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(76|[8-9]\d)/.test(html) || /\?v=0\.9\.7[6-9]/.test(html), 'cache-bust ≥0.9.76');
assert.ok(css.includes('OVER-CTA-TAP-001'), 'ship id in CSS');
assert.ok(agent.includes('OVER-CTA-TAP-001') || agent.includes('0.9.76'), 'AGENT_TASK');
assert.match(css, /#screen-over\s+\.neon-btn\s*\{[^}]*min-height:\s*48px/s, 'over CTA ≥48 desktop');
assert.match(css, /@media\s*\(max-width:\s*520px\)\s*\{[^}]*#screen-over\s+\.neon-btn[^}]*min-height:\s*44px/s, 'over CTA ≥44 phone');
assert.ok(css.includes('HUD-MUTE-PAUSE-TAP-001'), 'prior mute/pause kept');
assert.ok(css.includes('HOME-SETTINGS-TAP-001'), 'prior settings kept');

console.log('over-cta-tap.test.mjs: PASS');
