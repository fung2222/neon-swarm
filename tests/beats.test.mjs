/**
 * Phase 3 beats — SENTINEL PRIME + HUNTER RAID + SWARM CORE boss.
 * Phase 6 endless — elites ~90s / boss ~300s after startAfter=360 (v0.9.18).
 * Run: node tests/beats.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { ELITE, BOSS, BEATS, ENDLESS, ENEMIES, TRIAL, eliteCfg } from '../js/config.js';

assert.ok(ENEMIES.sentinel, 'sentinel enemy def');
assert.ok(ENEMIES.hunter, 'hunter enemy def');
assert.ok(ENEMIES.swarm_core, 'swarm_core enemy def');
assert.ok(ELITE.telegraphSec >= 1.0, 'telegraphSec >= 1s');
assert.ok(eliteCfg('hunter').telegraphSec >= 1.2, 'hunter telegraph >= 1.2s');
assert.ok(eliteCfg('hunter').comboSegs >= 2, 'hunter multi-segment');
assert.ok(BOSS.volleyTelegraphSec >= 0.8, 'volley telegraph >= 0.8s');
assert.equal(BEATS[0].at, 120);
assert.equal(BEATS[0].kind, 'elite');
assert.equal(BEATS[0].id, 'sentinel');
assert.equal(BEATS[1].at, 240);
assert.equal(BEATS[1].kind, 'elite');
assert.equal(BEATS[1].id, 'hunter');
assert.equal(BEATS[2].at, 360);
assert.equal(BEATS[2].kind, 'boss');
assert.equal(BEATS[2].id, 'swarm_core');
assert.equal(BOSS.cardChoices, 3);
assert.equal(TRIAL.surviveSec, 480);
assert.equal(ENDLESS.startAfter, 360);
assert.equal(ENDLESS.eliteEvery, 90);
assert.equal(ENDLESS.bossEvery, 300);
assert.deepEqual(ENDLESS.eliteRotate, ['sentinel', 'hunter']);
assert.equal(ENDLESS.bossId, 'swarm_core');

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
  g2._beatsFired['240:hunter'] = true;
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
  g._beatsFired['240:hunter'] = true;
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
  g._beatsFired['240:hunter'] = true;
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
  g._beatsFired['240:hunter'] = true;
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
  g._beatsFired['240:hunter'] = true;
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
  g._beatsFired['240:hunter'] = true;
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

// ---------- Elite #2 HUNTER RAID @240 — multi-segment ----------
{
  const g = new Game({ seed: 42 });
  g.enemies.length = 0;
  g.invuln = 999;
  g.t = 239;
  g._beatsFired['120:sentinel'] = true;
  let sawHunter = false;
  let hunter = null;
  while (g.t < 242 && g.alive) {
    if (g.pausedForLevel && g.pendingCards) g.applyCard(g.pendingCards[0]);
    g.stopMove();
    const { events } = g.step(dt);
    for (const ev of events) {
      if (ev.type === 'beat' && ev.kind === 'elite' && ev.id === 'hunter') sawHunter = true;
      if (ev.type === 'eliteIn' && ev.nameEn === 'HUNTER RAID') sawHunter = true;
    }
    if (!hunter) hunter = g.enemies.find((e) => e.elite && e.type === 'hunter') || null;
  }
  assert.ok(sawHunter, 'hunter beat should fire near t=240');
  assert.ok(hunter, 'hunter entity should exist');
  assert.equal(hunter.type, 'hunter');
  assert.equal(hunter.comboSegs, 2, 'hunter has 2 combo segments');
  assert.equal(g.enemies.filter((e) => e.elite).length, 1, 'max one elite at hunter spawn');
}

// Multi-segment: two telegraphs ≥1.2s each before charge damage; still max one elite
{
  const g = new Game({ seed: 55 });
  g.enemies.length = 0;
  g.invuln = 0;
  g.hp = 30;
  g.t = 240;
  g._beatsFired['120:sentinel'] = true;
  g._beatsFired['240:hunter'] = true;
  g._spawnPauseUntil = 0;
  const hCfg = eliteCfg('hunter');
  const e = g._spawnElite({ at: 240, kind: 'elite', id: 'hunter' }, []);
  assert.ok(e);
  assert.equal(e.comboSegs, 2);
  e.x = g.px + 4;
  e.z = g.pz;
  e.phase = 'walk';
  e.phaseT = 0.01;
  const teleDurations = [];
  const chargeSegs = [];
  let hurtInTele = false;
  let guard = 0;
  while (guard++ < 8000 && g.alive && teleDurations.length < 2) {
    if (g.pausedForLevel && g.pendingCards) g.applyCard(g.pendingCards[0]);
    g.stopMove();
    const el = g.enemies.find((x) => x.elite);
    if (!el) break;
    // Keep alive; park near player so charge contact is possible after telegraph
    el.hp = Math.max(el.hp, 40);
    if (el.phase === 'telegraph') {
      el.x = g.px;
      el.z = g.pz;
    }
    const { events } = g.step(dt);
    for (const ev of events) {
      if (ev.type === 'telegraph') teleDurations.push(ev.duration);
      if (ev.type === 'eliteCharge') chargeSegs.push(ev.segment);
      if (ev.type === 'hurt' && el.phase === 'telegraph') hurtInTele = true;
    }
    assert.equal(g.enemies.filter((x) => x.elite).length, 1, 'still max one elite during combo');
  }
  assert.ok(teleDurations.length >= 2, 'two telegraphs in combo, got ' + teleDurations.length);
  assert.ok(teleDurations[0] >= 1.2, 'seg0 telegraph ≥1.2s');
  assert.ok(teleDurations[1] >= 1.2, 'seg1 telegraph ≥1.2s');
  assert.equal(hurtInTele, false, 'no hurt during either telegraph');
  assert.ok(chargeSegs.length >= 1, 'at least one charge after telegraph');
  // Force second charge contact damage after both telegraphs completed
  const el = g.enemies.find((x) => x.elite);
  assert.ok(el, 'hunter still alive after multi-seg');
  el.phase = 'charge';
  el.phaseT = hCfg.chargeSec;
  el.chargeDx = 0;
  el.chargeDz = 1;
  el.x = g.px;
  el.z = g.pz;
  g.invuln = 0;
  const hpBefore = g.hp;
  const { events: cev } = g.step(dt);
  assert.ok(cev.some((ev) => ev.type === 'hurt') || g.hp < hpBefore, 'charge deals damage after telegraphs');
}

// Max one elite: sentinel alive blocks hunter beat (beat marked fired, no second elite)
{
  const g = new Game({ seed: 61 });
  g.enemies.length = 0;
  g.invuln = 999;
  g.t = 120;
  g._beatsFired = {};
  g._spawnPauseUntil = 0;
  const s = g._spawnElite({ at: 120, kind: 'elite', id: 'sentinel' }, []);
  assert.ok(s);
  g._beatsFired['120:sentinel'] = true;
  g.t = 240;
  const { events } = g.step(dt);
  assert.equal(g.enemies.filter((e) => e.elite).length, 1, 'max one elite when hunter would fire');
  assert.ok(g._beatsFired['240:hunter'], 'hunter beat marked even if skipped');
  assert.ok(!g.enemies.some((e) => e.type === 'hunter'), 'no hunter while sentinel alive');
}

// ---------- Endless elites after boss (v0.9.18) ----------
function driveQuiet(g, until, onEvents) {
  let guard = 0;
  while (g.t < until && g.alive && guard++ < 500000) {
    g.invuln = 999;
    // Clear ordinary swarm noise; keep elites/boss for cadence tests
    g.enemies = g.enemies.filter((e) => e.elite || e.boss);
    g.bullets.length = 0;
    g.gems.length = 0;
    g.spawnAcc = 0;
    g.bossHazards.length = 0;
    if (g.pausedForLevel && g.pendingCards && g.pendingCards.length) {
      g.applyCard(g.pendingCards[0]);
    }
    g.stopMove();
    const { events } = g.step(dt);
    if (onEvents) onEvents(events, g);
  }
}

// After ~450 and ~540 another elite can spawn (rotate sentinel → hunter)
{
  const g = new Game({ seed: 77, endless: true });
  g.enemies.length = 0;
  g.invuln = 999;
  // Skip fixed beats so we only observe endless cadence
  g._beatsFired['120:sentinel'] = true;
  g._beatsFired['240:hunter'] = true;
  g._beatsFired['360:swarm_core'] = true;
  g.t = ENDLESS.startAfter - 0.05;
  g._spawnPauseUntil = 0;

  const spawned = [];
  const noteSpawn = (game) => {
    const el = game.enemies.find((e) => e.elite && !e.boss && e.hp > 0);
    if (!el) return;
    const last = spawned[spawned.length - 1];
    if (last && Math.abs(last.t - game.t) < 0.5) return; // beat + eliteIn same tick
    spawned.push({ t: game.t, type: el.type });
  };
  driveQuiet(g, ENDLESS.startAfter + ENDLESS.eliteEvery + 2, (events, game) => {
    if (events.some((ev) => ev.type === 'eliteIn' || (ev.type === 'beat' && ev.kind === 'elite'))) {
      noteSpawn(game);
    }
    // Remove elite so next schedule can fire (defer-while-alive)
    game.enemies = game.enemies.filter((e) => !(e.elite && !e.boss));
  });
  assert.ok(spawned.length >= 1, 'endless elite near 450, got ' + spawned.length);
  assert.ok(spawned[0].t >= ENDLESS.startAfter + ENDLESS.eliteEvery - 1, 'first endless ~450');
  assert.ok(spawned[0].t < ENDLESS.startAfter + ENDLESS.eliteEvery + 3);
  assert.equal(spawned[0].type, 'sentinel', 'first endless rotates sentinel');

  // Continue to ~540
  driveQuiet(g, ENDLESS.startAfter + ENDLESS.eliteEvery * 2 + 2, (events, game) => {
    if (events.some((ev) => ev.type === 'eliteIn' || (ev.type === 'beat' && ev.kind === 'elite'))) {
      noteSpawn(game);
    }
    game.enemies = game.enemies.filter((e) => !(e.elite && !e.boss));
  });
  assert.ok(spawned.length >= 2, 'second endless elite near 540, got ' + JSON.stringify(spawned));
  assert.ok(spawned[1].t >= ENDLESS.startAfter + ENDLESS.eliteEvery * 2 - 1);
  assert.equal(spawned[1].type, 'hunter', 'second endless rotates hunter');
}

// Max one elite: defer schedule while elite alive (do not stack)
{
  const g = new Game({ seed: 88, endless: true });
  g.enemies.length = 0;
  g.invuln = 999;
  g._beatsFired['120:sentinel'] = true;
  g._beatsFired['240:hunter'] = true;
  g._beatsFired['360:swarm_core'] = true;
  g.t = ENDLESS.startAfter + ENDLESS.eliteEvery - 0.05;
  g._spawnPauseUntil = 0;
  // Pre-place an elite; endless should defer
  const stuck = g._spawnElite({ at: g.t, kind: 'elite', id: 'sentinel' }, []);
  assert.ok(stuck);
  stuck.hp = 9999;
  const beforeAt = g._nextEndlessEliteAt; // still null until first _endlessBeatCheck
  driveQuiet(g, ENDLESS.startAfter + ENDLESS.eliteEvery + 5, null);
  assert.equal(g.enemies.filter((e) => e.elite && !e.boss).length, 1, 'still max one elite');
  assert.ok(g._nextEndlessEliteAt != null, 'schedule initialized');
  // Schedule not advanced past first slot while elite lived
  assert.equal(g._nextEndlessEliteAt, ENDLESS.startAfter + ENDLESS.eliteEvery,
    'deferred: nextEndlessEliteAt stays at first slot while elite alive');
  // Clear elite and advance — should spawn and advance schedule
  g.enemies = g.enemies.filter((e) => !(e.elite && !e.boss));
  driveQuiet(g, Math.max(g.t, ENDLESS.startAfter + ENDLESS.eliteEvery) + 3, (events, game) => {
    // Keep at most briefly; clear after spawn so we observe advance
    if (game.enemies.some((e) => e.elite && !e.boss)) {
      game.enemies = game.enemies.filter((e) => !(e.elite && !e.boss));
    }
  });
  assert.ok(
    g._nextEndlessEliteAt >= ENDLESS.startAfter + ENDLESS.eliteEvery * 2 - 0.01,
    'after clear, schedule advances; got ' + g._nextEndlessEliteAt,
  );
}

// endless:false skips endless cadence
{
  const g = new Game({ seed: 91, endless: false });
  g.enemies.length = 0;
  g.invuln = 999;
  g._beatsFired['120:sentinel'] = true;
  g._beatsFired['240:hunter'] = true;
  g._beatsFired['360:swarm_core'] = true;
  g.t = ENDLESS.startAfter + ENDLESS.eliteEvery - 0.05;
  driveQuiet(g, ENDLESS.startAfter + ENDLESS.eliteEvery + 5, null);
  assert.equal(g.enemies.filter((e) => e.elite).length, 0, 'no endless elite when endless:false');
  assert.equal(g._nextEndlessEliteAt, null);
}

// Endless boss reuses swarm_core ~300s after startAfter
{
  const g = new Game({ seed: 95, endless: true });
  g.enemies.length = 0;
  g.invuln = 999;
  g._beatsFired['120:sentinel'] = true;
  g._beatsFired['240:hunter'] = true;
  g._beatsFired['360:swarm_core'] = true;
  g.t = ENDLESS.startAfter + ENDLESS.bossEvery - 0.05;
  g._spawnPauseUntil = 0;
  let sawBoss = false;
  driveQuiet(g, ENDLESS.startAfter + ENDLESS.bossEvery + 3, (events, game) => {
    for (const ev of events) {
      if (ev.type === 'bossIn' || (ev.type === 'beat' && ev.kind === 'boss')) sawBoss = true;
    }
    // Drop endless elites quickly so they don't clutter; keep boss
    game.enemies = game.enemies.filter((e) => !(e.elite && !e.boss));
  });
  assert.ok(sawBoss || g.enemies.some((e) => e.boss), 'endless boss near 660');
  const boss = g.enemies.find((e) => e.boss);
  assert.ok(boss);
  assert.equal(boss.type, 'swarm_core');
}

// Trial surviveSec still 480 — logic does not auto-end; document main.checkTrialEnd
{
  assert.equal(TRIAL.surviveSec, 480);
  const g = new Game({ seed: 101, endless: true });
  g.invuln = 999;
  g._beatsFired['120:sentinel'] = true;
  g._beatsFired['240:hunter'] = true;
  g._beatsFired['360:swarm_core'] = true;
  g.t = TRIAL.surviveSec - 0.5;
  driveQuiet(g, TRIAL.surviveSec + 1.0, null);
  assert.ok(g.alive, 'logic keeps run alive past surviveSec');
  assert.ok(g.t >= TRIAL.surviveSec, 'time passed trial cap');
  // main.checkTrialEnd() ends trial UI runs at TRIAL.surviveSec
}

console.log('beats OK', {
  eliteAt: BEATS[0].at,
  elite2At: BEATS[1].at,
  bossAt: BEATS[2].at,
  endlessEliteEvery: ENDLESS.eliteEvery,
  endlessBossEvery: ENDLESS.bossEvery,
  endlessStartAfter: ENDLESS.startAfter,
  hunterComboSegs: eliteCfg('hunter').comboSegs,
  volleyTelegraphSec: BOSS.volleyTelegraphSec,
  cardChoices: BOSS.cardChoices,
  trialSurviveSec: TRIAL.surviveSec,
});
