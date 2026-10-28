/**
 * LEVEL-DIALOG-A11Y-001 (v0.9.101)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.101/.test(html), 'cache-bust');
assert.ok(html.includes('LEVEL-DIALOG-A11Y-001'), 'ship id');
assert.ok(agent.includes('LEVEL-DIALOG-A11Y-001') || agent.includes('0.9.101'), 'AGENT_TASK');
assert.ok(/id="screen-level"[^>]*role="dialog"/.test(html) && html.includes('aria-modal="true"'), 'dialog');
assert.ok(html.includes('aria-labelledby="level-title"') && html.includes('id="level-title"'), 'labelledby');
assert.ok(html.includes('level-cards'), 'cards kept');
console.log('level-dialog-a11y.test.mjs: PASS');
