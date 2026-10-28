/**
 * HANDOFF-GLOW-SETTINGS-NOTE-001 (v0.9.160)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../vendor/cyber-kit/ui/ui.js', import.meta.url), 'utf8');
const hand = readFileSync(new URL('../docs/HANDOFF.md', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(16\d|[2-9]\d\d)/.test(html) || html.includes('?v=0.9.160'), 'soft-pin ≥0.9.160');
assert.ok(agent.includes('HANDOFF-GLOW-SETTINGS-NOTE-001') || agent.includes('0.9.160'), 'AGENT_TASK');


assert.ok(hand.includes('HANDOFF-GLOW-SETTINGS-NOTE-001'), 'handoff note');
assert.ok(hand.includes('no') && (hand.includes('btn-glow') || hand.includes('glowToggle')), 'no pause glow');
assert.ok(hand.includes('畫質') || hand.includes('settings'), 'settings quality');
assert.ok(!main.includes('ui.glowToggle(stage)'), 'code still clean');

console.log('handoff-glow-settings-note.test.mjs: PASS');
