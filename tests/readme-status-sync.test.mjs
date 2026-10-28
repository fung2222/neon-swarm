/**
 * README-STATUS-SYNC-001 (v0.9.157)
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

assert.ok(html.includes('?v=0.9.157') || /\\?v=0\\.9\\.\\d+/.test(html), 'cache-bust tip');
assert.ok(agent.includes('README-STATUS-SYNC-001') || agent.includes('0.9.157'), 'AGENT_TASK');


assert.ok(readme.includes('?v=0.9.157') || readme.includes('v0.9.157'), 'readme tip');
assert.ok(readme.includes('README-STATUS-SYNC-001') || readme.includes('0.9.157'), 'readme status');
assert.ok(!readme.includes('GAMES-JSON-STAGE-004（safe polish）'), 'stale stage-004 status cleared');

console.log('readme-status-sync.test.mjs: PASS');
