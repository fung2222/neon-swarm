/**
 * PAUSE-DIALOG-A11Y-001 (v0.9.92)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.92/.test(html), 'cache-bust');
assert.ok(html.includes('PAUSE-DIALOG-A11Y-001'), 'ship id');
assert.ok(agent.includes('PAUSE-DIALOG-A11Y-001') || agent.includes('0.9.92'), 'AGENT_TASK');
assert.ok(html.includes('id="screen-pause"') && html.includes('role="dialog"') && html.includes('aria-modal="true"'), 'dialog');
assert.ok(html.includes('aria-labelledby="pause-title"') && html.includes('id="pause-title"'), 'labelledby');
assert.ok(css.includes('PAUSE-CTA-TAP-001'), 'prior pause CTA kept');
console.log('pause-dialog-a11y.test.mjs: PASS');
