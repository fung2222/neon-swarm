// Applies real level-ups through the game logic: drive the player in circles, pick cards as
// they appear, and report HP/level/kills/survival at time marks. Used to keep the manhunt
// pacing honest — one circling death should land in the 2-4 minute band.
import { Game } from '../js/logic.js';
import { MECHS } from '../js/config.js';

function simulate({ seed = 7, untilSec = 600, strategy = 'circle', pick = 'first', dt = 1 / 60, mech = 'horn' } = {}) {
  const g = new Game({ seed, mech });
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
      let cx = 0, cz = 0;
      for (const e of g.enemies) { cx += e.x; cz += e.z; }
      const n = g.enemies.length || 1;
      g.moveDir(g.px - cx / n, g.pz - cz / n);
    } else {
      g.stopMove();
    }
    if (g.pausedForLevel && g.pendingCards) {
      const cards = g.pendingCards;
      g.applyCard(pick === 'first' ? cards[0] : cards[Math.floor(cards.length / 2)]);
      picks++;
      lastLevelAt = g.t;
    }
    g.step(dt);
    while (m < marks.length && g.t >= marks[m]) {
      out.push({ t: marks[m], lv: g.level, hp: +g.hp.toFixed(1), maxHp: g.maxHp, kills: g.kills, enemies: g.enemies.length });
      m++;
    }
  }
  return { survived: +g.t.toFixed(1), alive: g.alive, level: g.level, picks, score: g.score, killer: g.killer, marks: out };
}

const runs = [];
for (const strategy of ['circle', 'flee', 'idle']) {
  const r = simulate({ strategy });
  runs.push({ strategy, ...r });
  console.log('\n== ' + strategy + ' == survived ' + r.survived + 's alive=' + r.alive + ' lv=' + r.level + ' picks=' + r.picks + ' score=' + r.score + ' killedBy=' + (r.killer ? r.killer.en : '-'));
  for (const row of r.marks) console.log('  ' + JSON.stringify(row));
}

// Frames: each should clearly change the opening pace.
console.log('\n== frames (circle, seed 7) ==');
for (const mch of MECHS) {
  const r = simulate({ mech: mch.id });
  console.log('  ' + mch.id + ': survived ' + r.survived + 's lv' + r.level + ' score ' + r.score);
}

// Multi-seed spread so one lucky run does not drive tuning.
const seeds = [1, 7, 13, 21, 42, 99];
const spread = seeds.map((s) => simulate({ seed: s }).survived).sort((a, b) => a - b);
const median = spread[Math.floor(spread.length / 2)];
console.log('\nmultiseed circle survival: ' + spread.join(', ') + '  median ' + median + 's');
if (median < 90 || median > 260) console.log('WARN pacing outside 90-260s band — tune pressure/caps');