/**
 * Phase 3 elite beat timing — SENTINEL PRIME telegraph ≥ ~1s before charge damage.
 * Run: node tests/beats.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { ELITE, BEATS, ENEMIES } from '../js/config.js';

assert.ok(ENEMIES.sentinel, 'sentinel enemy def');
assert.ok(ELITE.telegraphSec >= 1.0, 'telegraphSec >= 1s');
assert.equal(BEATS[0].at, 120);
assert.equal(BEATS[0].kind, 'elite');

// Fast-forward to beat window with tiny world (clear early spawns)
const g = new Game({ seed: 42 });
g.enemies.length = 0;
g.invuln = 999;
// Skip early time without enemy pressure
const dt = 1 / 30;
let sawBeat = false;
let sawTelegraph = false;
let telegraphEv = null;
let chargeEv = null;
let elite = null;

while (g.t < 125 && g.alive) {
  // Keep player still; auto-clear level pauses
  if (g.pausedForLevel && g.pendingCards) g.applyCard(g.pendingCards[0]);
  g.stopMove();
  const { events } = g.step(dt);
  for (const ev of events) {
    if (ev.type === 'beat' && ev.kind === 'elite') sawBeat = true;
    if (ev.type === 'eliteIn') sawBeat = true;
    if (ev.type === 'telegraph') {
      sawTelegraph = true;
      telegraphEv = ev;
    }
    if (ev.type === 'eliteCharge') chargeEv = ev;
  }
  if (!elite) elite = g.enemies.find((e) => e.elite) || null;
}

assert.ok(sawBeat, 'elite beat should fire near t=120');
assert.ok(elite, 'elite entity should exist');
assert.ok(elite.elite === true);
assert.equal(g.enemies.filter((e) => e.elite).length, 1, 'max one elite');

// Drive until first telegraph + charge cycle
let guard = 0;
while ((!telegraphEv || !chargeEv) && guard++ < 20000 && g.alive) {
  if (g.pausedForLevel && g.pendingCards) g.applyCard(g.pendingCards[0]);
  g.stopMove();
  // Keep elite alive
  const e = g.enemies.find((x) => x.elite);
  if (e) e.hp = Math.max(e.hp, 40);
  const { events } = g.step(dt);
  for (const ev of events) {
    if (ev.type === 'telegraph' && !telegraphEv) telegraphEv = ev;
    if (ev.type === 'eliteCharge' && !chargeEv) chargeEv = ev;
  }
}

assert.ok(telegraphEv, 'telegraph event fired');
assert.ok(telegraphEv.duration >= 1.0, 'telegraph duration >= 1s, got ' + telegraphEv.duration);
assert.ok(
  telegraphEv.damageAt - telegraphEv.duration >= telegraphEv.damageAt - ELITE.telegraphSec - 0.05,
  'damageAt aligned with telegraph'
);
// Explicit: damageAt is telegraph start + duration
const gap = telegraphEv.damageAt - (g.t - (elite && elite.phase === 'charge' ? 0 : 0));
// Better check: duration field and ELITE constant
assert.ok(ELITE.telegraphSec >= 1.0);
assert.equal(telegraphEv.duration, ELITE.telegraphSec);

assert.ok(chargeEv, 'eliteCharge event after telegraph');

// Direct unit: spawn elite, force telegraph, ensure no hurt during telegraph window
const g2 = new Game({ seed: 99 });
g2.enemies.length = 0;
g2.invuln = 0;
g2.hp = 20;
g2.t = 120;
g2._beatsFired['120:sentinel'] = true; // prevent double spawn from _beatCheck
g2._spawnPauseUntil = 0;
const evs = [];
const e2 = g2._spawnElite({ at: 120, kind: 'elite', id: 'sentinel' }, evs);
assert.ok(e2);
// Force into telegraph aimed at player (overlapping)
e2.x = g2.px;
e2.z = g2.pz;
e2.phase = 'walk';
e2.phaseT = 0;
const beforeHp = g2.hp;
// Step through full telegraph without entering charge damage
e2.phase = 'telegraph';
e2.phaseT = ELITE.telegraphSec;
e2.telegraphDur = ELITE.telegraphSec;
e2.telegraphAt = g2.t;
e2.damageAt = g2.t + ELITE.telegraphSec;
e2.chargeDx = 0;
e2.chargeDz = 1;
let hurtDuringTele = false;
let teleTime = 0;
for (let i = 0; i < 2000; i++) {
  const el0 = g2.enemies.find((x) => x.elite);
  if (!el0 || el0.phase !== 'telegraph') break;
  el0.x = g2.px;
  el0.z = g2.pz;
  const { events } = g2.step(dt);
  teleTime += dt;
  // Only count hurt while STILL in telegraph after the step (charge transition is next phase)
  const el1 = g2.enemies.find((x) => x.elite);
  if (el1 && el1.phase === 'telegraph' && events.some((ev) => ev.type === 'hurt')) {
    hurtDuringTele = true;
  }
  if (el1 && el1.phase !== 'telegraph') break;
}
assert.ok(teleTime >= 1.0 - dt * 2, 'spent ≥1s in telegraph, got ' + teleTime.toFixed(3));
assert.equal(hurtDuringTele, false, 'no contact damage during telegraph (≥1s readable)');
assert.ok(g2.hp === beforeHp, 'HP unchanged during telegraph overlap');

// After telegraph → charge, overlapping should hurt
const el = g2.enemies.find((x) => x.elite);
assert.ok(el, 'elite still alive');
// Force charge phase overlapping
el.phase = 'charge';
el.phaseT = ELITE.chargeSec;
el.chargeDx = 0;
el.chargeDz = 1;
el.x = g2.px;
el.z = g2.pz;
g2.invuln = 0;
const { events: chargeEvents } = g2.step(dt);
assert.ok(
  chargeEvents.some((ev) => ev.type === 'hurt') || g2.hp < beforeHp,
  'charge phase deals damage on contact'
);

console.log('beats OK', {
  telegraphSec: ELITE.telegraphSec,
  beatAt: BEATS[0].at,
  sawBeat,
  eliteType: elite && elite.type,
});
