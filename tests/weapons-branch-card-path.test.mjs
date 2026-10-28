/**
 * WEAPONS-BRANCH-CARD-PATH-001 (v0.9.69)
 * Branch/ult pick: path chip A/B/C·U1/U2 + larger phone tap; UI only (no ult invent).
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { buildBranchOfferCards, buildUltOfferCards } from '../js/weapons.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(69|[7-9]\d)/.test(html), 'cache-bust ≥0.9.69');
assert.ok(main.includes('WEAPONS-BRANCH-CARD-PATH-001'), 'ship id');
assert.ok(css.includes('WEAPONS-BRANCH-CARD-PATH-001') || css.includes('card-path'), 'path CSS');
assert.ok(agent.includes('WEAPONS-BRANCH-CARD-PATH-001') || agent.includes('0.9.69'), 'AGENT_TASK');
assert.ok(main.includes('card-path') && main.includes('data-path'), 'path chip markup');
assert.ok(main.includes('選擇分支') && main.includes('pathWeaponName'), 'title includes weapon');
assert.match(css, /\.level-card\s+\.card-path/, 'path chip style');
assert.match(css, /\.level-cards\.branch-offer\s+\.level-card\s*\{[^}]*min-height:\s*88px/s, 'branch card tap 88');

const br = buildBranchOfferCards('gatling');
assert.ok(br && br.choices.length >= 2, 'branch choices');
assert.ok(br.choices.every((c) => c.branch && c.pickupAction === 'branch'), 'branch letters');
const ult = buildUltOfferCards('gatling', 'A');
assert.ok(ult && ult.choices.length >= 1, 'ult choices exist (light amp; no invent)');
assert.ok(ult.choices.every((c) => c.pickupAction === 'ult' && c.ult), 'ult keys');

// Preserve
assert.ok(main.includes('TAP_WINDOW_MS'), 'multi-tap');
assert.ok(css.includes('WEAPONS-RAIL-TAP-TARGET-001') || css.includes('min-width: 44px'), 'rail tap kept');

console.log('weapons-branch-card-path.test.mjs: PASS');
