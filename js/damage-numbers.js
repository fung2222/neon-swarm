/**
 * Lightweight floating damage / heal / hurt digits (v0.9.34 / PHASE6-DAMAGE-NUMBERS-LITE-001).
 * DOM pool — no Three.js sprites. No DPS / xpToLevel / balance changes.
 */

export const DMG_FLOAT_LIFE_MS = 580;
export const DMG_FLOAT_MAX_DESKTOP = 16;
export const DMG_FLOAT_MAX_MOBILE = 10;
export const DMG_THROTTLE_MS = 100;

/** Round display amount; front-block with ~0 → 擋. */
export function formatFloatText(kind, amount, frontBlock = false) {
  const raw = Number(amount);
  const n = Number.isFinite(raw) ? Math.round(raw) : 0;
  if (kind === 'heal') return `+${Math.max(1, n || 1)}`;
  if (kind === 'hurt') return `-${Math.max(1, n || 1)}`;
  if (frontBlock && n < 1) return '擋';
  return String(Math.max(1, n || 1));
}

export function floatCssClass(kind, { heavy = false, frontBlock = false } = {}) {
  if (kind === 'heal') return 'dmg-float dmg-heal';
  if (kind === 'hurt') return 'dmg-float dmg-hurt';
  if (frontBlock) return 'dmg-float dmg-block';
  if (heavy) return 'dmg-float dmg-hit dmg-heavy';
  return 'dmg-float dmg-hit';
}

/**
 * Per-key throttle (e.g. enemy id) — skip spam under MG fire.
 * @param {Map<any, number>} throttleMap
 */
export function shouldEmitFloat(throttleMap, key, nowMs, throttleMs = DMG_THROTTLE_MS) {
  if (key == null || key === '') return true;
  const last = throttleMap.get(key);
  if (last != null && nowMs - last < throttleMs) return false;
  throttleMap.set(key, nowMs);
  return true;
}

/** NDC (−1..1) → CSS px inside a canvas-sized layer. */
export function ndcToCss(ndcX, ndcY, width, height) {
  return {
    left: (ndcX * 0.5 + 0.5) * width,
    top: (-ndcY * 0.5 + 0.5) * height,
  };
}

/**
 * @param {HTMLElement} root
 * @param {{ max?: number, lifeMs?: number, throttleMs?: number }} [opts]
 */
export function createDamageFloatPool(root, opts = {}) {
  const max = opts.max != null ? opts.max : DMG_FLOAT_MAX_DESKTOP;
  const lifeMs = opts.lifeMs != null ? opts.lifeMs : DMG_FLOAT_LIFE_MS;
  const throttleMs = opts.throttleMs != null ? opts.throttleMs : DMG_THROTTLE_MS;
  const pool = [];
  const active = [];
  const throttle = new Map();

  for (let i = 0; i < max; i++) {
    const el = document.createElement('span');
    el.className = 'dmg-float';
    el.setAttribute('aria-hidden', 'true');
    el.style.display = 'none';
    root.appendChild(el);
    pool.push(el);
  }

  function release(el) {
    if (!el) return;
    if (el._dmgT) { clearTimeout(el._dmgT); el._dmgT = 0; }
    el.style.display = 'none';
    el.textContent = '';
    el.className = 'dmg-float';
    const i = active.indexOf(el);
    if (i >= 0) active.splice(i, 1);
    if (pool.length < max) pool.push(el);
  }

  /**
   * @param {{ kind: 'hit'|'heal'|'hurt', amount?: number, left: number, top: number,
   *           heavy?: boolean, frontBlock?: boolean, key?: any, now?: number }} opts
   */
  function spawn(s) {
    if (!s) return null;
    const kind = s.kind || 'hit';
    const amount = s.amount;
    const frontBlock = !!s.frontBlock;
    const now = s.now != null ? s.now : (typeof performance !== 'undefined' ? performance.now() : 0);
    if (kind === 'hit' && !frontBlock && !(Number(amount) > 0)) return null;
    if ((kind === 'heal' || kind === 'hurt') && !(Number(amount) > 0)) return null;
    if (kind === 'hit' && !shouldEmitFloat(throttle, s.key, now, throttleMs)) return null;

    let el = pool.pop();
    if (!el) {
      el = active.shift();
      if (!el) return null;
      if (el._dmgT) clearTimeout(el._dmgT);
    }
    el.className = floatCssClass(kind, { heavy: !!s.heavy, frontBlock });
    el.textContent = formatFloatText(kind, amount, frontBlock);
    el.style.display = '';
    el.style.left = `${Math.round(s.left)}px`;
    el.style.top = `${Math.round(s.top)}px`;
    // restart CSS animation
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
    el._dmgT = setTimeout(() => release(el), lifeMs);
    active.push(el);
    return el;
  }

  function clear() {
    while (active.length) release(active[0]);
    throttle.clear();
  }

  return { spawn, clear, release, active, pool, throttle, max, lifeMs };
}
