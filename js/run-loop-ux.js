/**
 * Run-loop UX helpers (v0.9.33 / PHASE6-RUN-LOOP-UX-001).
 * Coach tip gate, zone short labels, over-screen loadout text.
 * No balance / xpToLevel / DPS changes.
 */

export const COACH_STORAGE_KEY = 'neon-swarm-coach-v1';
export const COACH_MS = 3200;
export const HURT_VIGNETTE_MS = 180;
export const STICK_HINT_MS = 2000;

/** Short zone names for over screen (not "進入 · …"). */
export const ZONE_SHORT = Object.freeze({
  lab: { zh: '實驗室', en: 'LAB' },
  assembly: { zh: '機甲組裝區', en: 'ASSEMBLY BAY' },
  reactor: { zh: '能源反應爐', en: 'REACTOR' },
  blockade: { zh: '軍事封鎖區', en: 'BLOCKADE' },
  rooftop: { zh: '天台逃出區', en: 'ROOFTOP' },
});

const MG_LABEL = { zh: '機槍', en: 'MG' };

/**
 * @param {Storage|null|undefined} storage
 * @param {{ sessionShown?: boolean }} session
 */
export function shouldShowCoach(storage, session = {}) {
  if (session && session.sessionShown) return false;
  try {
    if (storage && storage.getItem(COACH_STORAGE_KEY) === '1') return false;
  } catch (_) {}
  return true;
}

/** @param {Storage|null|undefined} storage */
export function markCoachSeen(storage) {
  try {
    if (storage) storage.setItem(COACH_STORAGE_KEY, '1');
  } catch (_) {}
}

export function zoneShortLabel(zoneId, isZh = true) {
  const z = ZONE_SHORT[zoneId] || ZONE_SHORT.lab;
  return isZh ? z.zh : z.en;
}

/**
 * @param {string[]} slots
 * @param {Record<string, number>} taken
 * @param {Record<string, { zh?: string, en?: string }>} cardsById
 * @param {boolean} isZh
 */
export function formatLoadoutLine(slots, taken = {}, cardsById = {}, isZh = true) {
  const list = Array.isArray(slots) ? slots.filter(Boolean) : [];
  if (!list.length) return isZh ? '機槍' : 'MG';
  return list.map((id) => {
    const stack = id === 'mg'
      ? Math.max(1, (taken && (taken.dmg || taken.rate)) ? 1 : 1)
      : Math.max(1, (taken && taken[id]) || 1);
    // Display stack from game fields is caller-resolved; here use taken[id] or 1
    const lv = id === 'mg' ? Math.max(1, Number(taken.mg) || 1) : Math.max(1, Number(taken[id]) || 1);
    let name;
    if (id === 'mg') name = isZh ? MG_LABEL.zh : MG_LABEL.en;
    else if (cardsById[id]) name = isZh ? (cardsById[id].zh || id) : (cardsById[id].en || id);
    else name = String(id).toUpperCase();
    return `${name} Lv${lv}`;
  }).join(isZh ? ' · ' : ' · ');
}

/** Resolve stack level for a slotted weapon from game-like state. */
export function slotStackLevel(id, g) {
  if (!g) return 1;
  if (id === 'mg') return 1; // MG has no stack field; always base
  const n = Number(g[id]);
  if (Number.isFinite(n) && n > 0) return n;
  const t = g.taken && g.taken[id];
  return Math.max(1, Number(t) || 1);
}

export function formatLoadoutFromGame(g, cardsById = {}, isZh = true) {
  const slots = (g && g.weaponSlots) ? g.weaponSlots.filter(Boolean) : ['mg'];
  return slots.map((id) => {
    const lv = slotStackLevel(id, g);
    let name;
    if (id === 'mg') name = isZh ? MG_LABEL.zh : MG_LABEL.en;
    else if (cardsById[id]) name = isZh ? (cardsById[id].zh || id) : (cardsById[id].en || id);
    else name = String(id).toUpperCase();
    return `${name} Lv${lv}`;
  }).join(' · ');
}

/** Zone accent colors matching edge-trim identity (not danger telegraph reds). */
export const ZONE_CHIP_ACCENT = Object.freeze({
  lab: '#2ad4c8',
  assembly: '#e8a040',
  reactor: '#b44dff',
  blockade: '#9aaa6e',
  rooftop: '#6aa8ff',
});

/**
 * @param {string} zoneId
 * @returns {{ id: string, zh: string, en: string, accent: string }}
 */
export function zoneChipInfo(zoneId) {
  const id = ZONE_SHORT[zoneId] ? zoneId : 'lab';
  const z = ZONE_SHORT[id];
  return {
    id,
    zh: z.zh,
    en: z.en,
    accent: ZONE_CHIP_ACCENT[id] || ZONE_CHIP_ACCENT.lab,
  };
}
