/**
 * PHASE3-ELITE-COMMANDER-001 — army commander silhouette + summon/attack mode telegraphs.
 * Run: node tests/commander.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { ENEMIES, ELITE, BEATS, ENDLESS, eliteCfg } from '../js/config.js';

assert.ok(ENEMIES.commander, 'ENEMIES.commander defined');
assert.equal(ENEMIES.commander.zh, '軍指揮官');
assert.equal(ENEMIES.commander.en, 'ARMY COMMANDER');
assert.equal(ENEMIES.commander.kind, 'commander');
assert.ok(ENEMIES.commander.elite === true);
assert.ok(ENEMIES.commander.color !== ENEMIES.sentinel.color, 'commander color ≠ sentinel');
assert.ok(ENEMIES.commander.color !== ENEMIES.hunter.color, 'commander color ≠ hunter');
assert.ok(ENEMIES.commander.color !== ENEMIES.chief.color, 'commander color ≠ chief');

const cfg = eliteCfg('commander');
assert.ok(cfg.modeShift, 'modeShift');
assert.ok(cfg.summonTelegraphSec >= 0.8 && cfg.summonTelegraphSec <= 1.2);
assert.ok(cfg.attackTelegraphSec >= 0.8 && cfg.attackTelegraphSec <= 1.2);
assert.ok((cfg.summonCount || 0) >= 2);
assert.ok(Array.isArray(cfg.summonTypes) && cfg.summonTypes.length >= 1);

assert.equal(BEATS[2].id, 'commander');
assert.equal(BEATS[2].at, 300);
assert.deepEqual(ENDLESS.eliteRotate, ['sentinel', 'hunter', 'commander']);

const dt = 1 / 30;

// Summon mode: readable orange/red telegraph then spawn soldiers/drones
{
  const g = new Game({ seed: 3 });
  g.enemies.length = 0;
  g.invuln = 999;
  g.px = 0; g.pz = 0;
  g._spawnPauseUntil = 9999;
  const e = g._spawnElite({ at: 300, kind: 'elite', id: 'commander' }, []);
  assert.ok(e);
  assert.equal(e.type, 'commander');
  assert.equal(e.cmdMode, 'summon');
  e.x = 0; e.z = -6;
  e.phase = 'walk';
  e.phaseT = 0.01;

  let tele = null;
  let summon = null;
  let guard = 0;
  while (guard++ < 3000 && !summon) {
    const el = g.enemies.find((x) => x.elite);
    if (!el) break;
    el.hp = Math.max(el.hp, 50);
    const { events } = g.step(dt);
    for (const ev of events) {
      if (ev.type === 'telegraph' && ev.kind === 'commanderSummon') tele = ev;
      if (ev.type === 'commanderSummon') summon = ev;
    }
  }
  assert.ok(tele, 'summon telegraph');
  assert.ok(tele.duration >= 0.8, 'summon tele ≥0.8');
  assert.ok(tele.marks && tele.marks.length >= 2, 'telegraph carries summon marks');
  assert.ok(summon, 'commanderSummon event');
  assert.ok(summon.count >= 2, 'spawned units');
  const minions = g.enemies.filter((x) => !x.elite && (x.type === 'soldier' || x.type === 'drone'));
  assert.ok(minions.length >= 2, 'soldiers/drones present');
  assert.equal(e.cmdMode, 'attack', 'shifts to attack');
  assert.equal(g.enemies.filter((x) => x.elite).length, 1, 'still max one elite');
}

// Attack mode: telegraph ≥0.8s, no damage until charge
{
  const g = new Game({ seed: 5 });
  g.enemies.length = 0;
  g.invuln = 0;
  g.hp = 20;
  g.px = 0; g.pz = 0;
  g._spawnPauseUntil = 9999;
  const e = g._spawnElite({ at: 300, kind: 'elite', id: 'commander' }, []);
  e.cmdMode = 'attack';
  e.x = 0; e.z = -5;
  e.phase = 'walk';
  e.phaseT = 0.01;

  let tele = null;
  let charge = null;
  let hurtTele = false;
  const hp0 = g.hp;
  let guard = 0;
  while (guard++ < 3000 && !charge) {
    const el = g.enemies.find((x) => x.elite);
    if (!el) break;
    el.hp = Math.max(el.hp, 50);
    if (el.phase === 'telegraph_attack') { el.x = g.px; el.z = g.pz; }
    const { events } = g.step(dt);
    for (const ev of events) {
      if (ev.type === 'telegraph' && ev.kind === 'commanderAttack') tele = ev;
      if (ev.type === 'eliteCharge') charge = ev;
      if (ev.type === 'hurt' && el.phase === 'telegraph_attack') hurtTele = true;
    }
  }
  assert.ok(tele, 'attack telegraph');
  assert.ok(tele.duration >= 0.8);
  assert.equal(hurtTele, false);
  assert.ok(charge, 'charge after telegraph');
  // Contact on charge
  e.phase = 'charge';
  e.phaseT = cfg.chargeSec;
  e.chargeDx = 0; e.chargeDz = 1;
  e.x = g.px; e.z = g.pz;
  g.invuln = 0;
  const { events } = g.step(dt);
  assert.ok(events.some((ev) => ev.type === 'hurt') || g.hp < hp0, 'charge damages');
}

// Mode alternation: summon → attack → summon
{
  const g = new Game({ seed: 9 });
  g.enemies.length = 0;
  g.invuln = 999;
  g._spawnPauseUntil = 9999;
  const e = g._spawnElite({ at: 300, kind: 'elite', id: 'commander' }, []);
  e.x = 3; e.z = -4;
  e.phase = 'walk'; e.phaseT = 0.01; e.cmdMode = 'summon';
  const modes = [];
  let guard = 0;
  while (guard++ < 8000 && modes.length < 3) {
    const el = g.enemies.find((x) => x.elite);
    if (!el) break;
    el.hp = Math.max(el.hp, 80);
    // Skip charge contact by parking away
    if (el.phase === 'charge') { el.x = g.px + 8; el.z = g.pz + 8; }
    const prev = el.cmdMode;
    const { events } = g.step(dt);
    if (events.some((ev) => ev.type === 'commanderSummon')) modes.push('summon');
    if (events.some((ev) => ev.type === 'eliteCharge' && ev.eliteType === 'commander')) modes.push('attack');
  }
  assert.ok(modes.includes('summon') && modes.includes('attack'), 'both modes fire: ' + JSON.stringify(modes));
}

console.log('commander OK', {
  zh: ENEMIES.commander.zh,
  summonTele: cfg.summonTelegraphSec,
  attackTele: cfg.attackTelegraphSec,
  rotate: ENDLESS.eliteRotate,
  beatAt: BEATS[2].at,
});
