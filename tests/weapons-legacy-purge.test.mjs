/**
 * WEAPONS-LEGACY-PURGE-001 (v0.9.58) — player cards = catalog; aliases internal-only.
 * Run: node tests/weapons-legacy-purge.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import {
  CARDS, CARDS_BY_ID, pickCards, WEAPON_ID_ALIASES, normalizeWeaponId,
  MECHS, resolveMechCombat,
} from '../js/config.js';
import { formatLoadoutFromGame } from '../js/run-loop-ux.js';
import { ALL_WEAPON_IDS, WEAPON_CATALOG } from '../js/weapons.js';

const PURGED = ['laser', 'rocket', 'grenade', 'plasma'];
const CATALOG = ALL_WEAPON_IDS.slice();

for (const id of PURGED) {
  assert.ok(!CARDS_BY_ID[id], 'purged card still present: ' + id);
}
for (const id of CATALOG) {
  assert.ok(CARDS_BY_ID[id], 'catalog card missing: ' + id);
  assert.equal(CARDS_BY_ID[id].zh, WEAPON_CATALOG[id].zh, id + ' zh mismatch');
  assert.equal(CARDS_BY_ID[id].en, WEAPON_CATALOG[id].en, id + ' en mismatch');
}

assert.deepEqual(WEAPON_ID_ALIASES, {
  mg: 'gatling',
  laser: 'ion_beam',
  rocket: 'tracking_bomb',
  grenade: 'frag',
  plasma: 'acid_gun',
});
for (const [a, b] of Object.entries(WEAPON_ID_ALIASES)) {
  assert.equal(normalizeWeaponId(a), b);
}

for (const m of MECHS) {
  assert.equal(m.starterWeapon, 'gatling', m.id);
}
assert.equal(resolveMechCombat('horn').starterWeapon, 'gatling');

// pickCards pool never yields purged ids
let s = 42;
const rng = () => { s = (s * 1103515245 + 12345) >>> 0; return s / 0x100000000; };
for (let i = 0; i < 120; i++) {
  for (const c of pickCards(rng, 3, {})) {
    assert.ok(!PURGED.includes(c.id), 'pickCards offered ' + c.id);
  }
}

// Player-facing strings: no 鐳射炮 / 火箭炮 / bare 機槍 on weapon unlock cards
for (const c of CARDS) {
  assert.ok(c.zh !== '鐳射炮' && c.zh !== '火箭炮', c.id);
  if (c.kind === 'weapon' && CATALOG.includes(c.id)) {
    assert.ok(!/^機槍$/.test(c.zh));
  }
  // generic buffs reworded off MG-only copy
  if (['dmg', 'rate', 'multi', 'pierce', 'overclock', 'glass'].includes(c.id)) {
    assert.ok(!/機槍/.test(c.descZh || ''), c.id + ' still says 機槍: ' + c.descZh);
    assert.ok(!/\bMG\b/.test(c.descEn || ''), c.id + ' still says MG: ' + c.descEn);
  }
}

const line = formatLoadoutFromGame(
  { weaponSlots: ['gatling', 'ion_beam', 'frag'], ion_beam: 2, frag: 1, gatling: 1 },
  CARDS_BY_ID, true,
);
assert.ok(line.includes('機關雷射炮'), line);
assert.ok(line.includes('離子光束'), line);
assert.ok(line.includes('破片榴彈'), line);
assert.ok(!line.includes('鐳射炮'), line);
assert.ok(!line.includes('火箭炮'), line);

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.ok(html.includes('?v=0.9.60'), 'cache-bust current (0.9.60)');

console.log('weapons-legacy-purge.test.mjs: PASS');
