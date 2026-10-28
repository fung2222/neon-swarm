/**
 * GEAR-PAUSE-TAP-NOTE-001 (v0.9.149)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../vendor/cyber-kit/ui/ui.js', import.meta.url), 'utf8');

assert.ok(html.includes('?v=0.9.149') || /\\?v=0\\.9\\.\\d+/.test(html), 'cache-bust tip');
assert.ok(agent.includes('GEAR-PAUSE-TAP-NOTE-001') || agent.includes('0.9.149'), 'AGENT_TASK');


assert.ok(css.includes('GEAR-PAUSE-TAP-NOTE-001'), 'ship id');
assert.match(css, /#btn-settings-run[^}]*min-width:\s*44px/s, 'gear ≥44');

console.log('gear-pause-tap-note.test.mjs: PASS');
