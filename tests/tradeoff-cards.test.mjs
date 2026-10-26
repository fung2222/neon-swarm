/**
 * PHASE6-TRADEOFF-CARDS-001 — three trade-off upgrade cards.
 * Run: node tests/tradeoff-cards.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import {
  CARDS, CARDS_BY_ID, pickCards, cardExhausted, PLAYER,
} from '../js/config.js';

const IDS = ['overclock', 'glass', 'heavy_frame'];

// Exactly these three new trade-offs exist; existing pool still has originals
{
  for (const id of IDS) {
    assert.ok(CARDS_BY_ID[id], `${id} in CARDS_BY_ID`);
    const c = CARDS.find((x) => x.id === id);
    assert.ok(c, `${id} in CARDS`);
    assert.ok(c.max >= 2 && c.max <= 3, `${id} max 2–3`);
    assert.ok(c.descZh && c.descEn, `${id} bilingual desc`);
    // Both sides must appear in desc (upside + downside markers)
    assert.ok(/[·−↓↑×+\-]/.test(c.descZh) || c.descZh.includes('−') || c.descZh.includes('+'), `${id} descZh has trade language`);
    assert.ok(typeof c.apply === 'function', `${id} apply`);
  }
  assert.equal(IDS.filter((id) => CARDS_BY_ID[id]).length, 3, 'exactly 3 tradeoff ids');
  // Existing cards untouched numerically
  const dmg = CARDS_BY_ID.dmg;
  const g = new Game({ seed: 1 });
  const before = g.bulletDmg;
  dmg.apply(g);
  assert.ok(Math.abs(g.bulletDmg - (before + 0.35)) < 1e-9, 'existing dmg card unchanged (+0.35)');
}

// overclock: fireCd↓ and armor−1 (floor 0)
{
  const g = new Game({ seed: 2 });
  g.armor = 2;
  const cd0 = g.fireCd;
  const c = CARDS_BY_ID.overclock;
  g.applyCard(c);
  assert.ok(g.fireCd < cd0, 'overclock lowers fireCd');
  assert.ok(g.fireCd >= 0.045, 'fireCd floor');
  assert.equal(g.armor, 1, 'armor −1');
  g.applyCard(c);
  g.applyCard(c);
  assert.equal(g.armor, 0, 'armor floors at 0');
  assert.equal(g.taken.overclock, 3);
  assert.ok(cardExhausted(c, g.taken), 'overclock exhausted at max');
  // another apply via pick path shouldn't appear once exhausted
  const pool = pickCards(() => 0, 20, g.taken);
  assert.ok(!pool.some((x) => x.id === 'overclock'), 'exhausted overclock not offered');
}

// glass: dmg↑ maxHp−1 clamp; never maxHp < 3
{
  const g = new Game({ seed: 3 });
  g.maxHp = 5;
  g.hp = 5;
  g.armor = 0;
  const d0 = g.bulletDmg;
  const c = CARDS_BY_ID.glass;
  g.applyCard(c);
  assert.ok(Math.abs(g.bulletDmg - (d0 + 0.45)) < 1e-9, 'glass +0.45 dmg');
  assert.equal(g.maxHp, 4, 'maxHp −1');
  assert.equal(g.hp, 4, 'hp clamped to maxHp');
  g.applyCard(c);
  assert.equal(g.maxHp, 3, 'maxHp 3');
  assert.equal(g.taken.glass, 2);
  assert.ok(cardExhausted(c, g.taken), 'glass max 2 exhausted');
  // Force apply beyond max via direct apply (pool won't offer) — floor still holds
  c.apply(g);
  assert.equal(g.maxHp, 3, 'maxHp never below 3');
  assert.ok(g.hp <= g.maxHp, 'hp ≤ maxHp');
  assert.ok(!Number.isNaN(g.bulletDmg) && !Number.isNaN(g.maxHp), 'no NaN');
}

// heavy_frame: armor+1 cap 3, speed↓ with floor
{
  const g = new Game({ seed: 4 });
  g.armor = 0;
  const sp0 = g.speed;
  const c = CARDS_BY_ID.heavy_frame;
  g.applyCard(c);
  assert.equal(g.armor, 1);
  assert.ok(g.speed < sp0, 'speed reduced');
  assert.ok(g.speed >= 2.8, 'speed floor');
  g.applyCard(c);
  g.applyCard(c);
  assert.equal(g.armor, 3, 'armor cap 3');
  // Extra direct applies keep armor capped and speed floored
  c.apply(g);
  c.apply(g);
  assert.equal(g.armor, 3);
  assert.ok(g.speed >= 2.8);
  assert.ok(!Number.isNaN(g.speed), 'no NaN speed');
}

// pickCards can return tradeoffs when not exhausted
{
  let saw = { overclock: 0, glass: 0, heavy_frame: 0 };
  for (let i = 0; i < 200; i++) {
    const pool = pickCards(() => Math.random(), 3, {});
    for (const c of pool) if (saw[c.id] != null) saw[c.id]++;
  }
  for (const id of IDS) {
    assert.ok(saw[id] > 0, `pickCards can offer ${id} (saw ${saw[id]})`);
  }
}

// Soft-lock guard: exhausting all capped incl tradeoffs still yields picks
{
  const taken = {};
  for (const c of CARDS) if (c.max != null) taken[c.id] = c.max;
  const pool = pickCards(() => 0, 3, taken);
  assert.ok(pool.length > 0, 'safety net still yields cards');
  for (const c of pool) assert.equal(c.max, null, 'fallback uncapped only');
}

// PLAYER base tables unchanged
{
  assert.equal(PLAYER.fireCd, 0.10);
  assert.equal(PLAYER.bulletDmg, 0.30);
  assert.equal(PLAYER.speed, 5.4);
  assert.equal(PLAYER.hp, 7);
}

console.log('tradeoff-cards.test.mjs OK');
