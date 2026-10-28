/**
 * HUB-TIME-I18N-001 (v0.9.114)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.114/.test(html), 'cache-bust');
assert.ok(html.includes('HUB-TIME-I18N-001'), 'ship id');
assert.ok(agent.includes('HUB-TIME-I18N-001') || agent.includes('0.9.114'), 'AGENT_TASK');
assert.ok(html.includes('aria-label="時間 TIME"'), 'aria');
assert.ok(strings.includes("'hud.time'") && strings.includes('時間'), 'string exists');
assert.ok(html.includes('id="hud-time"'), 'time kept');
console.log('hub-time-i18n.test.mjs: PASS');
