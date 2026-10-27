/**
 * WEAPONS-HUD-CONTROLS-FLOOR-001 (v0.9.59)
 * Floor near-black · multi-tap secondary/throw · secondary ≤3 burst return · bottom rail HUD.
 * Run: node tests/weapons-hud-controls-floor.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { Game } from '../js/logic.js';
import { CARDS_BY_ID } from '../js/config.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
const view = readFileSync(new URL('../js/view.js', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const weaponsMd = readFileSync(new URL('../docs/WEAPONS.md', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(html.includes('?v=0.9.60'), 'cache-bust current');
assert.ok(css.includes('--hud-chip-radius'), 'unified chip tokens');
assert.ok(css.includes('--hud-stick-clear') || css.includes('padding-left: 108px'), 'rail/stick clear');
assert.match(css, /\.weapon-rail\s*\{[^}]*bottom:/s);
assert.match(css, /\.weapon-rail\s*\{[^}]*flex-direction:\s*row/s);
assert.ok(view.includes('0x060608') || view.includes('near-black'), 'floor near-black');
assert.ok(view.includes('do NOT recolor soft/hard/pad'), 'no zone floor color flash');
assert.ok(main.includes('TAP_WINDOW_MS'), 'multi-tap window');
assert.ok(main.includes('activateSecondaryFromTap') || main.includes('noteTap'), 'double-tap path');
assert.ok(main.includes('activateThrowFromTap') || main.includes('n >= 3'), 'triple-tap path');
assert.ok(weaponsMd.includes('secondaryBurst') || weaponsMd.includes('≤3') || weaponsMd.includes('burst'), 'WEAPONS burst rule');
assert.ok(agent.includes('WEAPONS-HUD-CONTROLS-FLOOR-001') || agent.includes('0.9.59') || agent.includes('0.9.60'), 'AGENT_TASK ship id');

{
  const g = new Game({ seed: 7 });
  g.applyCard(CARDS_BY_ID.shotgun);
  g.applyCard(CARDS_BY_ID.frag);
  assert.equal(g.secondaryBurstMax, 3);
  assert.equal(g.selectWeaponTile(2), true);
  assert.equal(g.fireMode, 'secondary');
  assert.equal(g.secondaryBurstLeft, 3);

  // Simulate 3 successful consumes with ammo remaining → auto primary
  g.weaponResources.shotgun.current = 8;
  for (let i = 0; i < 3; i++) {
    g._consumeSecondary('shotgun', 1);
  }
  assert.equal(g.fireMode, 'primary', 'burst of 3 returns to primary');
  assert.ok(g.weaponResources.shotgun.current > 0, 'ammo may remain after burst return');
  assert.equal(g.secondaryBurstLeft, 0);

  // Re-select refreshes burst
  assert.equal(g.selectWeaponTile(2), true);
  assert.equal(g.secondaryBurstLeft, 3);

  // Double-tap helper
  g.fireMode = 'primary';
  g.secondaryBurstLeft = 0;
  assert.equal(g.activateSecondaryFromTap(), true);
  assert.equal(g.fireMode, 'secondary');
  assert.equal(g.secondaryBurstLeft, 3);

  // Triple-tap helper
  g.throwCdT = Object.create(null);
  assert.equal(g.activateThrowFromTap(), true);
  assert.equal(g._throwRequest, 'frag');
  // throw never holds fireMode
  assert.equal(g.fireMode, 'secondary'); // still on secondary until burst ends
}

{
  // Empty ammo still returns (prior rule)
  const g = new Game({ seed: 9 });
  g.applyCard(CARDS_BY_ID.shotgun);
  g.selectWeaponTile(2);
  g.weaponResources.shotgun.current = 0;
  g._tickWeapons(0.016, []);
  assert.equal(g.fireMode, 'primary');
}

console.log('weapons-hud-controls-floor.test.mjs: PASS');
