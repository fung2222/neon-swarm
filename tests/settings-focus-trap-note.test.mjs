/**
 * SETTINGS-FOCUS-TRAP-NOTE-001 (v0.9.150)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../vendor/cyber-kit/ui/ui.js', import.meta.url), 'utf8');

assert.ok(html.includes('?v=0.9.150') || /\\?v=0\\.9\\.\\d+/.test(html), 'cache-bust tip');
assert.ok(agent.includes('SETTINGS-FOCUS-TRAP-NOTE-001') || agent.includes('0.9.150'), 'AGENT_TASK');


assert.ok(main.includes('SETTINGS-FOCUS-TRAP-NOTE-001'), 'note');
assert.ok(main.includes('openInRunSettings'), 'pause-on-open path');

console.log('settings-focus-trap-note.test.mjs: PASS');
