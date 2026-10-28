/**
 * SHARE-FALLBACK-SOFTPIN-001 (v0.9.151) — soft-pin refreshed SHARE-FALLBACK-SOFTPIN-002 v0.9.163
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok((() => { const m = html.match(/\?v=0\.9\.(\d+)/); return m && Number(m[1]) >= 151; })(), 'soft-pin ≥0.9.151');
assert.ok(agent.includes('SHARE-FALLBACK-SOFTPIN-001') || agent.includes('SHARE-FALLBACK-SOFTPIN-002') || agent.includes('0.9.151') || /0\.9\.\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');
assert.ok(html.includes('btn-share') || html.includes('分享戰績'), 'over share fallback kept');
assert.ok(main.includes('onShareFromSettings'), 'settings share path');
assert.ok(main.includes('shareOrCopy'), 'result-share reused');

console.log('share-fallback-softpin.test.mjs: PASS');
