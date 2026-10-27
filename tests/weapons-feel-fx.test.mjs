/**
 * WEAPONS-FEEL-FX-001 (v0.9.56) — feel recipes + charge/stick events.
 * Run: node tests/weapons-feel-fx.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { Game } from '../js/logic.js';
import {
  muzzleFeelFx, explodeFeelFx, chargeFeelFx, stickFeelFx, frostHitFeelFx,
  normalizeFeelWeaponId, FEEL_FX_WEAPON_IDS, feelFxCoversCatalog,
} from '../js/weapons-feel-fx.js';
import { ALL_WEAPON_IDS, PRIMARY_IDS, SECONDARY_IDS, THROW_IDS } from '../js/weapons.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const logic = readFileSync(new URL('../js/logic.js', import.meta.url), 'utf8');

assert.match(html, /\?v=0\.9\.56/);
assert.ok(main.includes('weapons-feel-fx'));
assert.ok(main.includes('applyFeelBursts'));
assert.ok(main.includes('weaponCharge'));
assert.ok(logic.includes("type: 'weaponCharge'"));
assert.ok(logic.includes("type: 'stick'"));
assert.ok(logic.includes("type: 'frostHit'"));

assert.equal(normalizeFeelWeaponId('mg'), 'gatling');
assert.equal(normalizeFeelWeaponId('laser'), 'ion_beam');
assert.equal(normalizeFeelWeaponId('plasma'), 'acid_gun');
assert.equal(normalizeFeelWeaponId('zero_laser'), 'zero_laser');

for (const id of PRIMARY_IDS) {
  const steps = muzzleFeelFx(id, { mobile: false });
  assert.ok(steps.length >= 1, `${id} muzzle`);
  assert.ok(steps[0].color != null && steps[0].n >= 1, `${id} burst`);
}
for (const id of SECONDARY_IDS) {
  assert.ok(muzzleFeelFx(id).length >= 1, `${id} muzzle`);
}
for (const id of ['frag', 'chill', 'flash', 'gravity']) {
  const ex = explodeFeelFx(id, { mobile: false, radius: 2.5 });
  assert.ok(ex.length >= 1, `${id} explode`);
}

// Distinct primary colors / counts (identity)
const gat = muzzleFeelFx('gatling')[0].color;
const vul = muzzleFeelFx('vulcan')[0].color;
const zero = muzzleFeelFx('zero_laser')[0].color;
const ion = muzzleFeelFx('ion_beam')[0].color;
assert.notEqual(gat, vul);
assert.notEqual(zero, vul);
assert.notEqual(ion, gat);

const frag = explodeFeelFx('frag')[0].color;
const chill = explodeFeelFx('chill')[0].color;
const flash = explodeFeelFx('flash')[0].color;
const grav = explodeFeelFx('gravity')[0].color;
assert.notEqual(frag, chill);
assert.notEqual(flash, grav);

// Mobile sheds secondary bursts
const desk = muzzleFeelFx('gatling', { mobile: false });
const mob = muzzleFeelFx('gatling', { mobile: true });
assert.ok(mob.length < desk.length || mob.every((s) => !s.mobileSkip));
assert.ok(mob.every((s) => !s.ring));

assert.ok(chargeFeelFx('ion_beam', 0.8).length >= 1);
assert.ok(stickFeelFx().length >= 1);
assert.ok(frostHitFeelFx().length >= 1);

assert.ok(feelFxCoversCatalog([...PRIMARY_IDS, ...SECONDARY_IDS]));
assert.ok(FEEL_FX_WEAPON_IDS.includes('gatling'));
assert.ok(FEEL_FX_WEAPON_IDS.length >= 14);

// Live: ion charge emits weaponCharge; tracking stick emits stick
{
  const g = new Game({ seed: 42 });
  g.taken = { ion_beam: 1, laser: 1 };
  g.loadout = { primary: ['ion_beam', null], secondary: [null, null], throw: [null, null] };
  g.fireMode = 'primary';
  g.activePrimaryIndex = 0;
  g.alive = true;
  g.invuln = 99;
  g.px = 0; g.pz = 0;
  g.enemies.push({
    id: 'e0', kind: 'soldier', type: 'soldier', family: 'human',
    x: 0, z: 5, prevX: 0, prevZ: 5, vx: 0, vz: 0,
    hp: 20, maxHp: 20, r: 0.35, speed: 0, damage: 1,
    color: '#c44', slow: 0, hit: 0, score: 10,
  });
  const events = [];
  // charge phase — several small ticks
  for (let i = 0; i < 20; i++) g._tickPrimary(0.05, events, 1);
  assert.ok(events.some((e) => e.type === 'weaponCharge'), 'ion charge FX event');
}

{
  const g = new Game({ seed: 7 });
  g.taken = { tracking_bomb: 1, rocket: 1 };
  g.loadout = { primary: ['tracking_bomb', null], secondary: [null, null], throw: [null, null] };
  g.fireMode = 'primary';
  g.activePrimaryIndex = 0;
  g.alive = true;
  g.invuln = 99;
  g.px = 0; g.pz = 0;
  g.fireT = 0;
  const e = {
    id: 'e1', kind: 'soldier', type: 'soldier', family: 'human',
    x: 0, z: 3, prevX: 0, prevZ: 3, vx: 0, vz: 0,
    hp: 40, maxHp: 40, r: 0.4, speed: 0, damage: 1,
    color: '#c44', slow: 0, hit: 0, score: 10,
  };
  g.enemies.push(e);
  const events = [];
  g._tickPrimary(0.02, events, 1);
  // advance projectile until stick
  for (let i = 0; i < 120 && !events.some((ev) => ev.type === 'stick'); i++) {
    g._stepProjectiles(0.05, events);
  }
  assert.ok(events.some((ev) => ev.type === 'stick'), 'tracking stick FX event');
}

console.log('weapons-feel-fx OK');
