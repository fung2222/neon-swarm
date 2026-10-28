/**
 * SHARE-FALLBACK-SYNC-001 (v0.9.133) — index share fallback mirrors phone SHARE labels.
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const rs = readFileSync(new URL('../js/result-share.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(13[3-9]|1[4-9]\d)/.test(html), 'cache-bust ≥0.9.133');
assert.ok(agent.includes('SHARE-FALLBACK-SYNC-001') || agent.includes('0.9.133'), 'AGENT_TASK');
assert.ok(html.includes('SHARE-FALLBACK-SYNC-001'), 'ship comment');
assert.ok(html.includes('>分享戰績<') || html.includes('>分享戰績</'), 'zh fallback');
assert.ok(html.includes('>SHARE RUN<') || html.includes('>SHARE RUN</'), 'en fallback');
assert.ok(!html.includes('>複製戰績<'), 'old copy fallback gone');
assert.ok(rs.includes("zh: '分享戰績'") || rs.includes('分享戰績'), 'runtime share label');
assert.ok(rs.includes("zh: '複製戰績'") || rs.includes('複製戰績'), 'runtime copy still exists');
console.log('share-fallback-sync.test.mjs: PASS');
