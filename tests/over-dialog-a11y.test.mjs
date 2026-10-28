/**
 * OVER-DIALOG-A11Y-001 (v0.9.93)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.93/.test(html), 'cache-bust');
assert.ok(html.includes('OVER-DIALOG-A11Y-001'), 'ship id');
assert.ok(agent.includes('OVER-DIALOG-A11Y-001') || agent.includes('0.9.93'), 'AGENT_TASK');
assert.ok(/id="screen-over"[^>]*role="dialog"/.test(html) && html.includes('aria-modal="true"'), 'dialog');
assert.ok(html.includes('aria-labelledby="over-title"') && html.includes('id="over-title"'), 'labelledby');
assert.ok(html.includes('btn-share'), 'share kept');
console.log('over-dialog-a11y.test.mjs: PASS');
