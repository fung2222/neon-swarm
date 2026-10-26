/**
 * Over-screen result share / copy (v0.9.39 / PHASE6-RESULT-SHARE-001).
 * No social SDK / analytics / backend. Feedback-only UX.
 */

export const LIVE_URL = 'https://fung2222.github.io/neon-swarm/';
export const SHARE_CONFIRM_MS = 1000;

/**
 * @param {{ timeStr: string, kills: number|string, zone: string, score: number|string, isZh?: boolean, url?: string }} opts
 */
export function buildShareText(opts = {}) {
  const isZh = opts.isZh !== false;
  const time = opts.timeStr != null ? String(opts.timeStr) : '0:00';
  const kills = opts.kills != null ? String(opts.kills) : '0';
  const zone = opts.zone != null && String(opts.zone) ? String(opts.zone) : (isZh ? '—' : '—');
  const score = opts.score != null ? String(opts.score) : '0';
  const url = opts.url != null ? String(opts.url) : LIVE_URL;
  const line = isZh
    ? `暴走機甲 · 存活 ${time} · 擊殺 ${kills} · 區域 ${zone} · 分數 ${score}`
    : `RAMPAGE MECH · Survived ${time} · Kills ${kills} · Zone ${zone} · Score ${score}`;
  return `${line}\n${url}`;
}

/** Prefer Web Share on touch / coarse pointer when available. */
export function canNativeShare(nav = typeof navigator !== 'undefined' ? navigator : null, opts = {}) {
  if (!nav || typeof nav.share !== 'function') return false;
  const forceTouch = opts.forceTouch;
  const touch = forceTouch != null
    ? !!forceTouch
    : (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches)
      || (typeof navigator !== 'undefined' && (navigator.maxTouchPoints || 0) > 0);
  return !!touch;
}

export function shareButtonLabels(useShare) {
  return useShare
    ? { zh: '分享戰績', en: 'SHARE RUN' }
    : { zh: '複製戰績', en: 'COPY RUN' };
}

export function confirmCopy(ok, usedShare = false) {
  if (!ok) {
    return { zh: '複製失敗', en: 'COPY FAILED' };
  }
  if (usedShare) return { zh: '已分享', en: 'SHARED' };
  return { zh: '已複製', en: 'COPIED' };
}

/**
 * Try navigator.share then clipboard. Returns { ok, usedShare }.
 * @param {string} text
 * @param {{ title?: string, nav?: Navigator, clipboard?: Clipboard, preferShare?: boolean }} opts
 */
export async function shareOrCopy(text, opts = {}) {
  const nav = opts.nav || (typeof navigator !== 'undefined' ? navigator : null);
  const preferShare = opts.preferShare !== false && canNativeShare(nav, { forceTouch: opts.forceTouch });

  if (preferShare) {
    try {
      await nav.share({ title: opts.title || '暴走機甲', text });
      return { ok: true, usedShare: true };
    } catch (err) {
      // User cancel → soft fail (not clipboard spam)
      if (err && (err.name === 'AbortError' || err.name === 'NotAllowedError')) {
        return { ok: false, usedShare: true, aborted: true };
      }
      // fall through to clipboard
    }
  }

  const clip = opts.clipboard
    || (nav && nav.clipboard)
    || (typeof navigator !== 'undefined' ? navigator.clipboard : null);

  if (clip && typeof clip.writeText === 'function') {
    try {
      await clip.writeText(text);
      return { ok: true, usedShare: false };
    } catch (_) {
      return { ok: false, usedShare: false };
    }
  }

  // Legacy execCommand fallback
  try {
    if (typeof document === 'undefined') return { ok: false, usedShare: false };
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand && document.execCommand('copy');
    document.body.removeChild(ta);
    return { ok: !!ok, usedShare: false };
  } catch (_) {
    return { ok: false, usedShare: false };
  }
}
