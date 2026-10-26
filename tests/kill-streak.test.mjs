/**
 * Soft kill-streak (v0.9.38 / PHASE6-KILL-STREAK-LITE-001).
 * Run: node tests/kill-streak.test.mjs
 * Honesty: feedback only — no DPS/XP economy in this module.
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import {
  createStreakState, resetStreak, noteStreakKill, noteStreakBreak,
  streakCopy, STREAK_WINDOW_MS, STREAK_TOAST_MS, STREAK_MILESTONES, STREAK_KICK_AT,
} from '../js/kill-streak.js';

assert.ok(STREAK_WINDOW_MS >= 2000 && STREAK_WINDOW_MS <= 2500);
assert.ok(STREAK_TOAST_MS >= 800 && STREAK_TOAST_MS <= 1200);
assert.deepEqual([...STREAK_MILESTONES], [5, 10, 15]);
assert.equal(STREAK_KICK_AT, 10);

{
  const s = createStreakState();
  let t = 1000;
  for (let i = 1; i <= 4; i++) {
    assert.equal(noteStreakKill(s, t + i * 100), null);
  }
  assert.equal(s.count, 4);
  const m5 = noteStreakKill(s, t + 500);
  assert.ok(m5);
  assert.equal(m5.milestone, 5);
  assert.equal(m5.zh, '連殺 ×5');
  assert.equal(m5.en, 'STREAK ×5');
  assert.equal(m5.kick, false);
  assert.equal(noteStreakKill(s, t + 600), null); // 6 — no milestone
}

{
  const s = createStreakState();
  let t = 0;
  for (let i = 0; i < 9; i++) noteStreakKill(s, t + i * 50, { toastBusy: false });
  const m10 = noteStreakKill(s, t + 500);
  assert.equal(m10.milestone, 10);
  assert.equal(m10.kick, true);
  assert.equal(m10.zh, '連殺 ×10');
}

{
  // Window timeout resets segment
  const s = createStreakState();
  for (let i = 0; i < 4; i++) noteStreakKill(s, 1000 + i * 100);
  assert.equal(s.count, 4);
  noteStreakKill(s, 1000 + 4 * 100 + STREAK_WINDOW_MS + 1);
  assert.equal(s.count, 1, 'timeout starts fresh at 1');
}

{
  // Hurt / break
  const s = createStreakState();
  for (let i = 0; i < 5; i++) noteStreakKill(s, i * 100);
  assert.equal(s.count, 5);
  noteStreakBreak(s);
  assert.equal(s.count, 0);
}

{
  // Skip while toast busy; catch-up on next free kill
  const s = createStreakState();
  for (let i = 0; i < 4; i++) noteStreakKill(s, i * 80);
  assert.equal(noteStreakKill(s, 400, { toastBusy: true }), null);
  assert.equal(s.count, 5);
  assert.ok(!s.toasted[5], 'not consumed while busy');
  const caught = noteStreakKill(s, 500, { toastBusy: false });
  assert.ok(caught);
  assert.equal(caught.milestone, 5);
  assert.equal(s.count, 6);
}

{
  assert.deepEqual(streakCopy(15), { zh: '連殺 ×15', en: 'STREAK ×15' });
  const s = createStreakState();
  for (let i = 0; i < 14; i++) noteStreakKill(s, i * 40);
  const m15 = noteStreakKill(s, 600);
  assert.equal(m15.milestone, 15);
  // 5 and 10 also marked toasted in catch-up path when jumping... wait we toast each at exact hit
}

{
  const s = resetStreak(createStreakState());
  assert.equal(s.count, 0);
}

// Wiring + honesty + version
{
  const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
  assert.ok(main.includes('noteStreakKill'), 'wired kill');
  assert.ok(main.includes('noteStreakBreak'), 'wired hurt/break');
  assert.ok(main.includes("kind === 'streak'") || main.includes("kind-streak") || main.includes("'streak'"), 'toast kind');
  // No economy hooks from streak module usage
  const mod = readFileSync(new URL('../js/kill-streak.js', import.meta.url), 'utf8');
  assert.ok(/feedback ONLY|Feedback ONLY|no DPS/i.test(mod));
  assert.ok(!/\b(dmg|damage|xp|score)\s*[+*]=/.test(mod), 'no economy mutation');
  assert.ok(!/return\s*\{[^}]*bonus/i.test(mod));
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(/\?v=0\.9\.\d+/.test(html));
  const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
  assert.ok(css.includes('kind-streak'));
}

console.log('kill-streak.test.mjs OK');
