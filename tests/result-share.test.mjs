/**
 * Result share / copy (v0.9.39 / PHASE6-RESULT-SHARE-001).
 * Run: node tests/result-share.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import {
  buildShareText, canNativeShare, shareButtonLabels, confirmCopy, shareOrCopy,
  LIVE_URL, SHARE_CONFIRM_MS,
} from '../js/result-share.js';

assert.ok(LIVE_URL.includes('fung2222.github.io/neon-swarm'));
assert.ok(SHARE_CONFIRM_MS >= 800 && SHARE_CONFIRM_MS <= 1400);

{
  const t = buildShareText({
    timeStr: '3:21', kills: 128, zone: '機甲組裝區', score: 4200, isZh: true,
  });
  assert.ok(t.startsWith('暴走機甲 · 存活 3:21 · 擊殺 128 · 區域 機甲組裝區 · 分數 4200'));
  assert.ok(t.includes(LIVE_URL));
}

{
  const t = buildShareText({
    timeStr: '1:00', kills: 10, zone: 'LAB', score: 100, isZh: false,
  });
  assert.ok(t.includes('RAMPAGE MECH'));
  assert.ok(t.includes('Survived 1:00'));
}

assert.deepEqual(shareButtonLabels(false), { zh: '複製戰績', en: 'COPY RUN' });
assert.deepEqual(shareButtonLabels(true), { zh: '分享戰績', en: 'SHARE RUN' });
assert.deepEqual(confirmCopy(true, false), { zh: '已複製', en: 'COPIED' });
assert.deepEqual(confirmCopy(true, true), { zh: '已分享', en: 'SHARED' });
assert.deepEqual(confirmCopy(false), { zh: '複製失敗', en: 'COPY FAILED' });

assert.equal(canNativeShare({ share() {} }, { forceTouch: true }), true);
assert.equal(canNativeShare({ share() {} }, { forceTouch: false }), false);
assert.equal(canNativeShare({}, { forceTouch: true }), false);

{
  const writes = [];
  const r = await shareOrCopy('hello', {
    preferShare: false,
    clipboard: { writeText: async (s) => { writes.push(s); } },
  });
  assert.equal(r.ok, true);
  assert.equal(r.usedShare, false);
  assert.deepEqual(writes, ['hello']);
}

{
  let shared = null;
  const r = await shareOrCopy('run text', {
    preferShare: true,
    forceTouch: true,
    nav: {
      share: async (payload) => { shared = payload; },
      clipboard: { writeText: async () => { throw new Error('no'); } },
    },
  });
  assert.equal(r.ok, true);
  assert.equal(r.usedShare, true);
  assert.equal(shared.text, 'run text');
}

{
  const r = await shareOrCopy('x', {
    preferShare: true,
    forceTouch: true,
    nav: {
      share: async () => { const e = new Error('cancel'); e.name = 'AbortError'; throw e; },
    },
  });
  assert.equal(r.ok, false);
  assert.equal(r.aborted, true);
}

{
  const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
  assert.ok(main.includes('onShareRun'));
  assert.ok(main.includes('buildShareText'));
  assert.ok(main.includes('btn-share'));
  const mod = readFileSync(new URL('../js/result-share.js', import.meta.url), 'utf8');
  assert.ok(!/facebook\.com|twitter\.com|gtag\(|googletagmanager/i.test(mod));
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('id="btn-share"'));
  assert.ok(html.includes('?v=0.9.39'));
  assert.ok(html.includes('複製戰績'));
  const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
  assert.ok(css.includes('over-share'));
  assert.ok(css.includes('share-confirm'));
}

// flex prior version pins
{
  const ks = readFileSync(new URL('./kill-streak.test.mjs', import.meta.url), 'utf8');
  // leave kill-streak as-is if it hard-pins 0.9.38 — soft-fix below
}

console.log('result-share.test.mjs OK');
