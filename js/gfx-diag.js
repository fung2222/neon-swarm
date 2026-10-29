/**
 * MOBILE-WEBGL-DIAG-001 (v0.9.204)
 * Capped ring-buffer diagnostics for Android / WebGL fault triage.
 * No PII, no full query strings. Pure enough for unit tests (injectable now).
 *
 * renderer.info.memory is Three.js resource *counts*, not real GPU RAM.
 */

export const GFX_DIAG_MAX = 80;
export const GFX_DIAG_VERSION = 1;

/** Strip query/hash; keep path only. Never store full location.search. */
export function sanitizeUrl(href) {
  if (!href || typeof href !== 'string') return '';
  try {
    const u = new URL(href, 'https://example.invalid');
    return (u.pathname || '').slice(0, 160);
  } catch (_) {
    return String(href).split('?')[0].split('#')[0].slice(0, 160);
  }
}

/** Compact error fields for the ring (no huge stacks). */
export function summarizeError(err, maxStack = 600) {
  if (!err) return { name: 'Error', message: 'unknown', stack: '' };
  if (typeof err === 'string') return { name: 'Error', message: err.slice(0, 300), stack: '' };
  const name = String(err.name || 'Error').slice(0, 80);
  const message = String(err.message || err).slice(0, 300);
  let stack = '';
  try { stack = String(err.stack || '').slice(0, maxStack); } catch (_) {}
  return { name, message, stack };
}

/**
 * Classify a fault for UI — do NOT label plain JS as WebGL/GPU.
 * @returns {'lost'|'reload-cap'|'boot-webgl'|'boot-js'|'loop-gl'|'loop-js'|'unknown'}
 */
export function classifyFault(kind, err) {
  const k = String(kind || '');
  if (k === 'lost' || k === 'contextlost') return 'lost';
  if (k === 'reload-cap' || k === 'reloadcap') return 'reload-cap';
  if (k === 'boot-webgl' || k === 'webgl') return 'boot-webgl';
  if (k === 'boot-js' || k === 'boot') {
    // Legacy 'boot' from older tips meant GPU; callers must pass boot-js/boot-webgl.
    // If an Error is provided and looks non-GL, prefer boot-js.
    if (err && !looksLikeWebGlError(err)) return 'boot-js';
    if (err && looksLikeWebGlError(err)) return 'boot-webgl';
    return 'boot-js';
  }
  if (k === 'loop-gl') return 'loop-gl';
  if (k === 'loop-js' || k === 'loop') {
    if (err && looksLikeWebGlError(err)) return 'loop-gl';
    return 'loop-js';
  }
  if (err && looksLikeWebGlError(err)) return 'loop-gl';
  return 'unknown';
}

export function looksLikeWebGlError(err) {
  // IMPORTANT: do NOT scan stack — file paths like webgl-guard.js false-positive.
  const s = `${err && err.name || ''} ${err && err.message || ''}`;
  return /webgl|context\s*lost|GPU process|GL_INVALID|Error creating WebGL context/i.test(s);
}

/**
 * Create a diagnostics ring. `now` injectable for tests.
 */
