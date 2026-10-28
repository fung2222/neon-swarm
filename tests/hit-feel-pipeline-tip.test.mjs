/**
 * HIT-FEEL-PIPELINE-TIP-001 (v0.9.159)
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

assert.ok(html.includes('?v=0.9.159') || /\\?v=0\\.9\\.\\d+/.test(html), 'cache-bust tip');
assert.ok(agent.includes('HIT-FEEL-PIPELINE-TIP-001') || agent.includes('0.9.159'), 'AGENT_TASK');


const hf = readFileSync(new URL('../docs/HIT-FEEL-DEVICE.md', import.meta.url), 'utf8');
assert.ok(hf.includes('HIT-FEEL-PIPELINE-TIP-001'), 'ship id');
assert.ok(hf.includes('Safe pipeline tip now') && hf.includes('0.9.159'), 'pipeline tip');
assert.ok(hf.includes('v=0.9.50'), 'device-verified baseline kept');

console.log('hit-feel-pipeline-tip.test.mjs: PASS');
