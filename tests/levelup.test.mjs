import { Game } from '../js/logic.js';
import { CARDS, cardExhausted, pickCards, xpToLevel } from '../js/config.js';
import assert from 'assert';

const zero = () => 0; // deterministic rng: always grabs the first card of the pool

/** Complete a deferred swap/keep offer opened by applyCard when slots are full. */
function settle(g, prefer = 'swap') {
  let guard = 0;
  while (g.pausedForLevel && g.pendingCards && g.pendingCards.length && guard++ < 6) {
    const swap = g.pendingCards.find((c) => c.pickupAction === 'swap');
    const keep = g.pendingCards.find((c) => c.pickupAction === 'keep');
    const pick = (prefer === 'keep' ? keep : swap) || swap || keep || g.pendingCards[0];
    g.applyCard(pick);
  }
}

function applySettled(g, card, prefer = 'swap') {
  g.applyCard(card);
  settle(g, prefer);
}

// 1. A level-up must ALWAYS offer pickable cards, even after every capped card is maxed out.
{
  const g = new Game({ seed: 3 });
  for (const c of CARDS) for (let i = 0; i < (c.max ?? 2); i++) applySettled(g, c);
  for (let lv = 0; lv < 40; lv++) {
    g._levelUp();
    assert.ok(g.pendingCards && g.pendingCards.length > 0, `level ${g.level} offered no cards`);
    const ids = g.pendingCards.map((c) => c.id);
    for (const c of g.pendingCards) {
      assert.ok(!cardExhausted(c, g.taken), `exhausted card ${c.id} offered at level ${g.level}`);
    }
    assert.equal(new Set(ids).size, ids.length, 'a pick list must not repeat a card');
    applySettled(g, g.pendingCards[0]);
  }
}

// 2. Exhausted cards leave the draw pool; the safety net draws only uncapped cards.
{
  const taken = {};
  for (const c of CARDS) if (c.max != null) taken[c.id] = c.max;
  const pool = pickCards(zero, 3, taken);
  assert.equal(pool.length, 3);
  for (const c of pool) assert.equal(c.max, null, `fallback drew capped card ${c.id}`);
  const t2 = { orbit: 4, shotgun: 4 };
  const p2 = pickCards(() => 0.5, 3, t2);
  assert.ok(p2.every((c) => c.id !== 'orbit' && c.id !== 'shotgun'), 'exhausted cards leaked into the draw');
}

// 3. Taking the same card repeatedly is counted (drives the n/max badge and the caps).
{
  const g = new Game({ seed: 5 });
  const dmg = CARDS.find((c) => c.id === 'dmg');
  const before = g.bulletDmg;
  g.applyCard(dmg);
  g.applyCard(dmg);
  assert.equal(g.taken.dmg, 2);
  assert.ok(Math.abs(g.bulletDmg - (before + 0.7)) < 1e-9, 'dmg should stack +0.35 twice');
}

// 4. Special weapon cards unlock stacks (slot cap 4 → 5th resolves via swap)
{
  const g = new Game({ seed: 8 });
  for (const id of ['laser', 'shotgun', 'rocket', 'grenade', 'plasma']) {
    const c = CARDS.find((x) => x.id === id);
    applySettled(g, c);
    assert.equal(g[id], 1, id + ' unlock');
  }
  assert.equal(g.weaponSlots.filter(Boolean).length, 4, 'still capped at 4 visible slots');
  assert.ok(g.weaponSlots.includes('mg'));
  assert.ok(g.weaponSlots.includes('plasma'), 'latest unlock sits in a slot after swaps');
}

// 5. Two hundred level-ups through the real loop still keep a healthy pick rate.
{
  const g = new Game({ seed: 11 });
  let offers = 0;
  for (let i = 0; i < 200; i++) {
    g._levelUp();
    if (g.pendingCards.length) offers++;
    applySettled(g, g.pendingCards[0]);
  }
  assert.equal(offers, 200, 'every level-up must offer a card');
  assert.ok(g.bulletDmg >= 5 && g.maxHp > 7, 'build should keep growing (' + g.bulletDmg + ' dmg, ' + g.maxHp + ' hp)');
}

console.log('levelup OK', { cards: CARDS.length, capped: CARDS.filter((c) => c.max != null).length, xpToLevel10: xpToLevel(10) });
