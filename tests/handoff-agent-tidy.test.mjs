/**
 * HANDOFF-AGENT-TIDY-001 (v0.9.152)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../vendor/cyber-kit/ui/ui.js', import.meta.url), 'utf8');

assert.ok(html.includes('?v=0.9.152') || /\\?v=0\\.9\\.\\d+/.test(html), 'cache-bust tip');
assert.ok(agent.includes('HANDOFF-AGENT-TIDY-001') || agent.includes('0.9.152'), 'AGENT_TASK');


assert.ok(agent.includes('HUD-HUB-FLUSH-TOP-001'), 'flush in agent');
assert.ok(agent.includes('SETTINGS-QUALITY-SHARE-HOWTO-001') || agent.includes('0.9.152'), 'settings rows');

console.log('handoff-agent-tidy.test.mjs: PASS');
