/**
 * SETTINGS-QUALITY-SHARE-HOWTO-001 (v0.9.147)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../vendor/cyber-kit/ui/ui.js', import.meta.url), 'utf8');

assert.ok(html.includes('?v=0.9.147') || /\\?v=0\\.9\\.\\d+/.test(html), 'cache-bust tip');
assert.ok(agent.includes('SETTINGS-QUALITY-SHARE-HOWTO-001') || agent.includes('0.9.147'), 'AGENT_TASK');


assert.ok(strings.includes("'kit.glowLabel'") && strings.includes('畫質'), 'quality label');
assert.ok(ui.includes("ex.type === 'action'"), 'kit action extras');
assert.ok(main.includes("id: 'share'") && main.includes("id: 'howto'"), 'share+howto extras');
assert.ok(main.includes('onShareFromSettings') && main.includes('openHowtoFromSettings'), 'handlers');
assert.ok(main.includes("S.state === 'play') pauseRun"), 'pause-on-open');
assert.ok(strings.includes('settings.share') && strings.includes('settings.howto'), 'strings');

console.log('settings-quality-share-howto.test.mjs: PASS');
