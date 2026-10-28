/**
 * SETTINGS-QUALITY-AFFIRM-001 (v0.9.155)
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

assert.ok(/\?v=0\.9\.(15[5-9]|1[6-9]\d|[2-9]\d\d)/.test(html) || html.includes('?v=0.9.155'), 'soft-pin ≥0.9.155');
assert.ok(agent.includes('SETTINGS-QUALITY-AFFIRM-001') || agent.includes('0.9.155'), 'AGENT_TASK');


assert.ok(main.includes('SETTINGS-QUALITY-AFFIRM-001'), 'affirm note');
assert.ok(main.includes('mountSettings') && main.includes('stage.setGlow'), 'settings+setGlow');
assert.ok(strings.includes('畫質'), '畫質 label');
assert.ok(ui.includes('persist') || ui.includes('setGlow'), 'kit persist path');

console.log('settings-quality-affirm.test.mjs: PASS');
