/**
 * HUD-MUTE-TO-GEAR-001 (v0.9.144)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../vendor/cyber-kit/ui/ui.js', import.meta.url), 'utf8');

assert.ok(html.includes('?v=0.9.144') || /\\?v=0\\.9\\.\\d+/.test(html), 'cache-bust tip');
assert.ok(agent.includes('HUD-MUTE-TO-GEAR-001') || agent.includes('0.9.144'), 'AGENT_TASK');


assert.ok(html.includes('btn-settings-run'), 'gear btn');
assert.ok(!html.includes('id="btn-mute"'), 'no mute btn');
assert.ok(html.includes('HUD-MUTE-TO-GEAR-001'), 'marker');
assert.ok(strings.includes('settingsTip'), 'settingsTip');
assert.ok(main.includes('openInRunSettings'), 'open settings');
assert.ok(main.includes('btn-settings-run'), 'listener');
assert.ok(main.includes('toggleMutePersist'), 'mute still persist via settings');

console.log('hud-mute-to-gear.test.mjs: PASS');
