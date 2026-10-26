/**
 * Soft kill-streak feedback (v0.9.38 / PHASE6-KILL-STREAK-LITE-001).
 * Feedback ONLY — no DPS / XP / score multiplier from streak.
 * Milestones toast via #early-toast; skips while first-kill (or any) toast busy.
 */

export const STREAK_WINDOW_MS = 2200;
export const STREAK_TOAST_MS = 1000;
export const STREAK_MILESTONES = Object.freeze([5, 10, 15]);
/** Tiny kickFx only at this count and above. */
export const STREAK_KICK_AT = 10;

export function createStreakState() {
  return {
    count: 0,
    lastKillAt: 0,
    /** Milestones already toasted in the current unbroken streak segment. */
    toasted: Object.create(null),
  };
}

export function resetStreak(state) {
  if (!state) return createStreakState();
  state.count = 0;
  state.lastKillAt = 0;
  state.toasted = Object.create(null);
  return state;
}

export function streakCopy(n) {
  return { zh: `連殺 ×${n}`, en: `STREAK ×${n}` };
}

/**
 * @param {object} state
 * @param {number} nowMs performance.now() / Date.now()
 * @param {{ toastBusy?: boolean, windowMs?: number }} opts
 * @returns {{ show: boolean, count: number, zh: string, en: string, ms: number, kick: boolean, milestone: number }|null}
 *   null = no toast (still may have updated count); always mutates state.count.
 */
export function noteStreakKill(state, nowMs, opts = {}) {
  if (!state) return null;
  const windowMs = opts.windowMs ?? STREAK_WINDOW_MS;
  const now = Number(nowMs) || 0;

  if (state.count > 0 && state.lastKillAt > 0 && now - state.lastKillAt > windowMs) {
    // Gap too long — start a fresh segment on this kill.
    state.count = 0;
    state.toasted = Object.create(null);
  }

  state.count += 1;
  state.lastKillAt = now;

  const n = state.count;
  // Highest untasted milestone at or below current count (catch-up if toast was busy).
  const due = STREAK_MILESTONES.filter((m) => n >= m && !state.toasted[m]);
  if (!due.length) return null;

  // Don't fight first-kill / other early toast still on screen — leave untasted for later kill.
  if (opts.toastBusy) return null;

  const milestone = due[due.length - 1];
  for (const m of due) state.toasted[m] = true;
  const copy = streakCopy(milestone);
  return {
    show: true,
    count: n,
    milestone,
    zh: copy.zh,
    en: copy.en,
    ms: STREAK_TOAST_MS,
    kick: milestone >= STREAK_KICK_AT,
  };
}

/** Player hurt or death — break the streak. */
export function noteStreakBreak(state) {
  return resetStreak(state);
}
