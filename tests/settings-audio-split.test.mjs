/**
 * SETTINGS-AUDIO-SPLIT-001 (v0.9.146)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../vendor/cyber-kit/ui/ui.js', import.meta.url), 'utf8');

assert.ok(html.includes('?v=0.9.146') || /\\?v=0\\.9\\.\\d+/.test(html), 'cache-bust tip');
assert.ok(agent.includes('SETTINGS-AUDIO-SPLIT-001') || agent.includes('0.9.146'), 'AGENT_TASK');


assert.ok(ui.includes("ex.type === 'slider'"), 'kit slider extras');
assert.ok(main.includes("setVolume(v, 'sfx')") || main.includes('setVolume(v, \'sfx\')') || main.includes("audio.setVolume(v, 'sfx')"), 'sfx wire');
assert.ok(main.includes("'music'") || main.includes('"music"'), 'bgm/music wire');
assert.ok(strings.includes("'settings.sfx'") || strings.includes('settings.sfx'), 'sfx string');
assert.ok(strings.includes("'settings.bgm'") || strings.includes('settings.bgm'), 'bgm string');
assert.ok(main.includes("id: 'sfx'") && main.includes("id: 'bgm'"), 'extras ids');

console.log('settings-audio-split.test.mjs: PASS');
