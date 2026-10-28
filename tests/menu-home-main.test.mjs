/**
 * MENU-HOME-MAIN-001 (v0.9.118)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.118/.test(html), 'cache-bust');
assert.ok(html.includes('MENU-HOME-MAIN-001'), 'ship id');
assert.ok(agent.includes('MENU-HOME-MAIN-001') || agent.includes('0.9.118'), 'AGENT_TASK');
assert.ok(/id="screen-start"[^>]*role="main"/.test(html), 'role');
assert.ok(html.includes('aria-label="主選單 MAIN MENU"'), 'aria');
assert.ok(css.includes('HOME-CTA-TAP-001') || css.includes('btn-play'), 'CTA context');
console.log('menu-home-main.test.mjs: PASS');