export function createGfxDiag({ max = GFX_DIAG_MAX, now = () => Date.now() } = {}) {
  const events = [];
  let seq = 0;
  const flags = {
    contextLost: false,
    contextRestored: false,
    bootOk: false,
    lastFaultKind: null,
  };

  function push(type, data = {}) {
    seq += 1;
    const entry = {
      i: seq,
      t: now(),
      type: String(type || 'event').slice(0, 40),
    };
    // Copy only safe scalar / small fields
    for (const key of Object.keys(data || {})) {
      if (key === 'href' || key === 'url' || key === 'search') {
        entry.path = sanitizeUrl(data[key]);
        continue;
      }
      const v = data[key];
      if (v == null) continue;
      if (typeof v === 'number' || typeof v === 'boolean') entry[key] = v;
      else if (typeof v === 'string') entry[key] = v.slice(0, 240);
      else if (typeof v === 'object' && v.name && v.message != null) {
        entry.errName = String(v.name).slice(0, 80);
        entry.errMsg = String(v.message).slice(0, 300);
        if (v.stack) entry.errStack = String(v.stack).slice(0, 600);
      }
    }
    events.push(entry);
    while (events.length > max) events.shift();
    return entry;
  }

  function markBootOk() {
    flags.bootOk = true;
    push('boot-ok');
  }

  function noteContextLost(extra) {
    flags.contextLost = true;
    push('contextlost', extra || {});
  }

  function noteContextRestored(extra) {
    flags.contextRestored = true;
    push('contextrestored', extra || {});
  }

  function noteFault(kind, err, extra) {
    const classified = classifyFault(kind, err);
    flags.lastFaultKind = classified;
    const sum = summarizeError(err);
    push('fault', {
      kind: classified,
      errName: sum.name,
      errMsg: sum.message,
      errStack: sum.stack,
      ...(extra || {}),
    });
    return classified;
  }

  function noteShed(level, reason, extra) {
    push('shed', { level: level | 0, reason: String(reason || '').slice(0, 120), ...(extra || {}) });
  }

  function noteCoolPause(extra) {
    push('cool-pause', extra || {});
  }

  /** Sample Three.js renderer.info — counts only, NOT GPU RAM. */
  function sampleRenderer(renderer, extra) {
    try {
      const info = renderer && renderer.info;
      if (!info) return null;
      const mem = info.memory || {};
      const ren = info.render || {};
      return push('renderer-info', {
        geo: mem.geometries | 0,
        tex: mem.textures | 0,
        calls: ren.calls | 0,
        tris: ren.triangles | 0,
        ...(extra || {}),
      });
    } catch (_) {
      return null;
    }
  }

  function sampleGame(game, extra) {
    if (!game) return null;
    return push('game-counts', {
      enemies: (game.enemies && game.enemies.length) | 0,
      bullets: (game.bullets && game.bullets.length) | 0,
      runT: Math.floor(game.t || 0),
      ...(extra || {}),
    });
  }

  function dump() {
    return {
      v: GFX_DIAG_VERSION,
      flags: { ...flags },
      n: events.length,
      max,
      events: events.slice(),
    };
  }

  /** One-line summary for overlay / console (no PII). */
  function summaryLine() {
    const lastFault = [...events].reverse().find((e) => e.type === 'fault');
    const lastShed = [...events].reverse().find((e) => e.type === 'shed');
    const parts = [
      `bootOk=${flags.bootOk ? 1 : 0}`,
      `lost=${flags.contextLost ? 1 : 0}`,
      `restored=${flags.contextRestored ? 1 : 0}`,
      lastFault ? `fault=${lastFault.kind || '?'}` : 'fault=none',
      lastShed ? `shed=${lastShed.level}` : 'shed=?',
      `n=${events.length}`,
    ];
    return parts.join(' ');
  }

  return {
    push,
    markBootOk,
    noteContextLost,
    noteContextRestored,
    noteFault,
    noteShed,
    noteCoolPause,
    sampleRenderer,
    sampleGame,
    dump,
    summaryLine,
    get events() { return events; },
    get flags() { return flags; },
  };
}

/** sessionStorage key: auto-reload budget after contextrestored */
export const GFX_RELOAD_KEY = 'neon-swarm-gfx-reload-v1';
export const GFX_RELOAD_MAX = 2;
export const GFX_RELOAD_WINDOW_MS = 5 * 60 * 1000;

/**
 * Should contextrestored auto-reload? Caps infinite reload loops.
 * @param {Storage|null} storage
 * @param {number} [nowMs]
 */
export function shouldAutoReloadOnRestore(storage, nowMs = Date.now()) {
  if (!storage) return true;
  let raw;
  try { raw = storage.getItem(GFX_RELOAD_KEY); } catch (_) { return true; }
  if (!raw) return true;
  let o;
  try { o = JSON.parse(raw); } catch (_) { return true; }
  if (!o || typeof o.at !== 'number' || typeof o.n !== 'number') return true;
  if (nowMs - o.at > GFX_RELOAD_WINDOW_MS || nowMs < o.at) return true;
  return o.n < GFX_RELOAD_MAX;
}

export function bumpAutoReloadCount(storage, nowMs = Date.now()) {
  if (!storage) return 0;
  let n = 1;
  let at = nowMs;
  try {
    const raw = storage.getItem(GFX_RELOAD_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      if (o && typeof o.at === 'number' && typeof o.n === 'number'
        && nowMs - o.at <= GFX_RELOAD_WINDOW_MS && nowMs >= o.at) {
        n = (o.n | 0) + 1;
        at = o.at;
      }
    }
  } catch (_) {}
  try { storage.setItem(GFX_RELOAD_KEY, JSON.stringify({ v: 1, at, n })); } catch (_) {}
  return n;
}

export function clearAutoReloadCount(storage) {
  if (!storage) return;
  try { storage.removeItem(GFX_RELOAD_KEY); } catch (_) {}
}

/** Human shed reason from inputs (for diag). */
export function shedReasonText(o, SHED) {
  if (!o || !o.mobile) return 'desktop';
  const parts = [];
  const runT = o.runT || 0;
  const avg = o.avgFrameMs || 0;
  if (runT >= (SHED.t3 || 240)) parts.push('runT>=t3');
  else if (runT >= (SHED.t2 || 150)) parts.push('runT>=t2');
  else if (runT >= (SHED.t1 || 75)) parts.push('runT>=t1');
  if (avg >= (SHED.frameMs3 || 48)) parts.push('avg>=ms3');
  else if (avg >= (SHED.frameMs2 || 36)) parts.push('avg>=ms2');
  else if (avg >= (SHED.frameMs1 || 26)) parts.push('avg>=ms1');
  if (!parts.length) parts.push('monotonic');
  return parts.join('+');
}
