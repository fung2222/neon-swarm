/**
 * MOBILE-WEBGL-DIAG-001 (v0.9.204) — ring buffer, classify, reload cap.
 * Run: node tests/gfx-diag.test.mjs
 */
import assert from 'assert';
import {
  createGfxDiag, classifyFault, summarizeError, sanitizeUrl, looksLikeWebGlError,
  shouldAutoReloadOnRestore, bumpAutoReloadCount, clearAutoReloadCount,
  shedReasonText, GFX_DIAG_MAX, GFX_RELOAD_MAX,
} from '../js/gfx-diag.js';
import { SHED, formatInterruptNote, buildInterruptSnapshot } from '../js/webgl-guard.js';
import { readFileSync } from 'fs';

const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const diagSrc = readFileSync(new URL('../js/gfx-diag.js', import.meta.url), 'utf8');

assert.ok(main.includes('MOBILE-WEBGL-DIAG-001'), 'ship id main');
assert.ok(diagSrc.includes('MOBILE-WEBGL-DIAG-001'), 'ship id diag');
assert.ok(main.includes("showGfxRecover('boot-js'"), 'boot JS not mislabeled as GPU');
assert.ok(main.includes("showGfxRecover('boot-webgl'"), 'true WebGL boot path');
assert.ok(main.includes('shouldAutoReloadOnRestore'), 'reload cap wired');
assert.ok(main.includes('frame loop error'), 'loop try/catch');

{
  assert.equal(sanitizeUrl('https://x.test/neon-swarm/?hub=1&ret=https%3A%2F%2Fevil'), '/neon-swarm/');
  assert.ok(!sanitizeUrl('https://x.test/a?secret=1').includes('secret'));
}

{
  assert.equal(classifyFault('lost'), 'lost');
  assert.equal(classifyFault('boot-webgl'), 'boot-webgl');
  assert.equal(classifyFault('boot-js', new TypeError('x is null')), 'boot-js');
  assert.equal(classifyFault('loop-js', new Error('WebGL context lost')), 'loop-gl');
  assert.equal(classifyFault('loop-js', new TypeError('Cannot read')), 'loop-js');
  assert.ok(looksLikeWebGlError(new Error('WEBGL_lose_context')));
  assert.ok(!looksLikeWebGlError(new TypeError('undefined is not a function')));
  // Stack may mention webgl-guard.js — must NOT flip classification
  const stacked = new TypeError('plain');
  stacked.stack = 'TypeError: plain\n    at file:///x/js/webgl-guard.js:1:1';
  assert.ok(!looksLikeWebGlError(stacked));
  assert.equal(classifyFault('boot-js', stacked), 'boot-js');
  const s = summarizeError(new TypeError('boom'));
  assert.equal(s.name, 'TypeError');
  assert.ok(s.message.includes('boom'));
}

{
  let t = 1000;
  const d = createGfxDiag({ max: 5, now: () => t });
  for (let i = 0; i < 12; i++) { t += 1; d.push('evt', { n: i }); }
  assert.equal(d.events.length, 5);
  assert.equal(d.events[0].n, 7); // kept last 5: 7..11
  d.markBootOk();
  d.noteContextLost({ shed: 2 });
  d.noteShed(2, 'runT>=t2', { avgMs: 40 });
  d.noteCoolPause({ shed: 2 });
  const classified = d.noteFault('boot-js', new TypeError('fail'));
  assert.equal(classified, 'boot-js');
  assert.equal(d.flags.bootOk, true);
  assert.equal(d.flags.contextLost, true);
  const dump = d.dump();
  assert.equal(dump.v, 1);
  assert.ok(dump.n <= 5);
  assert.ok(d.summaryLine().includes('lost=1'));
}

{
  const mem = new Map();
  const storage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => { mem.set(k, String(v)); },
    removeItem: (k) => { mem.delete(k); },
  };
  const now = 2_000_000_000_000;
  assert.equal(shouldAutoReloadOnRestore(storage, now), true);
  assert.equal(bumpAutoReloadCount(storage, now), 1);
  assert.equal(bumpAutoReloadCount(storage, now + 1000), 2);
  assert.equal(shouldAutoReloadOnRestore(storage, now + 2000), false); // n=2 >= MAX
  assert.equal(GFX_RELOAD_MAX, 2);
  clearAutoReloadCount(storage);
  assert.equal(shouldAutoReloadOnRestore(storage, now + 3000), true);
}

{
  const r = shedReasonText({ mobile: true, runT: 80, avgFrameMs: 30 }, SHED);
  assert.ok(r.includes('runT>=t1'));
  assert.ok(r.includes('avg>=ms1'));
}

{
  const cool = buildInterruptSnapshot({ t: 90, score: 10, kills: 2 }, 1, 'cool-pause');
  const zh = formatInterruptNote(cool, true);
  assert.ok(zh.includes('冷卻暫停') || zh.includes('幀時間'), zh);
  const web = buildInterruptSnapshot({ t: 90, score: 10, kills: 2 }, 1, 'webgl');
  assert.ok(formatInterruptNote(web, true).includes('繪圖中斷'));
}

// Cap constant sanity
assert.ok(GFX_DIAG_MAX >= 40 && GFX_DIAG_MAX <= 200);

console.log('gfx-diag.test.mjs: PASS');
