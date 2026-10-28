/**
 * WEAPONS-RAIL-FILL-EDGE-001 (v0.9.67)
 * Water-fill edge cases: drained / on-cd / burst snap; near-empty→0 near-full→1.
 * Run: node tests/weapons-rail-fill-edge.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { Game } from '../js/logic.js';
import { CARDS_BY_ID } from '../js/config.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(6[7-9]|[7-9]\d)/.test(html), 'cache-bust ≥0.9.67');
assert.ok(main.includes('WEAPONS-RAIL-FILL-EDGE-001'), 'ship id in main');
assert.ok(css.includes('WEAPONS-RAIL-FILL-EDGE-001') || css.includes('wrail-tile.drained'), 'ship CSS');
assert.ok(agent.includes('WEAPONS-RAIL-FILL-EDGE-001') || agent.includes('0.9.67'), 'AGENT_TASK');

assert.ok(main.includes('_tileFillEdge'), 'edge helper');
assert.ok(main.includes("classList.toggle('drained'"), 'drained class');
assert.ok(main.includes("classList.toggle('on-cd'"), 'on-cd class');
assert.ok(main.includes("classList.toggle('bursting'"), 'bursting class');
assert.ok(main.includes('|b') || main.includes("'|b' + burst") || main.includes('|b\' + burst'), 'burst in fill snap');
assert.ok(/r\s*<=\s*0\.02/.test(main) && /r\s*>=\s*0\.98/.test(main), 'edge quantize');

assert.match(css, /\.wrail-tile\.drained/, 'drained CSS');
assert.match(css, /\.wrail-tile\.on-cd/, 'on-cd CSS');
assert.match(css, /\.wrail-tile\.bursting/, 'bursting CSS');

// Preserve contracts
assert.ok(main.includes('TAP_WINDOW_MS'), 'multi-tap kept');
assert.match(css, /\.stick\s*\{[^}]*opacity:\s*0/s, 'stick idle hide');
assert.ok(main.includes('STICK-RAIL-CLAMP-001') || main.includes('maxBottom'), 'clamp kept');

{
  const g = new Game({ seed: 11 });
  g.applyCard(CARDS_BY_ID.shotgun);
  g.applyCard(CARDS_BY_ID.frag);
  g.selectWeaponTile(2);
  assert.equal(g.fireMode, 'secondary');
  assert.equal(g.secondaryBurstLeft, 3);
  g.weaponResources.shotgun.current = 0;
  // Empty ammo still returns (prior rule)
  g._tickWeapons(0.016, []);
  assert.equal(g.fireMode, 'primary');
  // Burst max preserved after refill + reselect
  g.weaponResources.shotgun.current = 6;
  assert.equal(g.selectWeaponTile(2), true);
  assert.equal(g.secondaryBurstMax, 3);
  assert.equal(g.secondaryBurstLeft, 3);
}

console.log('weapons-rail-fill-edge.test.mjs: PASS');
