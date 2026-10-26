/**
 * PHASE6-PERIODIC-DANGER-001 — periodic arena red danger circles.
 * Run: node tests/danger-pulse.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { DANGER_PULSE, BOMBER, ARTILLERY } from '../js/config.js';

assert.ok(DANGER_PULSE, 'DANGER_PULSE defined');
assert.ok(DANGER_PULSE.startAfter >= 75 && DANGER_PULSE.startAfter <= 90, 'startAfter ~75–90');
assert.ok(DANGER_PULSE.everySec >= 18 && DANGER_PULSE.everySec <= 24, 'everySec ~18–24');
assert.ok(DANGER_PULSE.telegraphSec >= 0.9 && DANGER_PULSE.telegraphSec <= 1.2, 'telegraph ≥0.9');
assert.ok(DANGER_PULSE.radius >= 1.5 && DANGER_PULSE.radius <= 3.5, 'radius sensible');
assert.ok(DANGER_PULSE.maxConcurrent >= 1 && DANGER_PULSE.maxConcurrent <= 2, 'maxConcurrent 1–2');
assert.ok(DANGER_PULSE.offsetMin >= 1.2, 'offsetMin keeps circle escapable / not under feet');
assert.ok(DANGER_PULSE.offsetMax > DANGER_PULSE.offsetMin, 'offsetMax > offsetMin');
// Distinct from bomber/artillery configs (complementary systems)
assert.ok(BOMBER && ARTILLERY, 'bomber/artillery still present');
assert.notEqual(DANGER_PULSE.radius, BOMBER.blastRadius, 'danger radius may differ from bomber (ok if equal — soft)');

// No spawn before startAfter
{
  const g = new Game({ seed: 11 });
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g.invuln = 99;
  const dt = 1 / 30;
  let tele = 0;
  let pulse = 0;
  while (g.t < DANGER_PULSE.startAfter - 0.05 && g.alive) {
    const { events } = g.step(dt);
    for (const ev of events) {
      if (ev.type === 'telegraph' && ev.kind === 'dangerPulse') tele++;
      if (ev.type === 'dangerPulse') pulse++;
    }
  }
  assert.equal(tele, 0, 'no dangerPulse telegraph before startAfter');
  assert.equal(pulse, 0, 'no dangerPulse before startAfter');
  assert.equal((g.dangerPulses || []).length, 0, 'no active pulses early');
}

// Telegraph ≥0.9 before damage; events; no dmg during telegraph
{
  const g = new Game({ seed: 7 });
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g.invuln = 0;
  g.hp = 8;
  g.armor = 0;
  g.px = 0; g.pz = 0;
  g.t = DANGER_PULSE.startAfter;
  g._nextDangerPulseAt = 1e9; // freeze cadence while testing single pulse
  g.dangerPulses = [];

  // Force spawn with known position under player for hit test after telegraph
  const events0 = [];
  g._spawnDangerPulse(events0);
  assert.equal(g.dangerPulses.length, 1, 'spawned one pulse');
  const teleEv = events0.find((e) => e.type === 'telegraph' && e.kind === 'dangerPulse');
  assert.ok(teleEv, 'telegraph kind:dangerPulse');
  assert.ok((teleEv.duration || 0) >= 0.9, 'telegraph duration ≥0.9');
  assert.ok(teleEv.radius >= 1.5, 'telegraph carries radius');

  const p = g.dangerPulses[0];
  // Place pulse under player so detonation will hit
  p.x = 0; p.z = 0;
  assert.equal(p.phase, 'telegraph');
  assert.ok(p.phaseT >= 0.9, 'phaseT ≥0.9 at start');

  const hp0 = g.hp;
  // Advance almost full telegraph without completing
  const almost = Math.max(0.05, p.phaseT - 0.05);
  const mid = [];
  g._tickDangerPulses(almost, mid);
  assert.equal(p.phase, 'telegraph', 'still telegraphing');
  assert.equal(g.hp, hp0, 'no damage during telegraph');
  assert.ok(!mid.some((e) => e.type === 'dangerPulse'), 'no pulse event mid-telegraph');

  // Finish telegraph
  const fin = [];
  g._tickDangerPulses(0.2, fin);
  const pulseEv = fin.find((e) => e.type === 'dangerPulse');
  assert.ok(pulseEv, 'dangerPulse event after telegraph');
  assert.ok(pulseEv.radius >= 1.5, 'pulse carries radius');
  assert.equal(g.dangerPulses.length, 0, 'pulse removed after detonate');
  assert.ok(g.hp < hp0, 'player hurt if inside after telegraph');
}

// Invuln respected on pulse
{
  const g = new Game({ seed: 3 });
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g.invuln = 5;
  g.hp = 8;
  g.px = 0; g.pz = 0;
  g.dangerPulses = [{
    id: 99, x: 0, z: 0, radius: DANGER_PULSE.radius,
    phase: 'telegraph', phaseT: 0.01, telegraphDur: 1, telegraphAt: g.t,
  }];
  const evs = [];
  g._tickDangerPulses(0.05, evs);
  const pulseEv = evs.find((e) => e.type === 'dangerPulse');
  assert.ok(pulseEv, 'pulse fired');
  assert.equal(g.hp, 8, 'invuln blocks damage');
  assert.ok(pulseEv.hit === true, 'hit flag still true when inside (blocked by invuln)');
}

// Skip cadence while pausedForLevel (step returns early)
{
  const g = new Game({ seed: 5 });
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g.t = DANGER_PULSE.startAfter + 1;
  g._nextDangerPulseAt = DANGER_PULSE.startAfter;
  g.dangerPulses = [];
  g.pausedForLevel = true;
  const before = g._nextDangerPulseAt;
  const { events } = g.step(1 / 30);
  assert.equal(events.length, 0, 'paused step yields no events');
  assert.equal(g.dangerPulses.length, 0, 'no pulse while paused');
  assert.equal(g._nextDangerPulseAt, before, 'cadence clock not advanced while paused');
}

// Max concurrent respected
{
  const g = new Game({ seed: 9 });
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g.invuln = 99;
  g.px = 0; g.pz = 0;
  g.t = DANGER_PULSE.startAfter + 100;
  g._nextDangerPulseAt = DANGER_PULSE.startAfter;
  g.dangerPulses = [];
  const evs = [];
  // One tick that would otherwise schedule many overdue pulses
  g._tickDangerPulses(0.05, evs);
  assert.ok(g.dangerPulses.length <= DANGER_PULSE.maxConcurrent, 'maxConcurrent cap');
  assert.ok(g.dangerPulses.length >= 1, 'at least one after overdue');
  const teles = evs.filter((e) => e.type === 'telegraph' && e.kind === 'dangerPulse');
  assert.ok(teles.length <= DANGER_PULSE.maxConcurrent, 'telegraph events capped');
}

// Offset not always under feet
{
  const g = new Game({ seed: 42 });
  g.px = 0; g.pz = 0;
  const dists = [];
  for (let i = 0; i < 24; i++) {
    const evs = [];
    g.dangerPulses = [];
    g._spawnDangerPulse(evs);
    const p = g.dangerPulses[0];
    dists.push(Math.hypot(p.x - g.px, p.z - g.pz));
  }
  const underFeet = dists.filter((d) => d < 0.5).length;
  assert.ok(underFeet === 0, 'never dead-center under feet');
  assert.ok(dists.every((d) => d >= DANGER_PULSE.offsetMin * 0.85), 'offset roughly ≥ offsetMin');
  const spread = Math.max(...dists) - Math.min(...dists);
  assert.ok(spread > 0.5, 'offsets have some spread');
}

// Cadence via step after startAfter
{
  const g = new Game({ seed: 13 });
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g.invuln = 99;
  g.hp = 8;
  // Jump just before start
  const dt = 1 / 30;
  while (g.t < DANGER_PULSE.startAfter - 0.5) g.step(0.5);
  let sawTele = false;
  let guard = 0;
  while (!sawTele && guard++ < 200) {
    const { events } = g.step(dt);
    if (events.some((e) => e.type === 'telegraph' && e.kind === 'dangerPulse')) sawTele = true;
  }
  assert.ok(sawTele, 'telegraph appears after startAfter via step');
}

console.log('danger-pulse.test.mjs OK');
