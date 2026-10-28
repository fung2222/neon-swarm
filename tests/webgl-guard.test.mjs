/**
 * PHONE-STABLE-CONTEXT-001 (v0.9.51) + PHONE-GPU-DEEPEN-001 (v0.9.126) — shed 0–3 + snapshot.
 * Run: node tests/webgl-guard.test.mjs
 */
import assert from 'assert';
import {
  detectMobileGfx, computeShedLevel, pixelRatioForShed, bloomStrengthForShed,
  shouldSkipParticleTick, shouldCoolPause,
  buildInterruptSnapshot, writeInterruptSnapshot, readInterruptSnapshot,
  clearInterruptSnapshot, formatInterruptNote, SHED, WEBGL_INTERRUPT_KEY,
  shouldSkipPostFx, shouldSkipFeelRing,
} from '../js/webgl-guard.js';

{
  assert.equal(detectMobileGfx({ coarse: true }), true);
  assert.equal(detectMobileGfx({ touchPoints: 5, minScreen: 390 }), true);
  assert.equal(detectMobileGfx({ ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)' }), true);
  assert.equal(detectMobileGfx({ coarse: false, touchPoints: 0, minScreen: 1440, ua: 'Desktop' }), false);
}

{
  assert.equal(computeShedLevel({ mobile: false, runT: 999, avgFrameMs: 99 }), 0);
  assert.equal(computeShedLevel({ mobile: true, runT: 0, avgFrameMs: 16 }), 0);
  assert.equal(computeShedLevel({ mobile: true, runT: SHED.t1, avgFrameMs: 16 }), 1);
  assert.equal(computeShedLevel({ mobile: true, runT: 10, avgFrameMs: SHED.frameMs1 }), 1);
  assert.equal(computeShedLevel({ mobile: true, runT: SHED.t2, avgFrameMs: 16 }), 2);
  assert.equal(computeShedLevel({ mobile: true, runT: 10, avgFrameMs: SHED.frameMs2 }), 2);
  assert.equal(computeShedLevel({ mobile: true, runT: SHED.t3, avgFrameMs: 16 }), 3);
  assert.equal(computeShedLevel({ mobile: true, runT: 10, avgFrameMs: SHED.frameMs3 }), 3);
  // Monotonic — never drop during run
  assert.equal(computeShedLevel({ mobile: true, runT: 0, avgFrameMs: 16, prevLevel: 2 }), 2);
  assert.equal(computeShedLevel({ mobile: true, runT: 0, avgFrameMs: 16, prevLevel: 3 }), 3);
}

{
  assert.equal(pixelRatioForShed(0, 1), 1);
  assert.equal(pixelRatioForShed(1, 1), 0.90);
  assert.equal(pixelRatioForShed(2, 1), 0.80);
  assert.equal(pixelRatioForShed(3, 1), 0.72);
  assert.equal(pixelRatioForShed(2, 0.9), 0.80);
  assert.equal(bloomStrengthForShed(0, 0.15), 0.15);
  assert.equal(bloomStrengthForShed(1, 0.15), 0.08);
  assert.equal(bloomStrengthForShed(2, 0.15), 0.04);
  assert.equal(bloomStrengthForShed(3, 0.15), 0.02);
}

{
  assert.equal(shouldSkipParticleTick(0, 1), false);
  assert.equal(shouldSkipParticleTick(1, 1), false);
  assert.equal(shouldSkipParticleTick(2, 0), false);
  assert.equal(shouldSkipParticleTick(2, 1), true);
  assert.equal(shouldSkipParticleTick(2, 3), true);
  assert.equal(shouldSkipParticleTick(3, 0), false);
  assert.equal(shouldSkipParticleTick(3, 1), true);
  assert.equal(shouldSkipParticleTick(3, 2), true);
  assert.equal(shouldSkipPostFx(2, 1), true);
  assert.equal(shouldSkipFeelRing(2), true);
  assert.equal(shouldSkipFeelRing(1), false);
}

{
  assert.equal(shouldCoolPause({ shedLevel: 2, hotStreak: SHED.hotSamples, state: 'play' }), true);
  assert.equal(shouldCoolPause({ shedLevel: 2, hotStreak: SHED.hotSamples - 1, state: 'play' }), false);
  assert.equal(shouldCoolPause({ shedLevel: 3, hotStreak: SHED.hotSamples - 1, state: 'play' }), true);
  assert.equal(shouldCoolPause({ shedLevel: 1, hotStreak: 99, state: 'play' }), false);
  assert.equal(shouldCoolPause({ shedLevel: 2, hotStreak: 99, state: 'pause' }), false);
  assert.equal(shouldCoolPause({ shedLevel: 2, hotStreak: 99, state: 'menu' }), false);
}

{
  const mem = new Map();
  const storage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => { mem.set(k, String(v)); },
    removeItem: (k) => { mem.delete(k); },
  };
  const now = 1_700_000_000_000;
  const snap = buildInterruptSnapshot({ t: 125.7, score: 4321.9, kills: 88, mapZone: 'reactor' }, now);
  assert.ok(snap);
  assert.equal(snap.t, 125);
  assert.equal(snap.score, 4321);
  assert.equal(snap.kills, 88);
  assert.equal(snap.zone, 'reactor');
  assert.equal(snap.reason, 'webgl');
  assert.equal(buildInterruptSnapshot(null), null);

  assert.equal(writeInterruptSnapshot(storage, snap), true);
  assert.ok(mem.get(WEBGL_INTERRUPT_KEY));

  const got = readInterruptSnapshot(storage, now + 1000);
  assert.ok(got);
  assert.equal(got.score, 4321);
  assert.equal(got.t, 125);

  // Expired
  assert.equal(readInterruptSnapshot(storage, now + 31 * 60 * 1000), null);

  clearInterruptSnapshot(storage);
  assert.equal(readInterruptSnapshot(storage, now), null);
}

{
  const snap = { t: 65, score: 900, kills: 12, zone: 'lab' };
  const zh = formatInterruptNote(snap, true);
  const en = formatInterruptNote(snap, false);
  assert.ok(zh.includes('1:05'));
  assert.ok(zh.includes('900'));
  assert.ok(zh.includes('12'));
  assert.ok(zh.includes('繪圖中斷'));
  assert.ok(en.includes('1:05'));
  assert.ok(en.includes('graphics interrupt'));
  assert.equal(formatInterruptNote(null), '');
}

console.log('webgl-guard.test.mjs: PASS');
