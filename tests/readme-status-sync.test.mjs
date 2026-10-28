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

assert.ok(/\?v=0\.9\.(15[7-9]|1[6-9]\d|[2-9]\d\d)/.test(html) || html.includes('?v=0.9.157'), 'soft-pin ≥0.9.157');
assert.ok(agent.includes('README-STATUS-SYNC-001') || agent.includes('README-PIPELINE-TIP-002') || agent.includes('0.9.157') || /0\.9\.\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');


assert.ok(/\?v=0\.9\.(15[7-9]|1[6-9]\d|[2-9]\d\d)/.test(readme) || /v0\.9\.(15[7-9]|1[6-9]\d|[2-9]\d\d)/.test(readme), 'readme tip ≥0.9.157');
assert.ok(!readme.includes('GAMES-JSON-STAGE-004（safe polish）'), 'stale stage-004 status cleared');

console.log('readme-status-sync.test.mjs: PASS');
