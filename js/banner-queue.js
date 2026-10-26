/**
 * Beat-banner queue (v0.9.32 / PHASE6-BANNER-TIMING-001).
 *
 * Policy: short priority queue (max 2 pending) + minimum display time.
 * - Priority: boss (3) > elite (2) > zone (1) > phase (0)
 * - A showing banner is never cut shorter than minMs.
 * - Higher-priority arrivals replace a lower-priority *pending* item;
 *   after minMs they become current when the timer fires (or immediately if idle).
 * - Same/lower priority: enqueue if room, else replace the last pending (latest-wins for that tier).
 * - No unreadable flicker from clearTimeout-and-overwrite races.
 */

export const BANNER_PRIORITY = Object.freeze({
  boss: 3,
  elite: 2,
  zone: 1,
  phase: 0,
  default: 1,
});

/** Default display durations (ms). */
export const BANNER_MS = Object.freeze({
  zone: 1400,
  elite: 1600,
  boss: 2600,
  phase: 900,
  default: 1500,
  minShow: 700,
});

export function bannerPriority(kind) {
  if (kind && BANNER_PRIORITY[kind] != null) return BANNER_PRIORITY[kind];
  return BANNER_PRIORITY.default;
}

export function bannerDuration(kind, overrideMs) {
  if (overrideMs != null && Number.isFinite(overrideMs)) return Math.max(0, overrideMs | 0);
  if (kind && BANNER_MS[kind] != null) return BANNER_MS[kind];
  return BANNER_MS.default;
}

/**
 * Pure enqueue decision — no timers.
 * @param {object|null} current — currently showing { kind, priority, ms, minMs, shownAt }
 * @param {object[]} pending — queued items (mutated copy returned)
 * @param {object} next — { kind, zh, en, ms, boss, priority? }
 * @param {number} now — ms timestamp
 * @returns {{ current, pending, showNow: boolean, waitMs: number }}
 */
export function enqueueBanner(current, pending, next, now = Date.now()) {
  const item = {
    kind: next.kind || 'default',
    zh: next.zh || '',
    en: next.en || '',
    boss: !!next.boss,
    ms: bannerDuration(next.kind, next.ms),
    priority: next.priority != null ? next.priority : bannerPriority(next.kind),
  };
  const minMs = BANNER_MS.minShow;
  const q = Array.isArray(pending) ? pending.slice(0, 2) : [];

  if (!current) {
    return { current: { ...item, shownAt: now, minMs }, pending: q, showNow: true, waitMs: item.ms };
  }

  const shownFor = Math.max(0, now - (current.shownAt != null ? current.shownAt : now));
  const minLeft = Math.max(0, (current.minMs != null ? current.minMs : minMs) - shownFor);

  // Higher priority than current → become next (replace any pending), wait out min display
  if (item.priority > current.priority) {
    return {
      current,
      pending: [item], // jump queue
      showNow: false,
      waitMs: minLeft,
    };
  }

  // Same/lower: enqueue (max 2); latest-wins on overflow
  if (q.length < 2) q.push(item);
  else q[q.length - 1] = item;

  const remain = Math.max(0, (current.ms || 0) - shownFor);
  return { current, pending: q, showNow: false, waitMs: remain };
}

/**
 * Advance after current display ends (or min satisfied for preemption).
 * @returns {{ current, pending, showNow: boolean, waitMs: number }}
 */
export function advanceBanner(current, pending, now = Date.now()) {
  const q = Array.isArray(pending) ? pending.slice() : [];
  if (!q.length) {
    return { current: null, pending: [], showNow: false, waitMs: 0 };
  }
  const next = q.shift();
  return {
    current: { ...next, shownAt: now, minMs: BANNER_MS.minShow },
    pending: q,
    showNow: true,
    waitMs: next.ms,
  };
}

export function createBannerController(opts = {}) {
  const minMs = opts.minMs != null ? opts.minMs : BANNER_MS.minShow;
  let current = null;
  let pending = [];
  let timer = 0;
  const show = typeof opts.show === 'function' ? opts.show : () => {};
  const hide = typeof opts.hide === 'function' ? opts.hide : () => {};
  const nowFn = typeof opts.now === 'function' ? opts.now : () => Date.now();
  const setT = typeof opts.setTimeout === 'function' ? opts.setTimeout : setTimeout;
  const clearT = typeof opts.clearTimeout === 'function' ? opts.clearTimeout : clearTimeout;

  function clearTimer() {
    if (timer) clearT(timer);
    timer = 0;
  }

  function paint(item) {
    show(item);
  }

  function schedule(waitMs) {
    clearTimer();
    const w = Math.max(0, waitMs | 0);
    timer = setT(() => {
      timer = 0;
      const now = nowFn();
      // If something is pending, advance; else hide
      if (pending.length) {
        const next = advanceBanner(current, pending, now);
        current = next.current;
        pending = next.pending;
        if (current) {
          paint(current);
          schedule(current.ms);
        } else {
          hide();
        }
      } else {
        current = null;
        hide();
      }
    }, w);
  }

  function push(next) {
    const now = nowFn();
    const enriched = {
      ...next,
      ms: bannerDuration(next.kind, next.ms),
      priority: next.priority != null ? next.priority : bannerPriority(next.kind),
    };
    // Attach controller minMs onto current path via enqueue
    const state = enqueueBanner(
      current ? { ...current, minMs: current.minMs != null ? current.minMs : minMs } : null,
      pending,
      enriched,
      now,
    );
    pending = state.pending;
    if (state.showNow) {
      current = state.current;
      paint(current);
      schedule(state.waitMs);
    } else if (current) {
      // Re-arm timer: either remaining display or minLeft before high-prio takeover
      const shownFor = Math.max(0, now - (current.shownAt != null ? current.shownAt : now));
      let wait;
      if (pending.length && pending[0].priority > current.priority) {
        wait = Math.max(0, (current.minMs != null ? current.minMs : minMs) - shownFor);
      } else {
        wait = Math.max(0, (current.ms || 0) - shownFor);
      }
      schedule(wait);
    }
    return { current, pending: pending.slice() };
  }

  function reset() {
    clearTimer();
    current = null;
    pending = [];
    hide();
  }

  function snapshot() {
    return { current, pending: pending.slice() };
  }

  return { push, reset, snapshot, BANNER_MS, BANNER_PRIORITY };
}
