/**
 * BALANCE-PASS-001 (v0.9.124) — Lv1 + stacked branch/ult DPS fair retune.
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { WEAPON_CATALOG, branchStatMods, applyUltKitMods } from '../js/weapons.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const weapons = readFileSync(new URL('../js/weapons.js', import.meta.url), 'utf8');
const md = readFileSync(new URL('../docs/WEAPONS.md', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.(12[4-9]|1[3-9]\d)/.test(html), 'cache-bust ≥0.9.124');
assert.ok(weapons.includes('BALANCE-PASS-001'), 'ship id in weapons.js');
assert.ok(md.includes('BALANCE-PASS-001'), 'WEAPONS.md notes pass');
assert.equal(typeof applyUltKitMods, 'function');

// Lv1 bases (named retune)
assert.equal(WEAPON_CATALOG.gatling.base.hit, 0.95);
assert.equal(WEAPON_CATALOG.gatling.base.cd, 0.105);
assert.equal(WEAPON_CATALOG.ion_beam.base.hit, 3.3);
assert.equal(WEAPON_CATALOG.tracking_bomb.base.hit, 2.55);
assert.equal(WEAPON_CATALOG.vulcan.base.hit, 0.48);
assert.equal(WEAPON_CATALOG.zero_laser.base.hit, 1.35);
assert.equal(WEAPON_CATALOG.acid_gun.base.hit, 0.90);
assert.equal(WEAPON_CATALOG.blackhole.base.hit, 2.0);
assert.equal(WEAPON_CATALOG.frag.base.hit, 3.0);

// Stacked branch+U1 dmgMul must stay below pre-pass extremes
const ionAU1 = branchStatMods('ion_beam', 'A', 'U1');
assert.ok(ionAU1.dmgMul < 1.38 * 1.22, `ion A+U1 dmgMul ${ionAU1.dmgMul} still too hot`);
assert.ok(ionAU1.dmgMul > 1.2, `ion A+U1 dmgMul ${ionAU1.dmgMul} too weak`);

const gatBU1 = branchStatMods('gatling', 'B', 'U1');
assert.ok(gatBU1.dmgMul < 1.14 * 1.15, `gatling B+U1 ${gatBU1.dmgMul}`);
assert.ok(gatBU1.pierceAdd >= 4);

const vulCU1 = branchStatMods('vulcan', 'C', 'U1');
assert.ok(vulCU1.dmgMul < 1.22 * 1.15, `vulcan C+U1 ${vulCU1.dmgMul}`);

const zeroAU1 = branchStatMods('zero_laser', 'A', 'U1');
assert.ok(zeroAU1.dmgMul < 1.08 * 1.10 * 1.01, `zero A+U1 ${zeroAU1.dmgMul}`);
assert.ok(zeroAU1.chillMul > 1.85);

// Behavior kits still unique (not wiped by balance)
assert.equal(branchStatMods('gatling', 'C', 'U1').boltCount, 5);
assert.equal(branchStatMods('tracking_bomb', 'A', 'U1').warheads, 5);
assert.ok(branchStatMods('vulcan', 'B', 'U1').burn > branchStatMods('vulcan', 'B').burn);

console.log('balance-pass.test.mjs: PASS', {
  ionAU1: +ionAU1.dmgMul.toFixed(3),
  gatBU1: +gatBU1.dmgMul.toFixed(3),
  vulCU1: +vulCU1.dmgMul.toFixed(3),
  zeroAU1: +zeroAU1.dmgMul.toFixed(3),
});
