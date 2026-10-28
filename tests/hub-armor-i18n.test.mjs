/**
 * HUB-ARMOR-I18N-001 (v0.9.96)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.96/.test(html), 'cache-bust');
assert.ok(html.includes('HUB-ARMOR-I18N-001') || html.includes('data-i18n="hud.arm"'), 'ship');
assert.ok(agent.includes('HUB-ARMOR-I18N-001') || agent.includes('0.9.96'), 'AGENT_TASK');
assert.ok(html.includes('data-i18n="hud.arm"'), 'i18n attr');
assert.ok(strings.includes("'hud.arm'") && strings.includes('裝甲'), 'string');
assert.ok(!/>ARM</.test(html.replace(/data-i18n="hud.arm">裝甲</, '')), 'no bare ARM');
console.log('hub-armor-i18n.test.mjs: PASS');
