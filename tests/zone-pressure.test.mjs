/**
 * PHASE6-ZONE-PRESSURE-001 — shrinking / pollution safe zone.
 * Run: node tests/zone-pressure.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { ZONE_PRESSURE, ARENA, DANGER_PULSE, BOMBER, ARTILLERY } from '../js/config.js';

assert.ok(ZONE_PRESSURE, 'ZONE_PRESSURE defined');
assert.ok(ZONE_PRESSURE.startAfter >= 100 && ZONE_PRESSURE.startAfter <= 130, 'startAfter ~100–130');
assert.ok(ZONE_PRESSURE.shrinkSec >= 180 && ZONE_PRESSURE.shrinkSec <= 240, 'shrinkSec ~180–240');
assert.ok(Math.abs(ZONE_PRESSURE.startR - ARENA.soft) < 0.01 || (ZONE_PRESSURE.startR >= 28 && ZONE_PRESSURE.startR <= 32), 'startR ~ARENA.soft');
assert.ok(ZONE_PRESSURE.endR >= 14 && ZONE_PRESSURE.endR <= 18, 'endR playable floor 14–18');
assert.ok(ZONE_PRESSURE.endR < ZONE_PRESSURE.startR, 'shrinks inward');
assert.ok(ZONE_PRESSURE.tickSec >= 0.35 && ZONE_PRESSURE.tickSec <= 0.75, 'tickSec ~0.5');
assert.ok(ZONE_PRESSURE.dmgPerSec >= 0.4 && ZONE_PRESSURE.dmgPerSec <= 1.5, 'dmgPerSec sensible');
// ARENA constants unchanged for early game
assert.equal(ARENA.half, 36, 'ARENA.half unchanged');
assert.equal(ARENA.soft, 30, 'ARENA.soft unchanged');
assert.ok(DANGER_PULSE && BOMBER && ARTILLERY, 'sibling hazards still present');

// Early: inactive, full soft radius, no zonePressure events
{
  const g = new Game({ seed: 11 });
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g.invuln = 99;
  g.hp = 8;
  g.px = 28; g.pz = 0; // near soft edge — would be outside late safeR
  const dt = 1 / 30;
  let startEv = 0;
  let zoneHurt = 0;
  while (g.t < ZONE_PRESSURE.startAfter - 0.05 && g.alive) {
    g.enemies.length = 0;
    const { events } = g.step(dt);
    for (const ev of events) {
      if (ev.type === 'zonePressure') startEv++;
      if (ev.type === 'hurt' && ev.zonePressure) zoneHurt++;
    }
  }
  assert.equal(startEv, 0, 'no zonePressure start before startAfter');
  assert.equal(zoneHurt, 0, 'no pollution hurt before start');
  assert.equal(g.zonePressureActive, false, 'inactive early');
  assert.ok(Math.abs(g.safeR - ZONE_PRESSURE.startR) < 0.05, 'safeR = startR early');
}

// Activates at startAfter; one-shot start event; safeR lerps
{
  const g = new Game({ seed: 7 });
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g.invuln = 99;
  g.hp = 8;
  g.px = 0; g.pz = 0;
  g.alive = true;
  // Approach just before start without crossing
  g.t = ZONE_PRESSURE.startAfter - 0.05;
  g._zonePressureStarted = false;
  g.zonePressureActive = false;
  g.safeR = ZONE_PRESSURE.startR;
  let sawStart = false;
  let guard = 0;
  while (!sawStart && guard++ < 40) {
    g.enemies.length = 0;
    const { events } = g.step(1 / 30);
    if (events.some((e) => e.type === 'zonePressure' && e.phase === 'start')) sawStart = true;
  }
  assert.ok(sawStart, 'zonePressure start event');
  assert.equal(g.zonePressureActive, true, 'active after start');
  assert.ok(g.safeR <= ZONE_PRESSURE.startR + 0.05, 'safeR near startR at begin');

  // Advance half shrink via direct tick (avoid enemy/boss noise)
  g.t = ZONE_PRESSURE.startAfter + ZONE_PRESSURE.shrinkSec * 0.5;
  g._tickZonePressure(0, []);
  const mid = (ZONE_PRESSURE.startR + ZONE_PRESSURE.endR) / 2;
  assert.ok(Math.abs(g.safeR - mid) < 0.2, `safeR mid-shrink ≈ mid (${g.safeR} vs ${mid})`);

  // Full shrink
  g.t = ZONE_PRESSURE.startAfter + ZONE_PRESSURE.shrinkSec + 1;
  g._tickZonePressure(0, []);
  assert.ok(Math.abs(g.safeR - ZONE_PRESSURE.endR) < 0.05, 'safeR reaches endR');
}

// Outside safeR → tick damage; inside safe
{
  const g = new Game({ seed: 3 });
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g.invuln = 0;
  g.armor = 0;
  g.hp = 8;
  g.t = ZONE_PRESSURE.startAfter + ZONE_PRESSURE.shrinkSec; // fully shrunk
  g._zonePressureStarted = true;
  g.zonePressureActive = true;
  g.safeR = ZONE_PRESSURE.endR;
  g._zonePressureTickAcc = 0;
  g.px = 0; g.pz = 0; // inside
  const inside = [];
  g._tickZonePressure(ZONE_PRESSURE.tickSec * 3, inside);
  assert.equal(g.hp, 8, 'inside safe — no dmg');
  assert.ok(!inside.some((e) => e.type === 'hurt' && e.zonePressure), 'no hurt inside');

  g.px = ZONE_PRESSURE.endR + 3; g.pz = 0; // outside
  g._zonePressureTickAcc = 0;
  const hp0 = g.hp;
  const outside = [];
  g._tickZonePressure(ZONE_PRESSURE.tickSec * 2.1, outside);
  assert.ok(g.hp < hp0, 'outside takes pollution dmg');
  assert.ok(outside.some((e) => e.type === 'hurt' && e.by === 'zonePressure'), 'hurt by zonePressure');
}

// Invuln respected
{
  const g = new Game({ seed: 5 });
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g.invuln = 5;
  g.hp = 8;
  g.t = ZONE_PRESSURE.startAfter + 50;
  g._zonePressureStarted = true;
  g.zonePressureActive = true;
  g.safeR = 16;
  g._zonePressureTickAcc = 0;
  g.px = 25; g.pz = 0;
  const evs = [];
  g._tickZonePressure(ZONE_PRESSURE.tickSec * 3, evs);
  assert.equal(g.hp, 8, 'invuln blocks pollution');
}

// Skip while pausedForLevel
{
  const g = new Game({ seed: 9 });
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g.t = ZONE_PRESSURE.startAfter + 1;
  g.pausedForLevel = true;
  g.zonePressureActive = false;
  g._zonePressureStarted = false;
  const beforeR = g.safeR;
  const { events } = g.step(1 / 30);
  assert.equal(events.length, 0, 'paused step no events');
  assert.equal(g.zonePressureActive, false, 'pressure not started while paused');
  assert.equal(g.safeR, beforeR, 'safeR frozen while paused');
}

// Does not alter danger pulse / bomber configs by presence
{
  assert.equal(DANGER_PULSE.startAfter, 80);
  assert.ok(BOMBER.telegraphSec >= 0.9);
  assert.ok(ARTILLERY.telegraphSec >= 0.9);
}

console.log('zone-pressure.test.mjs OK');
