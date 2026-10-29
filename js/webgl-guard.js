/**
 * PHONE-STABLE-CONTEXT-001 (v0.9.51) + PHONE-GPU-DEEPEN-001 (v0.9.126)
 * Mid-run WebGL context-loss prevention + recovery helpers.
 * Pure / storage-injectable — unit-testable without DOM/WebGL.
 *
 * Prevention: escalate MOBILE_GFX shed level from run time + frame budget
 *   (lower PR, bloom, particle/post tick rate; shed 0–3) before the GPU dies.
 * Recovery: stash a tiny interrupt snapshot on contextlost / cool-pause so
 *   reload overlay can show last score/time (Three.js soft-restore still
 *   inadequate — reload). Desktop path: shed stays 0.
 */

/** sessionStorage key for last mid-run graphics interrupt. */
export const WEBGL_INTERRUPT_KEY = 'neon-swarm-webgl-interrupt-v1';

/** Max age for showing an interrupt note after reload (30 min). */
export const INTERRUPT_MAX_AGE_MS = 30 * 60 * 1000;

/**
 * Shed thresholds — tune for phone thermal / mid-run pressure only.
 * Level never decreases during a single run (caller keeps max).
 */
export const SHED = Object.freeze({
  /** run seconds → at least level 1 (earlier than v0.9.51) */
  t1: 75,
  /** run seconds → at least level 2 */
  t2: 150,
  /** run seconds → at least level 3 (deep shed) */
  t3: 240,
  /** rolling avg frame ms → level 1 */
  frameMs1: 26,
  /** rolling avg frame ms → level 2 */
  frameMs2: 36,
  /** rolling avg frame ms → level 3 */
  frameMs3: 48,
  /** rolling avg frame ms counts as "hot" toward cool-pause */
  frameMsHot: 50,
  /** consecutive hot samples (~0.5s each in main) before cool-pause */
  hotSamples: 5,
});

/**
 * Mobile / coarse GPU path detection (mirrors main.js MOBILE_GFX; pure).
 * @param {{ coarse?: boolean, touchPoints?: number, minScreen?: number, ua?: string }} env
 */
export function detectMobileGfx(env = {}) {
  const coarse = !!env.coarse;
  const touch = (env.touchPoints || 0) > 0;
  const narrow = (env.minScreen == null ? 9999 : env.minScreen) <= 820;
  const ua = /Android|iPhone|iPad|iPod|Mobile/i.test(env.ua || '');
  return !!(coarse || (touch && narrow) || ua);
}

/**
 * Next shed level from inputs. Monotonic vs prevLevel.
 * Level 0 = baseline MOBILE_GFX cuts only; 1–3 = further mid-run shed.
 * Non-mobile always returns 0.
 * @param {{ mobile: boolean, runT?: number, avgFrameMs?: number, prevLevel?: number }} o
 */
export function computeShedLevel(o) {
  if (!o || !o.mobile) return 0;
  const runT = o.runT || 0;
  const avg = o.avgFrameMs || 0;
  let level = 0;
  if (runT >= SHED.t1 || avg >= SHED.frameMs1) level = 1;
  if (runT >= SHED.t2 || avg >= SHED.frameMs2) level = 2;
  if (runT >= SHED.t3 || avg >= SHED.frameMs3) level = 3;
  const prev = Math.max(0, o.prevLevel | 0);
  return Math.max(prev, level);
}

/**
 * Pixel-ratio cap for shed level (kit floor is 0.75).
 * @param {number} level
 * @param {number} [baseMax=1]
 */
export function pixelRatioForShed(level, baseMax = 1) {
  // v0.9.126: deepen at shed 3; keep shed 1 readable
  const base = Math.max(0.70, Math.min(baseMax || 1, 2));
  if (level >= 3) return Math.min(base, 0.72);
  if (level >= 2) return Math.min(base, 0.80);
  if (level >= 1) return Math.min(base, 0.90);
  return base;
}

/**
 * Bloom strength for shed (mobile baseline already ~0.10).
 * @param {number} level
 * @param {number} [mobileBase=0.15] v0.9.53 prettier mobile baseline
 */
export function bloomStrengthForShed(level, mobileBase = 0.15) {
  if (level >= 3) return Math.min(mobileBase, 0.02);
  if (level >= 2) return Math.min(mobileBase, 0.04);
  if (level >= 1) return Math.min(mobileBase, 0.08);
  return mobileBase;
}

