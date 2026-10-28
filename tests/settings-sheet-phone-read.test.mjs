/**
 * SETTINGS-SHEET-PHONE-READ-001 (v0.9.148)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../vendor/cyber-kit/ui/ui.js', import.meta.url), 'utf8');

assert.ok(html.includes('?v=0.9.148') || /\\?v=0\\.9\\.\\d+/.test(html), 'cache-bust tip');
assert.ok(agent.includes('SETTINGS-SHEET-PHONE-READ-001') || agent.includes('0.9.148'), 'AGENT_TASK');


assert.ok(css.includes('SETTINGS-SHEET-PHONE-READ-001'), 'ship id');
assert.ok(css.includes('.ck-settings-panel .ck-set-label'), 'label contrast');
assert.ok(css.includes('.ck-action'), 'action chrome');

console.log('settings-sheet-phone-read.test.mjs: PASS');
