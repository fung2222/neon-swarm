/**
 * Early-run feedback (v0.9.37 / PHASE6-EARLY-FEEDBACK-001).
 * Run: node tests/early-feedback.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import {
  createEarlyFeedbackState, resetEarlyFeedback,
  noteFirstKill, noteFirstLevel, noteFirstHeal, takePendingEarly,
  FIRST_KILL_MS, FIRST_LEVEL_MS, FIRST_HEAL_MS, EARLY_COPY,
} from '../js/early-feedback.js';

{
  const s = createEarlyFeedbackState();
  assert.equal(s.firstKillDone, false);
  const a = noteFirstKill(s, { coachVisible: false });
  assert.ok(a);
  assert.equal(a.show, true);
  assert.equal(a.defer, false);
  assert.equal(a.zh, '首殺');
  assert.equal(a.en, 'FIRST BLOOD');
  assert.ok(a.ms >= 1000 && a.ms <= 1400);
  assert.equal(noteFirstKill(s), null, 'once only');
}

{
  const s = createEarlyFeedbackState();
  const a = noteFirstKill(s, { coachVisible: true });
  assert.equal(a.show, false);
  assert.equal(a.defer, true);
  assert.ok(s.pending);
  const p = takePendingEarly(s);
  assert.equal(p.zh, EARLY_COPY.firstKill.zh);
  assert.equal(s.pending, null);
  assert.equal(takePendingEarly(s), null);
}

{
  const s = createEarlyFeedbackState();
  assert.equal(noteFirstLevel(s, { from: 'pickup' }), null);
  assert.equal(noteFirstLevel(s, { from: 'elite' }), null);
  assert.equal(noteFirstLevel(s, { from: 'boss' }), null);
  const a = noteFirstLevel(s, { from: 'level' });
  assert.ok(a);
  assert.equal(a.zh, '升級');
  assert.equal(noteFirstLevel(s, { from: 'level' }), null);
}

{
  const s = createEarlyFeedbackState();
  assert.equal(noteFirstHeal(s, { coachVisible: true }), null);
  assert.equal(s.firstHealDone, false);
  assert.equal(noteFirstHeal(s, { toastBusy: true }), null);
  const a = noteFirstHeal(s, {});
  assert.ok(a);
  assert.equal(a.zh, '修復');
  assert.equal(noteFirstHeal(s, {}), null);
}

{
  const s = createEarlyFeedbackState();
  noteFirstKill(s, { coachVisible: true });
  // pending blocks heal
  assert.equal(noteFirstHeal(s, {}), null);
  takePendingEarly(s);
  assert.ok(noteFirstHeal(s, {}));
}

{
  const s = createEarlyFeedbackState();
  noteFirstKill(s);
  noteFirstLevel(s, { from: 'level' });
  resetEarlyFeedback(s);
  assert.equal(s.firstKillDone, false);
  assert.equal(s.firstLevelDone, false);
  assert.ok(noteFirstKill(s));
}

assert.ok(FIRST_KILL_MS >= 1000 && FIRST_KILL_MS <= 1400);
assert.ok(FIRST_LEVEL_MS >= 700 && FIRST_LEVEL_MS <= 1200);
assert.ok(FIRST_HEAL_MS >= 800 && FIRST_HEAL_MS <= 1400);

{
  const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
  assert.ok(main.includes('noteFirstKill'), 'kill wired');
  assert.ok(main.includes('noteFirstLevel'), 'level wired');
  assert.ok(main.includes('noteFirstHeal'), 'heal wired');
  assert.ok(main.includes('flushPendingEarlyToast'), 'coach defer flush');
  assert.ok(main.includes('showEarlyToast'), 'toast helper');
  assert.ok(main.includes('applyFirstLevelJuice'), 'level juice');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('id="early-toast"'));
  assert.ok(html.includes('?v=0.9.37'));
  const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
  assert.ok(css.includes('.early-toast'));
  assert.ok(css.includes('xp-first-level'));
  assert.ok(css.includes('pointer-events: none'));
}

console.log('early-feedback.test.mjs OK');
