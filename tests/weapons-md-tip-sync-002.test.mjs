/**
 * WEAPONS-MD-TIP-SYNC-002 (v0.9.158)
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

assert.ok(html.includes('?v=0.9.158') || /\\?v=0\\.9\\.\\d+/.test(html), 'cache-bust tip');
assert.ok(agent.includes('WEAPONS-MD-TIP-SYNC-002') || agent.includes('0.9.158'), 'AGENT_TASK');


const weapons = readFileSync(new URL('../docs/WEAPONS.md', import.meta.url), 'utf8');
assert.ok(weapons.includes('0.9.158') || weapons.includes('v0.9.158'), 'weapons tip');
assert.ok(weapons.includes('WEAPONS-MD-TIP-SYNC-002'), 'ship id');
assert.ok(!/Ship:\*\* v0\.9\.124 BALANCE/.test(weapons), 'stale balance ship cleared');

console.log('weapons-md-tip-sync-002.test.mjs: PASS');
