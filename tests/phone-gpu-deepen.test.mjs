/**
 * PHONE-GPU-DEEPEN-001 (v0.9.126) — mid-run shed 0–3, cool-pause, contextlost snapshot.
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import {
  SHED, computeShedLevel, pixelRatioForShed, bloomStrengthForShed,
  shouldSkipParticleTick, shouldSkipPostFx, shouldSkipFeelRing, shouldCoolPause,
  buildInterruptSnapshot,
} from '../js/webgl-guard.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const guard = readFileSync(new URL('../js/webgl-guard.js', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.(12[6-9]|1[3-9]\d)/.test(html), 'cache-bust ≥0.9.126');
assert.ok(guard.includes('PHONE-GPU-DEEPEN-001'), 'ship id guard');
assert.ok(main.includes('PHONE-GPU-DEEPEN-001'), 'ship id main');
assert.ok(main.includes('shouldSkipPostFx'), 'main wires post skip');
assert.ok(main.includes("'cool-pause'"), 'cool-pause snapshot');

assert.equal(SHED.t1, 75);
assert.equal(SHED.t2, 150);
assert.equal(SHED.t3, 240);
assert.equal(SHED.hotSamples, 5);
assert.equal(computeShedLevel({ mobile: true, runT: 240, avgFrameMs: 16 }), 3);
assert.equal(pixelRatioForShed(3, 1), 0.72);
assert.equal(bloomStrengthForShed(3, 0.15), 0.02);
assert.equal(shouldSkipParticleTick(3, 1), true);
assert.equal(shouldSkipPostFx(2, 1), true);
assert.equal(shouldSkipFeelRing(2), true);
assert.equal(shouldCoolPause({ shedLevel: 3, hotStreak: 4, state: 'play' }), true);

const snap = buildInterruptSnapshot({ t: 90, score: 100, kills: 5, mapZone: 'lab' }, 1, 'cool-pause');
assert.equal(snap.reason, 'cool-pause');

// Ship id present; deepen helpers exported
assert.ok(typeof shouldSkipFeelRing === 'function');

console.log('phone-gpu-deepen.test.mjs: PASS', { t1: SHED.t1, t3: SHED.t3, hot: SHED.hotSamples });
