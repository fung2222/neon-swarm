/**
 * Phase 3 beats — SENTINEL PRIME + SWARM CORE boss.
 * Run: node tests/beats.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { ELITE, BOSS, BEATS, ENEMIES, TRIAL } from '../js/config.js';

assert.ok(ENEMIES.sentinel, 'sentinel enemy def');
assert.ok(ENEMIES.swarm_core, 'swarm_core enemy def');
assert.ok(ELITE.telegraphSec >= 1.0, 'telegraphSec >= 1s');
assert.ok(BOSS.volleyTelegraphSec >= 0.8, 'volley telegraph >= 0.8s');
assert.equal(BEATS[0].at, 120);
assert.equal(BEATS[0].kind, 'elite');
assert.equal(BEATS[1].at, 360);
assert.equal(BEATS[1].kind, 'boss');
assert.equal(BEATS[1].id, 'swarm_core');
assert.equal(BOSS.cardChoices, 3);
assert.equal(TRIAL.surviveSec, 480);

const dt = 1 / 30;

// ---------- Elite (existing) ----------
{
  const g = new Game({ seed: 42 });
  g.enemies.length = 0;
  g.invuln = 999;
  let sawBeat = false;
  let telegraphEv = null;
  let chargeEv = null;
  let elite = null;

  while (g.t < 125 && g.alive) {
    if (g.pausedForLevel && g.pendingCards) g.applyCard(g.pendingCards[0]);
    g.stopMove();
    const { events } = g.step(dt);
    for (const ev of events) {
      if (ev.type === 'beat' && ev.kind === 'elite') sawBeat = true;
      if (ev.type === 'eliteIn') sawBeat = true;
      if (ev.type === 'telegraph' && !telegraphEv) telegraphEv = ev;
      if (ev.type === 'eliteCharge') chargeEv = ev;
    }
    if (!elite) elite = g.enemies.find((e) => e.elite) || null;
  }

  assert.ok(sawBeat, 'elite beat should fire near t=120');
  assert.ok(elite, 'elite entity should exist');
  assert.ok(elite.elite === true);
  assert.equal(g.enemies.filter((e) => e.elite).length, 1, 'max one elite');

  let guard = 0;
  while ((!telegraphEv || !chargeEv) && guard++ < 20000 && g.alive) {
    if (g.pausedForLevel && g.pendingCards) g.applyCard(g.pendingCards[0]);
    g.stopMove();
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
  assert.equal(telegraphEv.duration, ELITE.telegraphSec);
  assert.ok(chargeEv, 'eliteCharge event after telegraph');
}

// Elite: no hurt during telegraph
{
  const g2 = new Game({ seed: 99 });
  g2.enemies.length = 0;
  g2.invuln = 0;
  g2.hp = 20;
  g2.t = 120;
  g2._beatsFired['120:sentinel'] = true;
  g2._spawnPauseUntil = 0;
  const evs = [];
  const e2 = g2._spawnElite({ at: 120, kind: 'elite', id: 'sentinel' }, evs);
  assert.ok(e2);
  e2.x = g2.px;
  e2.z = g2.pz;
  e2.phase = 'telegraph';
  e2.phaseT = ELITE.telegraphSec;
  e2.telegraphDur = ELITE.telegraphSec;
  e2.telegraphAt = g2.t;
  e2.damageAt = g2.t + ELITE.telegraphSec;
  e2.chargeDx = 0;
  e2.chargeDz = 1;
  const beforeHp = g2.hp;
  let hurtDuringTele = false;
  let teleTime = 0;
  for (let i = 0; i < 2000; i++) {
    const el0 = g2.enemies.find((x) => x.elite);
    if (!el0 || el0.phase !== 'telegraph') break;
    el0.x = g2.px;
    el0.z = g2.pz;
    const { events } = g2.step(dt);
    teleTime += dt;
    const el1 = g2.enemies.find((x) => x.elite);
    if (el1 && el1.phase === 'telegraph' && events.some((ev) => ev.type === 'hurt')) {
      hurtDuringTele = true;
    }
    if (el1 && el1.phase !== 'telegraph') break;
  }
  assert.ok(teleTime >= 1.0 - dt * 2, 'spent ≥1s in telegraph, got ' + teleTime.toFixed(3));
  assert.equal(hurtDuringTele, false, 'no contact damage during telegraph (≥1s readable)');
  assert.ok(g2.hp === beforeHp, 'HP unchanged during telegraph overlap');

  const el = g2.enemies.find((x) => x.elite);
  assert.ok(el, 'elite still alive');
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
}

// ---------- Boss SWARM CORE ----------
{
  const g = new Game({ seed: 7 });
  g.enemies.length = 0;
  g.invuln = 999;
  g.t = 359;
  g._beatsFired['120:sentinel'] = true;
  let sawBoss = false;
  let boss = null;
  while (g.t < 362 && g.alive) {
    if (g.pausedForLevel && g.pendingCards) g.applyCard(g.pendingCards[0]);
    g.stopMove();
    const { events } = g.step(dt);
    for (const ev of events) {
      if (ev.type === 'beat' && ev.kind === 'boss') sawBoss = true;
      if (ev.type === 'bossIn') sawBoss = true;
    }
    if (!boss) boss = g.enemies.find((e) => e.boss) || null;
  }
  assert.ok(sawBoss, 'boss beat should fire near t=360');
  assert.ok(boss, 'boss entity should exist');
  assert.equal(boss.type, 'swarm_core');
  assert.equal(g.enemies.filter((e) => e.boss).length, 1, 'max one boss');
  assert.equal(boss.phase, 'orbit', 'starts in orbit phase');
}

// Boss HP thirds advance phases
{
  const g = new Game({ seed: 11 });
  g.enemies.length = 0;
  g.invuln = 999;
  g.t = 360;
  g._beatsFired['120:sentinel'] = true;
  g._beatsFired['360:swarm_core'] = true;
  const evs = [];
  const boss = g._spawnBoss({ at: 360, kind: 'boss', id: 'swarm_core' }, evs);
  assert.ok(boss);
  assert.equal(boss.phase, 'orbit');
  // Drop to mid third → volley
  boss.hp = boss.maxHp * 0.5;
  g.step(dt);
  assert.equal(boss.phase, 'volley', 'HP mid → volley');
  // Drop to last third → frenzy
  boss.hp = boss.maxHp * 0.2;
  const { events: fev } = g.step(dt);
  assert.equal(boss.phase, 'frenzy', 'HP low → frenzy');
  assert.ok(fev.some((e) => e.type === 'phase' && e.phase === 'frenzy') || boss.frenzyStarted,
    'frenzy phase marked');
  assert.ok(boss.frenzyLeft > 0 || boss.frenzyStarted, 'frenzy spike armed');
}

// Volley: telegraph lanes exist ≥0.8s before damaging bullets
{
  const g = new Game({ seed: 13 });
  g.enemies.length = 0;
  g.invuln = 0;
  g.hp = 30;
  g.t = 360;
  g._beatsFired['120:sentinel'] = true;
  g._beatsFired['360:swarm_core'] = true;
  const boss = g._spawnBoss({ at: 360, kind: 'boss', id: 'swarm_core' }, []);
  boss.hp = boss.maxHp * 0.5; // force volley
  boss.phase = 'volley';
  boss.bossSub = 'idle';
  boss.phaseT = BOSS.volleyTelegraphSec + 0.05;
  // Drive into telegraph
  let sawTele = null;
  let hurtBeforeFire = false;
  const hp0 = g.hp;
  for (let i = 0; i < 200; i++) {
    if (g.pausedForLevel && g.pendingCards) g.applyCard(g.pendingCards[0]);
    const { events } = g.step(dt);
    for (const ev of events) {
      if (ev.type === 'telegraph' && ev.kind === 'volley') sawTele = ev;
      if (ev.type === 'hurt' && boss.bossSub === 'telegraph') hurtBeforeFire = true;
    }
    if (sawTele && boss.bossSub === 'telegraph') break;
  }
  assert.ok(sawTele, 'volley telegraph event');
  assert.ok(sawTele.duration >= 0.8, 'volley telegraph duration >= 0.8s');
  assert.equal(sawTele.duration, BOSS.volleyTelegraphSec);
  // During telegraph: lanes present, no volley bullets yet
  const lanes = g.bossHazards.filter((h) => h.kind === 'volleyLane');
  assert.ok(lanes.length >= BOSS.volleyWays, 'volley lanes drawn during telegraph');
  assert.equal(g.bossHazards.filter((h) => h.kind === 'volleyBullet').length, 0,
    'no damaging bullets during telegraph');
  // Stay overlapping a lane origin — still no hurt from bullets during telegraph window
  const teleStart = g.t;
  while (boss.bossSub === 'telegraph' && g.alive) {
    // Park player on boss so contact may hurt, but bullet hazards must not exist yet
    const { events } = g.step(dt);
    if (events.some((ev) => ev.type === 'hurt' && g.bossHazards.some((h) => h.kind === 'volleyBullet'))) {
      hurtBeforeFire = true;
    }
    if (g.t - teleStart > BOSS.volleyTelegraphSec + 0.5) break;
  }
  assert.equal(hurtBeforeFire, false, 'no volley-bullet hurt during telegraph');
  // After fire: bullets exist
  let guard = 0;
  while (boss.bossSub !== 'idle' && guard++ < 200) g.step(dt);
  // Force fire if still waiting
  if (boss.bossSub === 'telegraph') {
    boss.phaseT = 0;
    g.step(dt);
  }
  // May need one more cycle — force a full volley fire
  boss.bossSub = 'idle';
  boss.phaseT = BOSS.volleyTelegraphSec;
  g.step(0.02);
  // enter telegraph then fire
  boss.phaseT = 0;
  const beforeBullets = g.bossHazards.filter((h) => h.kind === 'volleyBullet').length;
  g.step(dt);
  // If still telegraph, finish it
  if (boss.bossSub === 'telegraph') {
    boss.phaseT = 0;
    g.step(dt);
  }
  const bullets = g.bossHazards.filter((h) => h.kind === 'volleyBullet');
  assert.ok(bullets.length > 0 || beforeBullets > 0 || g.bossHazards.some((h) => h.fired),
    'volley bullets appear after telegraph');
}

// Boss kill reward: 3 cards + score bonus
{
  const g = new Game({ seed: 17 });
  g.enemies.length = 0;
  g.invuln = 999;
  g.t = 360;
  g._beatsFired['120:sentinel'] = true;
  g._beatsFired['360:swarm_core'] = true;
  const boss = g._spawnBoss({ at: 360, kind: 'boss', id: 'swarm_core' }, []);
  const scoreBefore = g.score;
  boss.hp = 0.01;
  // Deal lethal via aoe
  g._aoeAt(boss.x, boss.z, 5, 999, []);
  assert.ok(!g.enemies.some((e) => e.boss), 'boss dead');
  assert.ok(g.pausedForLevel, 'paused for card choice');
  assert.ok(g.pendingCards && g.pendingCards.length === 3, 'choice of 3 cards');
  const expectedBonus = Math.floor(BOSS.scoreBonusBase * (1 + 360 / 60));
  assert.ok(g.score >= scoreBefore + expectedBonus, 'score bonus applied');
}

// Trial: logic keeps boss alive past surviveSec; trial end is main's job at TRIAL.surviveSec
{
  const g = new Game({ seed: 19 });
  g.enemies.length = 0;
  g.invuln = 999;
  g.t = TRIAL.surviveSec - 0.5;
  g._beatsFired['120:sentinel'] = true;
  g._beatsFired['360:swarm_core'] = true;
  const boss = g._spawnBoss({ at: 360, kind: 'boss', id: 'swarm_core' }, []);
  assert.ok(boss);
  while (g.t < TRIAL.surviveSec + 1.0 && g.alive) {
    if (g.pausedForLevel && g.pendingCards) g.applyCard(g.pendingCards[0]);
    g.stopMove();
    boss.hp = Math.max(boss.hp, 50);
    g.step(dt);
  }
  assert.ok(g.alive, 'logic does not auto-end at trial cap');
  assert.ok(g.enemies.some((e) => e.boss), 'boss can still be alive past surviveSec');
  assert.ok(g.t >= TRIAL.surviveSec, 'time passed trial cap');
  // Document: main.checkTrialEnd() ends the run at TRIAL.surviveSec even if boss alive
  assert.equal(TRIAL.surviveSec, 480);
}

console.log('beats OK', {
  eliteAt: BEATS[0].at,
  bossAt: BEATS[1].at,
  volleyTelegraphSec: BOSS.volleyTelegraphSec,
  cardChoices: BOSS.cardChoices,
  trialSurviveSec: TRIAL.surviveSec,
});
