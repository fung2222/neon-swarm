/**
 * WEAPONS-BRANCH-CARD-LAYOUT-001 (v0.9.64)
 * Branch/ult pick card layout polish only (no ult invent).
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(html.includes('?v=0.9.64'), 'cache-bust 0.9.64');
assert.ok(css.includes('WEAPONS-BRANCH-CARD-LAYOUT-001'), 'ship id');
assert.ok(css.includes('.level-cards.branch-offer'), 'branch-offer layout');
assert.match(css, /\.level-cards\.branch-offer\s*\{[^}]*max-height:/s);
assert.ok(css.includes('text-overflow: ellipsis'), 'title ellipsis');
assert.ok(agent.includes('WEAPONS-BRANCH-CARD-LAYOUT-001') || agent.includes('0.9.64'), 'AGENT_TASK');

console.log('weapons-branch-card-layout.test.mjs: PASS');
