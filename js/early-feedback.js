/**
 * Early-run feel juice (v0.9.37 / PHASE6-EARLY-FEEDBACK-001).
 * Once-per-run first kill / first level-up / optional first heal.
 * No DPS / balance / card-pool changes.
 */

export const FIRST_KILL_MS = 1200;
export const FIRST_LEVEL_MS = 900;
export const FIRST_HEAL_MS = 1000;
/** Don't fire first-kill toast while coach is up; flush after. */
export const COACH_DEFER_POLL_MS = 180;

export const EARLY_COPY = Object.freeze({
  firstKill: { zh: '首殺', en: 'FIRST BLOOD' },
  firstLevel: { zh: '升級', en: 'LEVEL UP' },
  firstHeal: { zh: '修復', en: 'REPAIR' },
});

export function createEarlyFeedbackState() {
  return {
    firstKillDone: false,
    firstLevelDone: false,
    firstHealDone: false,
    pending: null, // { kind, zh, en, ms }
  };
}

export function resetEarlyFeedback(state) {
  if (!state) return createEarlyFeedbackState();
  state.firstKillDone = false;
  state.firstLevelDone = false;
  state.firstHealDone = false;
  state.pending = null;
  return state;
}

/**
 * @param {object} state
 * @param {{ coachVisible?: boolean }} opts
 * @returns {{ show: boolean, defer: boolean, kind: string, zh: string, en: string, ms: number }|null}
 */
export function noteFirstKill(state, opts = {}) {
  if (!state || state.firstKillDone) return null;
  state.firstKillDone = true;
  const copy = EARLY_COPY.firstKill;
  const payload = {
    show: !opts.coachVisible,
    defer: !!opts.coachVisible,
    kind: 'firstKill',
    zh: copy.zh,
    en: copy.en,
    ms: FIRST_KILL_MS,
  };
  if (payload.defer) state.pending = { kind: payload.kind, zh: payload.zh, en: payload.en, ms: payload.ms };
  return payload;
}

/**
 * First XP level-up only (not pickup / elite / boss card opens).
 * @param {object} state
 * @param {{ from?: string }} opts
 */
export function noteFirstLevel(state, opts = {}) {
  if (!state || state.firstLevelDone) return null;
  const from = opts.from || 'level';
  if (from !== 'level') return null;
  state.firstLevelDone = true;
  const copy = EARLY_COPY.firstLevel;
  return {
    show: true,
    defer: false,
    kind: 'firstLevel',
    zh: copy.zh,
    en: copy.en,
    ms: FIRST_LEVEL_MS,
  };
}

/**
 * Soft first heal — skip if coach up or another early toast pending.
 * @param {object} state
 * @param {{ coachVisible?: boolean, toastBusy?: boolean }} opts
 */
export function noteFirstHeal(state, opts = {}) {
  if (!state || state.firstHealDone) return null;
  if (opts.coachVisible || opts.toastBusy || state.pending) return null;
  state.firstHealDone = true;
  const copy = EARLY_COPY.firstHeal;
  return {
    show: true,
    defer: false,
    kind: 'firstHeal',
    zh: copy.zh,
    en: copy.en,
    ms: FIRST_HEAL_MS,
  };
}

/** Flush deferred toast after coach dismiss (once). */
export function takePendingEarly(state) {
  if (!state || !state.pending) return null;
  const p = state.pending;
  state.pending = null;
  return p;
}
