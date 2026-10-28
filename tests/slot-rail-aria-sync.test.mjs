/**
 * SLOT-RAIL-ARIA-SYNC-001 (v0.9.99)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.99/.test(html), 'cache-bust');
assert.ok(html.includes('SLOT-RAIL-ARIA-SYNC-001'), 'ship id');
assert.ok(agent.includes('SLOT-RAIL-ARIA-SYNC-001') || agent.includes('0.9.99'), 'AGENT_TASK');
assert.ok(html.includes('aria-label="武器狀態 WEAPON STATUS"'), 'slots aria');
assert.ok(html.includes('aria-label="武器欄 LOADOUT"'), 'rail aria');
assert.match(css, /\.weapon-rail\s+\.wrail-label[\s\S]{0,80}display:\s*none/, 'no visible labels');
console.log('slot-rail-aria-sync.test.mjs: PASS');
