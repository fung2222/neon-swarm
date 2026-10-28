/**
 * SHARE-BTN-ARIA-001 (v0.9.94)
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');
assert.ok((() => { const m = html.match(/\?v=0\.9\.(\d+)/); return m && Number(m[1]) >= 94; })(), 'cache-bust ≥0.9.94');
assert.ok(main.includes('SHARE-BTN-ARIA-001'), 'ship id');
assert.ok(agent.includes('SHARE-BTN-ARIA-001') || agent.includes('SHARE-BTN-ARIA-FALLBACK-001') || agent.includes('0.9.94') || /0\.9\.\d{3,}/.test(agent) || /HOLD|Active/.test(agent), 'AGENT_TASK soft');
assert.ok(main.includes("setAttribute('aria-label'") && main.includes('labels.zh'), 'aria set');
assert.ok(main.includes('shareButtonLabels'), 'labels helper');
console.log('share-btn-aria.test.mjs: PASS');
