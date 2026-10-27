/**
 * PHONE-STABLE-CONTEXT-001 (v0.9.51)
 * Mid-run WebGL context-loss prevention + recovery helpers.
 * Pure / storage-injectable — unit-testable without DOM/WebGL.
 *
 * Prevention: escalate MOBILE_GFX shed level from run time + frame budget
 *   (lower PR, bloom, particle tick rate) before the GPU process dies.
 * Recovery: stash a tiny interrupt snapshot on contextlost so reload overlay
 *   can show last score/time (Three.js soft-restore still inadequate — reload).
 * Desktop path: shed stays 0; snapshot still ok if context ever loses.
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
  /** run seconds → at least level 1 */
  t1: 90,
  /** run seconds → at least level 2 */
  t2: 180,
  /** rolling avg frame ms → level 1 */
  frameMs1: 28,
  /** rolling avg frame ms → level 2 */
  frameMs2: 40,
  /** rolling avg frame ms counts as "hot" toward cool-pause */
  frameMsHot: 55,
  /** consecutive hot samples (~0.5s each in main) before cool-pause */
  hotSamples: 6,
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
 * Level 0 = baseline MOBILE_GFX cuts only; 1–2 = further mid-run shed.
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
  const prev = Math.max(0, o.prevLevel | 0);
  return Math.max(prev, level);
}

/**
 * Pixel-ratio cap for shed level (kit floor is 0.75).
 * @param {number} level
 * @param {number} [baseMax=1]
 */
export function pixelRatioForShed(level, baseMax = 1) {
  // v0.9.53: keep cool-pause safety but don't crush PR as hard at shed 1
  const base = Math.max(0.75, Math.min(baseMax || 1, 2));
  if (level >= 2) return Math.min(base, 0.80);
  if (level >= 1) return Math.min(base, 0.92);
  return base;
}

/**
 * Bloom strength for shed (mobile baseline already ~0.10).
 * @param {number} level
 * @param {number} [mobileBase=0.15] v0.9.53 prettier mobile baseline
 */
export function bloomStrengthForShed(level, mobileBase = 0.15) {
  if (level >= 2) return Math.min(mobileBase, 0.04); // keep faint glow; cool-pause still protects
  if (level >= 1) return Math.min(mobileBase, 0.09);
  return mobileBase;
}

/** Skip every other particle update at shed ≥ 2 (halve GPU particle work). */
export function shouldSkipParticleTick(level, frameIndex) {
  return (level | 0) >= 2 && ((frameIndex | 0) & 1) === 1;
}

/**
 * Cool-pause when sustained hot frames at shed ≥ 2 — prevent context death.
 * Same contract as bg-pause: only from `play`; never auto-resume.
 * @param {{ shedLevel: number, hotStreak: number, state: string }} o
 */
export function shouldCoolPause(o) {
  if (!o || o.state !== 'play') return false;
  return (o.shedLevel | 0) >= 2 && (o.hotStreak | 0) >= SHED.hotSamples;
}

/**
 * Build a small interrupt snapshot from a live Game (or partial).
 * @param {{ t?: number, score?: number, kills?: number, mapZone?: string }|null} game
 * @param {number} [nowMs]
 */
export function buildInterruptSnapshot(game, nowMs = Date.now()) {
  if (!game) return null;
  return {
    v: 1,
    at: nowMs,
    t: Math.max(0, Math.floor(game.t || 0)),
    score: Math.max(0, Math.floor(game.score || 0)),
    kills: Math.max(0, Math.floor(game.kills || 0)),
    zone: typeof game.mapZone === 'string' ? game.mapZone : 'lab',
    reason: 'webgl',
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
  if (isZh) {
    return `上次繪圖中斷 · ${mm}:${ss} · ${score} 分 · ${kills} 擊殺 — 重新載入後可再開一局（唔會自動續關）。`;
  }
  return `Last graphics interrupt · ${mm}:${ss} · ${score} pts · ${kills} kills — reload then start a new run (no auto-resume).`;
}
