/**
 * OVER-META-A11Y-001 (v0.9.111)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.111/.test(html), 'cache-bust');
assert.ok(html.includes('OVER-META-A11Y-001'), 'ship id');
assert.ok(agent.includes('OVER-META-A11Y-001') || agent.includes('0.9.111'), 'AGENT_TASK');
assert.ok(/id="over-meta"[^>]*role="group"/.test(html), 'role');
assert.ok(html.includes('aria-label="結算摘要 RUN SUMMARY"'), 'aria');
assert.ok(html.includes('over-loadout'), 'loadout kept');
console.log('over-meta-a11y.test.mjs: PASS');
