/**
 * SHARE-FALLBACK-SOFTPIN-001 (v0.9.151)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const strings = readFileSync(new URL('../js/strings.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../vendor/cyber-kit/ui/ui.js', import.meta.url), 'utf8');

assert.ok(html.includes('?v=0.9.151') || /\\?v=0\\.9\\.\\d+/.test(html), 'cache-bust tip');
assert.ok(agent.includes('SHARE-FALLBACK-SOFTPIN-001') || agent.includes('0.9.151'), 'AGENT_TASK');


assert.ok(/\\?v=0\\.9\\.(15[1-9]|1[6-9]\\d|[2-9]\\d\\d)/.test(html) || html.includes('?v=0.9.151'), 'soft-pin ≥0.9.151');
assert.ok(html.includes('btn-share') || html.includes('分享戰績'), 'over share fallback kept');
assert.ok(main.includes('onShareFromSettings'), 'settings share path');
assert.ok(main.includes('shareOrCopy'), 'result-share reused');

console.log('share-fallback-softpin.test.mjs: PASS');
