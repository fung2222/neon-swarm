/**
 * Phase 6 drop readability (v0.9.30).
 * Run: node tests/drop-readability.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { DROP, MAGNET_DROP_CHANCE, CARDS_BY_ID } from '../js/config.js';

assert.equal(DROP.xp.silhouette, 'shard');
assert.equal(DROP.heal.silhouette, 'pack');
assert.equal(DROP.magnet.silhouette, 'disc');
assert.equal(DROP.weapon.silhouette, 'board');
assert.ok(DROP.xp.scale < DROP.heal.scale && DROP.heal.scale < DROP.weapon.scale);
assert.ok(DROP.weapon.glowR >= 0.74, 'weapon halo not regressed');
assert.ok(MAGNET_DROP_CHANCE > 0 && MAGNET_DROP_CHANCE < 0.1);

{
  const g = new Game({ seed: 3 });
  g.hp = Math.max(1, g.maxHp - 4);
  const before = g.hp;
  g.gems.push({ x: g.px, z: g.pz, xp: 0, r: 0.2, life: 18, pop: 0, letter: 'H', kind: 'heal' });
  g.step(1 / 30);
  assert.equal(g.hp, before + 2);
}

{
  const g = new Game({ seed: 5 });
  const before = g.xp;
  g.gems.push({ x: g.px, z: g.pz, xp: 3, r: 0.18, life: 18, pop: 0, letter: 'X', kind: 'xp' });
  g.step(1 / 30);
  assert.equal(g.xp, before + 3);
}

{
  const g = new Game({ seed: 7 });
  const base = g.magnet;
  g.gems.push({ x: g.px, z: g.pz, xp: 0, r: 0.22, life: 20, pop: 0, letter: 'M', kind: 'magnet' });
  const { events } = g.step(1 / 30);
  assert.ok(Math.abs(g.magnet - base * 1.35) < 1e-9);
  assert.equal(g.taken.magnet, 1);
  assert.ok(events.some((e) => e.type === 'magnet'));
  const max = CARDS_BY_ID.magnet.max;
  for (let i = 1; i < max; i++) {
    g.gems.push({ x: g.px, z: g.pz, xp: 0, r: 0.22, life: 20, pop: 0, letter: 'M', kind: 'magnet' });
    g.step(1 / 30);
  }
  assert.equal(g.taken.magnet, max);
  const atCap = g.magnet;
  g.gems.push({ x: g.px, z: g.pz, xp: 0, r: 0.22, life: 20, pop: 0, letter: 'M', kind: 'magnet' });
  g.step(1 / 30);
  assert.equal(g.magnet, atCap, 'no further mul past max');
  assert.equal(g.taken.magnet, max);
}

assert.ok(DROP.xp.glowR < DROP.weapon.glowR);

console.log('drop-readability OK', {
  silhouettes: Object.fromEntries(Object.entries(DROP).map(([k, v]) => [k, v.silhouette])),
  magnetChance: MAGNET_DROP_CHANCE,
});
