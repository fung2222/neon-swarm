/**
 * LEVEL-CARDS-ARIA-001 (v0.9.117)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.117/.test(html), 'cache-bust');
assert.ok(html.includes('LEVEL-CARDS-ARIA-001'), 'ship id');
assert.ok(agent.includes('LEVEL-CARDS-ARIA-001') || agent.includes('0.9.117'), 'AGENT_TASK');
assert.ok(/id="level-cards"[^>]*role="list"/.test(html), 'role');
assert.ok(html.includes('aria-label="升級卡 LEVEL CARDS"'), 'aria');
assert.ok(css.includes('LEVEL-CARD-FOCUS-001'), 'focus kept');
console.log('level-cards-aria.test.mjs: PASS');
