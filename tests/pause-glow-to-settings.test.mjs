/**
 * PAUSE-GLOW-TO-SETTINGS-001 (v0.9.154)
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

assert.ok(html.includes('?v=0.9.154') || /\\?v=0\\.9\\.\\d+/.test(html), 'cache-bust tip');
assert.ok(agent.includes('PAUSE-GLOW-TO-SETTINGS-001') || agent.includes('0.9.154'), 'AGENT_TASK');


assert.ok(!main.includes('ui.glowToggle(stage)'), 'no pause glowToggle call');
assert.ok(main.includes('PAUSE-GLOW-TO-SETTINGS-001') || main.includes('mountSettings'), 'settings-only note');
assert.ok(main.includes('stage.setGlow'), 'setGlow kept for settings/quality');
assert.ok(main.includes('mountSettings'), 'settings mounted');
assert.ok(strings.includes("'kit.glowLabel'") && strings.includes('畫質'), 'quality label kept');
assert.ok(ui.includes("data-set=\"glow\"") || ui.includes("data-set='glow'") || ui.includes('kit.glowLabel'), 'kit settings glow row');
assert.ok(!html.includes('id="btn-glow"'), 'no static btn-glow in HTML');

console.log('pause-glow-to-settings.test.mjs: PASS');
