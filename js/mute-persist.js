/**
 * Mute preference helpers (v0.9.35 / PHASE6-MUTE-PERSIST-001).
 * Kit already persists via createStore → cyber.<gameId>.muted (SynthAudio.setMuted).
 * This module hardens cold-load UI sync, aria labels, and round-trip tests.
 * No dual music/sfx mute sliders — master mute only.
 */

/** Store bool key used by SynthAudio (namespaced as cyber.<gameId>.muted). */
export const MUTE_STORE_KEY = 'muted';

/** Full localStorage key for neon-swarm (for early paint / smoke tests). */
export const MUTE_LS_KEY = 'cyber.neon-swarm.muted';

/** Optional alias — read as fallback if kit key missing (legacy / harden). */
export const MUTE_ALIAS_KEY = 'neon-swarm-mute';

export function readMutedFromStore(store, def = false) {
  if (!store || typeof store.getBool !== 'function') return !!def;
  return !!store.getBool(MUTE_STORE_KEY, def);
}

export function writeMutedToStore(store, muted) {
  if (!store || typeof store.setBool !== 'function') return;
  store.setBool(MUTE_STORE_KEY, !!muted);
  // Mirror alias for greppable / early-script consumers
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MUTE_ALIAS_KEY, muted ? '1' : '0');
    }
  } catch (_) {}
}

/**
 * Read muted from raw localStorage (pre-module / early paint).
 * Prefers kit key, then alias.
 */
export function readMutedFromLocalStorage(ls, def = false) {
  if (!ls) return !!def;
  try {
    const kit = ls.getItem(MUTE_LS_KEY);
    if (kit === '1') return true;
    if (kit === '0') return false;
    const alias = ls.getItem(MUTE_ALIAS_KEY);
    if (alias === '1') return true;
    if (alias === '0') return false;
  } catch (_) {}
  return !!def;
}

/** zh-HK / EN tip depending on current mute state. */
export function muteTipFor(muted, isZh = true) {
  if (muted) return isZh ? '取消靜音' : 'Unmute';
  return isZh ? '靜音' : 'Mute';
}

/**
 * Paint mute button(s): .muted class + title/aria-label.
 * @param {boolean} muted
 * @param {Iterable<Element|null|undefined>} buttons
 * @param {{ isZh?: boolean }} [opts]
 */
export function applyMuteUi(muted, buttons, opts = {}) {
  const on = !!muted;
  const isZh = opts.isZh !== false;
  const tip = muteTipFor(on, isZh);
  const list = buttons ? [...buttons].filter(Boolean) : [];
  for (const btn of list) {
    btn.classList.toggle('muted', on);
    try {
      btn.setAttribute('title', tip);
      btn.setAttribute('aria-label', tip);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    } catch (_) {}
  }
  return tip;
}

/**
 * Apply preference to audio + UI. Uses audio.setMuted when persist=true (writes store).
 * When persist=false (e.g. ?mute=1 session override), only sets property + UI.
 */
export function applyMutePreference(audio, uiButtons, muted, { persist = true, isZh = true } = {}) {
  const on = !!muted;
  if (audio) {
    if (persist && typeof audio.setMuted === 'function') {
      audio.setMuted(on);
    } else {
      audio.muted = on;
      if (persist && audio.store) writeMutedToStore(audio.store, on);
    }
  }
  applyMuteUi(on, uiButtons, { isZh });
  return on;
}
