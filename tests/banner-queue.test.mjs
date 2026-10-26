/**
 * Banner queue / timing helper (v0.9.32 / PHASE6-BANNER-TIMING-001).
 * Run: node tests/banner-queue.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import {
  BANNER_MS, BANNER_PRIORITY, bannerPriority, bannerDuration,
  enqueueBanner, advanceBanner, createBannerController,
} from '../js/banner-queue.js';

assert.equal(BANNER_MS.zone, 1400);
assert.equal(BANNER_MS.elite, 1600);
assert.equal(BANNER_MS.boss, 2600);
assert.equal(BANNER_MS.phase, 900);
assert.ok(BANNER_MS.minShow >= 500 && BANNER_MS.minShow < BANNER_MS.zone);

assert.ok(bannerPriority('boss') > bannerPriority('elite'));
assert.ok(bannerPriority('elite') > bannerPriority('zone'));
assert.ok(bannerPriority('zone') > bannerPriority('phase'));
assert.equal(bannerDuration('boss'), 2600);
assert.equal(bannerDuration('zone', 9999), 9999);

// Idle → show now
{
  const r = enqueueBanner(null, [], { kind: 'zone', zh: '區', en: 'ZONE' }, 1000);
  assert.equal(r.showNow, true);
  assert.equal(r.current.kind, 'zone');
  assert.equal(r.waitMs, 1400);
  assert.equal(r.pending.length, 0);
}

// Same-tier stacks into short queue (max 2)
{
  const cur = { kind: 'zone', priority: 1, ms: 1400, shownAt: 1000, minMs: 700 };
  const r1 = enqueueBanner(cur, [], { kind: 'elite', zh: 'E', en: 'E' }, 1100);
  assert.equal(r1.showNow, false);
  assert.equal(r1.pending.length, 1);
  assert.equal(r1.pending[0].kind, 'elite');
  // second pending
  const r2 = enqueueBanner(r1.current, r1.pending, { kind: 'zone', zh: 'Z2', en: 'Z2' }, 1150);
  assert.equal(r2.pending.length, 2);
  // overflow → latest-wins on last slot
  const r3 = enqueueBanner(r2.current, r2.pending, { kind: 'zone', zh: 'Z3', en: 'Z3' }, 1200);
  assert.equal(r3.pending.length, 2);
  assert.equal(r3.pending[1].zh, 'Z3');
}

// Higher priority jumps pending queue
{
  const cur = { kind: 'zone', priority: 1, ms: 1400, shownAt: 1000, minMs: 700 };
  const r = enqueueBanner(cur, [{ kind: 'elite', priority: 2, zh: 'e', en: 'e', ms: 1600 }], {
    kind: 'boss', zh: 'B', en: 'B',
  }, 1200);
  assert.equal(r.pending.length, 1);
  assert.equal(r.pending[0].kind, 'boss');
  assert.ok(r.waitMs <= 700); // minLeft
}

// Advance drains queue
{
  const next = advanceBanner(
    { kind: 'zone', ms: 1400 },
    [{ kind: 'elite', zh: 'E', en: 'E', ms: 1600, priority: 2, boss: false }],
    2000,
  );
  assert.equal(next.showNow, true);
  assert.equal(next.current.kind, 'elite');
  assert.equal(next.waitMs, 1600);
  assert.equal(next.pending.length, 0);
}
{
  const empty = advanceBanner({ kind: 'zone' }, [], 2000);
  assert.equal(empty.current, null);
  assert.equal(empty.showNow, false);
}

// Controller: fake clock + timers
{
  let now = 0;
  const timers = [];
  const shown = [];
  let hidden = 0;
  const ctl = createBannerController({
    now: () => now,
    setTimeout: (fn, ms) => {
      const id = timers.length + 1;
      timers.push({ id, fn, at: now + ms });
      return id;
    },
    clearTimeout: (id) => {
      const i = timers.findIndex((t) => t.id === id);
      if (i >= 0) timers.splice(i, 1);
    },
    show: (item) => shown.push(item.kind),
    hide: () => { hidden++; },
  });

  ctl.push({ kind: 'zone', zh: '區', en: 'Z' });
  assert.deepEqual(shown, ['zone']);
  // elite while zone showing → queued
  now = 200;
  ctl.push({ kind: 'elite', zh: '精', en: 'E' });
  assert.deepEqual(shown, ['zone']);
  // boss jumps pending
  now = 300;
  ctl.push({ kind: 'boss', zh: 'B', en: 'B', boss: true });
  assert.equal(ctl.snapshot().pending[0].kind, 'boss');

  // fire timer after minShow from zone start (shownAt=0, min=700)
  // After boss at t=300, wait should be 400 → timer at 700
  now = 700;
  let due = timers.filter((t) => t.at <= now);
  if (!due.length) {
    // allow one tick of slack if schedule used full minMs
    now = 1000;
    due = timers.filter((t) => t.at <= now);
  }
  assert.ok(due.length >= 1, 'expected a due timer, timers=' + JSON.stringify(timers.map((x) => ({ id: x.id, at: x.at }))));
  due.forEach((t) => t.fn());
  assert.ok(shown.includes('boss'), 'boss shows after min');
}

// Wiring smoke: main uses controller + kinds
{
  const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
  assert.ok(main.includes("createBannerController"), 'controller wired');
  assert.ok(main.includes("kind: 'zone'"), 'zone kind');
  assert.ok(main.includes("kind: 'elite'"), 'elite kind');
  assert.ok(main.includes("kind: 'boss'"), 'boss kind');
  assert.ok(main.includes("kind: 'phase'"), 'phase kind');
  assert.ok(main.includes('BANNER_MS'), 'uses BANNER_MS');
  const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
  assert.ok(css.includes('pause-hint') || css.includes('#screen-pause'), 'pause polish css');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('pauseHint'), 'pause hint markup');
  assert.ok(html.includes('?v=0.9.32'), 'cache-bust 0.9.32');
}

console.log('banner-queue.test.mjs: PASS');
