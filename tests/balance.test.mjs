// Applies a real level-up through the game logic: drive the player in circles,
// pick cards as they appear, and report HP/level/kills/survival at time marks.
import { Game } from '../js/logic.js';

function simulate({ seed = 7, untilSec = 600, strategy = 'circle', pick = 'first', dt = 1 / 60 } = {}) {
  const g = new Game({ seed });
  const marks = [15, 30, 60, 120, 180, 240, 300, 420, 480];
  const out = [];
  let m = 0;
  let picks = 0;
  let lastLevelAt = 0;
  let guard = 0;
  while (g.t < untilSec && g.alive && guard++ < 2_000_000) {
    if (strategy === 'circle') {
      const a = g.t * 0.55;
      g.moveDir(Math.cos(a), Math.sin(a));
    } else if (strategy === 'flee') {
      // run away from the local centroid
      let cx = 0, cz = 0;
      for (const e of g.enemies) { cx += e.x; cz += e.z; }
      const n = g.enemies.length || 1;
      g.moveDir(g.px - cx / n, g.pz - cz / n);
    } else {
      g.stopMove();
    }
    if (g.pausedForLevel && g.pendingCards) {
      const cards = g.pendingCards;
      const chosen = pick === 'first' ? cards[0] : cards[Math.floor(cards.length / 2)];
      g.applyCard(chosen);
      picks++;
      lastLevelAt = g.t;
    }
    g.step(dt);
    while (m < marks.length && g.t >= marks[m]) {
      out.push({ t: marks[m], lv: g.level, hp: +g.hp.toFixed(1), maxHp: g.maxHp, kills: g.kills, score: g.score, enemies: g.enemies.length, dmg: g.bulletDmg, rate: +g.fireCd.toFixed(2) });
      m++;
    }
  }
  return { survived: +g.t.toFixed(1), alive: g.alive, level: g.level, picks, score: g.score, marks: out };
}

for (const strategy of ['circle', 'flee', 'idle']) {
  const r = simulate({ strategy });
  console.log('\n== ' + strategy + ' == survived ' + r.survived + 's alive=' + r.alive + ' lv=' + r.level + ' picks=' + r.picks + ' score=' + r.score);
  for (const row of r.marks) console.log('  ' + JSON.stringify(row));
}