/** Skip particle updates under GPU pressure: ≥2 every other; ≥3 two-of-three. */
export function shouldSkipParticleTick(level, frameIndex) {
  const lv = level | 0;
  const fi = frameIndex | 0;
  if (lv >= 3) return (fi % 3) !== 0;
  if (lv >= 2) return (fi & 1) === 1;
  return false;
}

/** Skip post-FX / shake every other frame at shed ≥ 2; 2-of-3 at ≥ 3. */
export function shouldSkipPostFx(level, frameIndex) {
  const lv = level | 0;
  const fi = frameIndex | 0;
  if (lv >= 3) return (fi % 3) !== 0;
  if (lv >= 2) return (fi & 1) === 1;
  return false;
}

/** Soft-feel rings/sparks density cut at shed ≥ 2 (no soft-juice invent — skip only). */
export function shouldSkipFeelRing(level) {
  return (level | 0) >= 2;
}

/**
 * Cool-pause when sustained hot frames at shed ≥ 2 — prevent context death.
 * Shed ≥ 3 triggers one sample sooner. Same contract as bg-pause: play only; never auto-resume.
 * @param {{ shedLevel: number, hotStreak: number, state: string }} o
 */
export function shouldCoolPause(o) {
  if (!o || o.state !== 'play') return false;
  const lv = o.shedLevel | 0;
  const hot = o.hotStreak | 0;
  if (lv >= 3) return hot >= Math.max(1, SHED.hotSamples - 1);
  if (lv >= 2) return hot >= SHED.hotSamples;
  return false;
}

/**
 * Build a small interrupt snapshot from a live Game (or partial).
 * @param {{ t?: number, score?: number, kills?: number, mapZone?: string }|null} game
 * @param {number} [nowMs]
 */
export function buildInterruptSnapshot(game, nowMs = Date.now(), reason = 'webgl') {
  if (!game) return null;
  return {
    v: 1,
    at: nowMs,
    t: Math.max(0, Math.floor(game.t || 0)),
    score: Math.max(0, Math.floor(game.score || 0)),
    kills: Math.max(0, Math.floor(game.kills || 0)),
    zone: typeof game.mapZone === 'string' ? game.mapZone : 'lab',
    reason: reason || 'webgl',
  };
}

/** @param {Storage|null|undefined} storage @param {object|null} snap */
export function writeInterruptSnapshot(storage, snap) {
  if (!storage || !snap) return false;
  try {
    storage.setItem(WEBGL_INTERRUPT_KEY, JSON.stringify(snap));
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * @param {Storage|null|undefined} storage
 * @param {number} [nowMs]
 * @param {number} [maxAgeMs]
 */
export function readInterruptSnapshot(storage, nowMs = Date.now(), maxAgeMs = INTERRUPT_MAX_AGE_MS) {
  if (!storage) return null;
  let raw;
  try { raw = storage.getItem(WEBGL_INTERRUPT_KEY); } catch (_) { return null; }
  if (!raw) return null;
  let snap;
  try { snap = JSON.parse(raw); } catch (_) { return null; }
  if (!snap || snap.v !== 1 || typeof snap.at !== 'number') return null;
  if (nowMs - snap.at > maxAgeMs || nowMs < snap.at) return null;
  return snap;
}

/** @param {Storage|null|undefined} storage */
export function clearInterruptSnapshot(storage) {
  if (!storage) return;
  try { storage.removeItem(WEBGL_INTERRUPT_KEY); } catch (_) {}
}

/**
 * zh-HK / EN interrupt note for gfx overlay or menu strip.
 * @param {object|null} snap
 * @param {boolean} [isZh=true]
 */
export function formatInterruptNote(snap, isZh = true) {
  if (!snap) return '';
  const mm = Math.floor((snap.t || 0) / 60);
  const ss = String((snap.t || 0) % 60).padStart(2, '0');
  const score = snap.score | 0;
  const kills = snap.kills | 0;
  const cool = snap.reason === 'cool-pause';
  if (isZh) {
    if (cool) {
      return `上次因幀時間過長而冷卻暫停 · ${mm}:${ss} · ${score} 分 · ${kills} 擊殺 — 唔係自動續關；可撳繼續或重開。`;
    }
    return `上次繪圖中斷 · ${mm}:${ss} · ${score} 分 · ${kills} 擊殺 — 重新載入後可再開一局（唔會自動續關）。`;
  }
  if (cool) {
    return `Last cool-pause (sustained hot frames) · ${mm}:${ss} · ${score} pts · ${kills} kills — not auto-resume; continue or restart.`;
  }
  return `Last graphics interrupt · ${mm}:${ss} · ${score} pts · ${kills} kills — reload then start a new run (no auto-resume).`;
}
