/**
 * WEAPONS-COLOR-TOKENS-001 (v0.9.63)
 * Shared --weapon-* tokens on rail + level/branch cards (cat-primary/secondary/throw).
 * Run: node tests/weapons-color-tokens.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(html.includes('?v=0.9.63'), 'cache-bust 0.9.63');
assert.ok(css.includes('WEAPONS-COLOR-TOKENS-001'), 'ship id in CSS');
assert.ok(css.includes('--weapon-primary'), 'shared primary');
assert.ok(css.includes('--weapon-secondary'), 'shared secondary');
assert.ok(css.includes('--weapon-throw'), 'shared throw');
assert.ok(css.includes('.level-card.cat-primary'), 'cat-primary card');
assert.ok(css.includes('.level-card.cat-secondary'), 'cat-secondary card');
assert.ok(css.includes('.level-card.cat-throw'), 'cat-throw card');
assert.ok(css.includes('--wrail-primary: var(--weapon-primary)'), 'rail aliases primary');
assert.ok(main.includes('cardWeaponCatClass'), 'cat helper');
assert.ok(main.includes('cat-'), 'cat class applied');
assert.ok(agent.includes('WEAPONS-COLOR-TOKENS-001') || agent.includes('0.9.63'), 'AGENT_TASK');

console.log('weapons-color-tokens.test.mjs: PASS');
