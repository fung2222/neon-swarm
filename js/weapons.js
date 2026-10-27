/**
 * WEAPONS-REDESIGN-001 (v0.9.53) + WEAPONS-BRANCH-PICK-001 (v0.9.54).
 * Spec: docs/WEAPONS.md. Branch/ult pick UI playable at Lv3 / Lv5.
 */

export const LOADOUT_CAPS = Object.freeze({
  primary: 2,
  secondary: 2,
  throw: 2,
  total: 6,
});

/** Legacy slot ids → new catalog ids (ingest only). */
export const WEAPON_ID_ALIASES = Object.freeze({
  mg: 'gatling',
  laser: 'ion_beam',
  rocket: 'tracking_bomb',
  grenade: 'frag',
  plasma: 'acid_gun',
  // shotgun stays shotgun
});

/**
 * Full catalog. behavior: which legacy fire path (or stub) to drive.
 * Exemplars live: gatling, ion_beam, shotgun, acid_gun, frag.
 */
export const WEAPON_CATALOG = Object.freeze({
  // —— Primary (5) ——
  gatling: {
    id: 'gatling', category: 'primary', zh: '機關雷射炮', en: 'GATLING LASER',
    icon: '⚡', maxLv: 5, branches: 3, ultsPerBranch: 2,
    behavior: 'mg', exemplar: true,
    feel: 'laser_bolts', // discrete laser-feel bullets flying out (not hitscan beam)
    counters: ['soldier', 'staffer', 'guard'], weak: ['shield', 'bomber'],
    base: { hit: 1.0, cd: 0.10, pierce: 0, speed: 28 },
    branchNames: ['過熱連射', '穿甲芯', '散射網'],
  },
  ion_beam: {
    id: 'ion_beam', category: 'primary', zh: '離子光束', en: 'ION BEAM',
    icon: '═', maxLv: 5, branches: 3, ultsPerBranch: 2,
    behavior: 'ion_charge', exemplar: true,
    feel: 'charge_fire_charge', // charge → fire → charge; very high damage per shot
    counters: ['drone', 'flanker', 'sniper'], weak: ['shield', 'walker'],
    base: { hit: 3.6, charge: 0.55, cd: 0.12, pierce: 3 },
    branchNames: ['長焦聚焦', '連鎖跳電', '裂縫切割'],
  },
  tracking_bomb: {
    id: 'tracking_bomb', category: 'primary', zh: '追蹤爆彈', en: 'TRACKING BOMB',
    icon: '🚀', maxLv: 5, branches: 3, ultsPerBranch: 2,
    behavior: 'track_stick', exemplar: true,
    feel: 'track_stick_explode', // track nearest → stick → quick auto explode, small AoE
    counters: ['artillery', 'medic', 'commander'], weak: ['flanker', 'jammer'],
    base: { hit: 2.4, cd: 1.5, pierce: 0, aoe: 1.6, stick: 0.35, homing: 14 },
    branchNames: ['三重彈頭', '黏著地雷', '自殺無人機'],
  },
  vulcan: {
    id: 'vulcan', category: 'primary', zh: '火神', en: 'VULCAN',
    icon: '☢', maxLv: 5, branches: 3, ultsPerBranch: 2,
    behavior: 'vulcan', exemplar: true,
    feel: 'minigun', // vulcan/minigun style continuous spray
    counters: ['soldier', 'bomber'], weak: ['sniper', 'shield'],
    base: { hit: 0.55, cd: 0.045, pierce: 0, range: 10, spinUp: 0.4 },
    branchNames: ['彈幕風暴', '燒夷彈', '機槍堡壘'],
  },
  zero_laser: {
    id: 'zero_laser', category: 'primary', zh: '零度激光', en: 'ZERO LASER',
    icon: '❄', maxLv: 5, branches: 3, ultsPerBranch: 2,
    behavior: 'zero_bolts', exemplar: true,
    feel: 'discrete_laser_bolts', // discrete laser bolts one-by-one
    counters: ['mech', 'hunter'], weak: ['jammer', 'drone'],
    base: { hit: 1.5, cd: 0.28, pierce: 1, chill: 0.7, speed: 32 },
    branchNames: ['絕對零度', '霜爆裂縫', '寒晶護盾'],
  },

  // —— Secondary (5) ——
  acid_gun: {
    id: 'acid_gun', category: 'secondary', zh: '硫酸槍', en: 'ACID GUN',
    icon: '☣', maxLv: 5, branches: 2, ultsPerBranch: 0,
    behavior: 'acid_stream', exemplar: true, resource: 'ammo',
    feel: 'ten_shot_dissolve', // 10 continuous dissolving shots
    counters: ['shield', 'walker', 'mech'], weak: ['flanker', 'drone'],
    base: { hit: 0.85, cd: 0.12, pool: 10, reload: 2.2, dissolve: 1.4 },
    branchNames: ['溶甲霧', '酸池陷阱'],
  },
  shotgun: {
    id: 'shotgun', category: 'secondary', zh: '散彈槍', en: 'SHOTGUN',
    icon: '✴', maxLv: 5, branches: 2, ultsPerBranch: 0,
    behavior: 'shotgun', exemplar: true, resource: 'ammo',
    feel: 'heavy_pellet_spray', // heavy pellet spray, close range
    counters: ['soldier', 'bomber'], weak: ['sniper', 'artillery'],
    base: { hit: 0.7, pellets: 10, cd: 0.70, pool: 8, reload: 1.4, range: 7 },
    branchNames: ['寬扇', '獨頭彈'],
  },
  slow_gun: {
    id: 'slow_gun', category: 'secondary', zh: '緩速槍', en: 'SLOW GUN',
    icon: '🕸', maxLv: 5, branches: 2, ultsPerBranch: 0,
    behavior: 'slow_rush', exemplar: true, resource: 'energy',
    feel: 'rush_stop_slow', // sudden high-speed close rush → stop/slow enemies in area
    counters: ['flanker', 'bomber', 'hunter'], weak: ['shield', 'jammer'],
    base: { hit: 0.6, cd: 1.1, pool: 28, regenOut: 5, regenIn: 1.5, slow: 1.6, rush: 14, aoe: 2.4 },
    branchNames: ['凍膠', '黏網'],
  },
  attack_drone: {
    id: 'attack_drone', category: 'secondary', zh: '攻擊兵衛', en: 'ATTACK DRONE',
    icon: '🛸', maxLv: 5, branches: 2, ultsPerBranch: 0,
    behavior: 'deploy_drones', exemplar: true, resource: 'charges',
    feel: 'deploy_two_drones', // deploy 2 small attack drones
    counters: ['medic', 'artillery'], weak: ['jammer'],
    base: { hit: 0.7, cd: 5.5, pool: 2, reload: 8, drones: 2, life: 8 },
    branchNames: ['護衛編隊', '自爆衝鋒'],
  },
  blackhole: {
    id: 'blackhole', category: 'secondary', zh: '黑洞炮', en: 'BLACKHOLE CANNON',
    icon: '◉', maxLv: 5, branches: 2, ultsPerBranch: 0,
    behavior: 'blackhole_pull', exemplar: true, resource: 'charges',
    feel: 'aoe_pull_crush', // AoE pull enemies to center like black hole
    counters: ['drone', 'soldier'], weak: ['sniper'],
    base: { hit: 2.2, cd: 2.6, pool: 2, reload: 10, aoe: 3.4, pull: 9, duration: 1.2 },
    branchNames: ['引力井', '奇點爆破'],
  },

  // —— Throw (4) ——
  frag: {
    id: 'frag', category: 'throw', zh: '破片榴彈', en: 'FRAG GRENADE',
    icon: '💣', maxLv: 5, branches: 2, ultsPerBranch: 0,
    behavior: 'grenade', exemplar: true,
    feel: 'frag_blast', // lobbed delayed blast + shrapnel
    counters: ['soldier', 'medic'], weak: ['sniper'],
    base: { hit: 3.2, fuse: 0.55, cd: 1.7, aoe: 2.4, shards: 6 },
    branchNames: ['高爆', '破片雨'],
  },
  chill: {
    id: 'chill', category: 'throw', zh: '冷卻彈', en: 'CHILL BOMB',
    icon: '❄', maxLv: 5, branches: 2, ultsPerBranch: 0,
    behavior: 'chill_field', exemplar: true,
    feel: 'cool_field', // cooling AoE slow field
    counters: ['bomber', 'hunter', 'flanker'], weak: [],
    base: { hit: 1.0, fuse: 0.35, cd: 2.0, aoe: 2.8, slow: 1.8, duration: 2.2 },
    branchNames: ['霜域', '急凍芯'],
  },
  flash: {
    id: 'flash', category: 'throw', zh: '閃光彈', en: 'FLASHBANG',
    icon: '✦', maxLv: 5, branches: 2, ultsPerBranch: 0,
    behavior: 'flashbang', exemplar: true,
    feel: 'flash_interrupt', // short fuse flash — interrupt / aim break
    counters: ['sniper', 'artillery'], weak: [],
    base: { hit: 0.25, fuse: 0.12, cd: 1.4, aoe: 3.2, stun: 0.9 },
    branchNames: ['致盲', '電磁脈衝'],
  },
  gravity: {
    id: 'gravity', category: 'throw', zh: '重力彈', en: 'GRAVITY BOMB',
    icon: '◎', maxLv: 5, branches: 2, ultsPerBranch: 0,
    behavior: 'gravity_pull', exemplar: true,
    feel: 'gravity_pull_crush', // pull then crush
    counters: ['drone', 'soldier'], weak: [],
    base: { hit: 2.8, fuse: 0.45, cd: 2.8, aoe: 3.2, pull: 11, duration: 0.9 },
    branchNames: ['坍縮', '引力錘'],
  },
});

export const PRIMARY_IDS = Object.freeze(
  Object.keys(WEAPON_CATALOG).filter((id) => WEAPON_CATALOG[id].category === 'primary'),
);
export const SECONDARY_IDS = Object.freeze(
  Object.keys(WEAPON_CATALOG).filter((id) => WEAPON_CATALOG[id].category === 'secondary'),
);
export const THROW_IDS = Object.freeze(
  Object.keys(WEAPON_CATALOG).filter((id) => WEAPON_CATALOG[id].category === 'throw'),
);
export const ALL_WEAPON_IDS = Object.freeze([
  ...PRIMARY_IDS, ...SECONDARY_IDS, ...THROW_IDS,
]);

export function normalizeWeaponId(id) {
  if (!id) return null;
  if (WEAPON_CATALOG[id]) return id;
  const mapped = WEAPON_ID_ALIASES[id];
  return mapped && WEAPON_CATALOG[mapped] ? mapped : null;
}

export function weaponDef(id) {
  const nid = normalizeWeaponId(id);
  return nid ? WEAPON_CATALOG[nid] : null;
}

export function isCatalogWeapon(id) {
  return !!weaponDef(id);
}

export function emptyLoadout() {
  return {
    primary: [null, null],
    secondary: [null, null],
    throw: [null, null],
  };
}

/** Starter: one primary gatling in P0. */
export function starterLoadout() {
  const L = emptyLoadout();
  L.primary[0] = 'gatling';
  return L;
}

/** Flatten loadout → 6 HUD cells [P0,P1,S0,S1,T0,T1]. */
export function flattenLoadout(loadout) {
  const L = loadout || emptyLoadout();
  return [
    L.primary?.[0] ?? null,
    L.primary?.[1] ?? null,
    L.secondary?.[0] ?? null,
    L.secondary?.[1] ?? null,
    L.throw?.[0] ?? null,
    L.throw?.[1] ?? null,
  ];
}

export function loadoutFromFlat(slots) {
  const s = slots || [];
  return {
    primary: [normalizeWeaponId(s[0]) || null, normalizeWeaponId(s[1]) || null],
    secondary: [normalizeWeaponId(s[2]) || null, normalizeWeaponId(s[3]) || null],
    throw: [normalizeWeaponId(s[4]) || null, normalizeWeaponId(s[5]) || null],
  };
}

export function categoryOf(id) {
  const d = weaponDef(id);
  return d ? d.category : null;
}

export function hasEmptyInCategory(loadout, category) {
  const arr = (loadout && loadout[category]) || [];
  return arr.some((x) => x == null);
}

export function slotCountFilled(loadout) {
  return flattenLoadout(loadout).filter(Boolean).length;
}

/** Place weapon into first empty cell of its category. Returns index or -1. */
export function addToLoadout(loadout, weaponId) {
  const id = normalizeWeaponId(weaponId);
  const def = weaponDef(id);
  if (!def || !loadout) return -1;
  const cat = def.category;
  const arr = loadout[cat];
  if (arr.includes(id)) return arr.indexOf(id);
  const i = arr.findIndex((x) => x == null);
  if (i < 0) return -1;
  arr[i] = id;
  return i;
}

/** Swap weapon into category index (for pickup full). */
export function swapLoadoutSlot(loadout, category, index, weaponId) {
  const id = normalizeWeaponId(weaponId);
  if (!loadout || !loadout[category] || index < 0 || index >= loadout[category].length) return false;
  // Clear duplicate elsewhere in same category
  for (let i = 0; i < loadout[category].length; i++) {
    if (i !== index && loadout[category][i] === id) loadout[category][i] = null;
  }
  loadout[category][index] = id;
  return true;
}

export function findInLoadout(loadout, weaponId) {
  const id = normalizeWeaponId(weaponId);
  if (!id || !loadout) return null;
  for (const cat of ['primary', 'secondary', 'throw']) {
    const i = (loadout[cat] || []).indexOf(id);
    if (i >= 0) return { category: cat, index: i };
  }
  return null;
}

export function isArmedInLoadout(loadout, weaponId) {
  return !!findInLoadout(loadout, weaponId);
}

/** Lv display; gatling defaults to ≥1 like legacy mg. */
export function weaponLevel(id, taken = {}) {
  const nid = normalizeWeaponId(id);
  if (!nid) return 0;
  if (nid === 'gatling') {
    const n = Math.max(
      (taken && taken.gatling) || 0,
      (taken && taken.mg) || 0,
      (taken && taken.dmg) || 0,
    );
    return Math.max(1, n);
  }
  return Math.max(
    (taken && taken[nid]) || 0,
    (taken && taken[legacyIdFor(nid)]) || 0,
  );
}

function legacyIdFor(nid) {
  for (const [legacy, neu] of Object.entries(WEAPON_ID_ALIASES)) {
    if (neu === nid) return legacy;
  }
  return null;
}

/** Resource pool init for a secondary. */
export function initialResource(id) {
  const d = weaponDef(id);
  if (!d || d.category !== 'secondary') return null;
  const pool = (d.base && d.base.pool) || 0;
  return { type: d.resource || 'ammo', current: pool, max: pool };
}

/** Flat SLOT_WEAPONS list for pickup eligibility (all catalog). */
export const SLOT_WEAPONS = ALL_WEAPON_IDS.slice();
export const WEAPON_SLOT_MAX = LOADOUT_CAPS.total;

export function emptyWeaponSlots() {
  return flattenLoadout(starterLoadout());
}

export function isSlotWeapon(id) {
  return !!normalizeWeaponId(id) || SLOT_WEAPONS.includes(id);
}

export function hasEmptyWeaponSlot(slotsOrLoadout) {
  if (slotsOrLoadout && slotsOrLoadout.primary) {
    return slotCountFilled(slotsOrLoadout) < LOADOUT_CAPS.total
      && flattenLoadout(slotsOrLoadout).some((s) => s == null);
  }
  const slots = slotsOrLoadout || emptyWeaponSlots();
  return slots.filter(Boolean).length < WEAPON_SLOT_MAX && slots.some((s) => s == null);
}

export function weaponSlotLevel(id, taken = {}) {
  return weaponLevel(id, taken);
}

/** Icon / short label maps for HUD. */
export const WEAPON_ICON = Object.fromEntries(
  ALL_WEAPON_IDS.map((id) => [id, WEAPON_CATALOG[id].icon]),
);
export const WEAPON_LABEL = Object.fromEntries(
  ALL_WEAPON_IDS.map((id) => [id, WEAPON_CATALOG[id].en.split(' ')[0].slice(0, 5)]),
);

/** Ult id stubs (not selectable yet). */
export function ultimateIdStubs(weaponId) {
  const d = weaponDef(weaponId);
  if (!d || d.category !== 'primary') return [];
  const out = [];
  for (let b = 0; b < d.branches; b++) {
    const letter = String.fromCharCode(65 + b);
    for (let u = 1; u <= d.ultsPerBranch; u++) {
      out.push(`${d.id}_${letter}_U${u}`);
    }
  }
  return out;
}

/* —— WEAPONS-BRANCH-PICK-001 (v0.9.54) —— */

/** Unlock branch pick after this weapon level (design). */
export const BRANCH_UNLOCK_LV = 3;
/** Primary only: unlock ult pick after this level (needs branch first). */
export const ULT_UNLOCK_LV = 5;

export function branchLetter(index) {
  return String.fromCharCode(65 + (index | 0));
}

export function branchIndex(letter) {
  if (!letter || typeof letter !== 'string') return -1;
  const c = letter.toUpperCase().charCodeAt(0) - 65;
  return c >= 0 && c < 26 ? c : -1;
}

/** List branch options for a catalog weapon. */
export function branchOptions(weaponId) {
  const d = weaponDef(weaponId);
  if (!d) return [];
  const names = d.branchNames || [];
  const n = d.branches || names.length || 0;
  const out = [];
  for (let i = 0; i < n; i++) {
    const letter = branchLetter(i);
    const zh = names[i] || `分支 ${letter}`;
    out.push({
      letter,
      index: i,
      zh,
      en: `PATH ${letter}`,
      descZh: `鎖定「${d.zh}」· ${zh}`,
      descEn: `Lock ${d.en} · ${letter}`,
    });
  }
  return out;
}

/** Ult options for a primary after branch is chosen. */
export const ULT_STUB_LABELS = Object.freeze({
  U1: { zh: '形態一', en: 'FORM I' },
  U2: { zh: '形態二', en: 'FORM II' },
});

export function ultOptions(weaponId, branch) {
  const d = weaponDef(weaponId);
  if (!d || d.category !== 'primary' || !d.ultsPerBranch) return [];
  const bi = branchIndex(branch);
  if (bi < 0 || bi >= d.branches) return [];
  const letter = branchLetter(bi);
  const bName = (d.branchNames && d.branchNames[bi]) || letter;
  const out = [];
  for (let u = 1; u <= d.ultsPerBranch; u++) {
    const key = `U${u}`;
    const stub = ULT_STUB_LABELS[key] || { zh: key, en: key };
    out.push({
      key,
      id: `${d.id}_${letter}_${key}`,
      letter,
      zh: `${bName} · ${stub.zh}`,
      en: `${letter} · ${stub.en}`,
      descZh: `大招 ${key}（數值加成；完整招式後續）`,
      descEn: `Ultimate ${key} (stat bonus; full kit later)`,
    });
  }
  return out;
}

/**
 * Light playable stat mods for a chosen branch (+ optional ult).
 * Keep small — full unique behaviors later.
 */
export function branchStatMods(weaponId, branch, ult) {
  const d = weaponDef(weaponId);
  const mods = { dmgMul: 1, cdMul: 1, pierceAdd: 0 };
  if (!d || !branch) return mods;
  const letter = String(branch).toUpperCase();
  const cat = d.category;

  // Generic by letter — readable in try without inventing whole kits
  if (cat === 'primary') {
    if (letter === 'A') { mods.cdMul = 0.88; mods.dmgMul = 1.05; }
    else if (letter === 'B') { mods.dmgMul = 1.18; mods.pierceAdd = 1; }
    else if (letter === 'C') { mods.dmgMul = 0.92; mods.cdMul = 0.94; } // spray / utility bias
  } else if (cat === 'secondary' || cat === 'throw') {
    if (letter === 'A') { mods.dmgMul = 1.12; }
    else if (letter === 'B') { mods.cdMul = 0.88; }
  }

  if (ult === 'U1') mods.dmgMul *= 1.2;
  else if (ult === 'U2') mods.cdMul *= 0.85;

  return mods;
}

/** Synthetic level-card choices for branch pick UI. */
export function buildBranchOfferCards(weaponId) {
  const d = weaponDef(weaponId);
  if (!d) return null;
  const opts = branchOptions(weaponId);
  if (!opts.length) return null;
  return {
    kind: 'branch',
    weaponId: d.id,
    choices: opts.map((o) => ({
      id: `_branch_${d.id}_${o.letter}`,
      weaponId: d.id,
      branch: o.letter,
      pickupAction: 'branch',
      kind: 'weapon',
      zh: `${o.letter} · ${o.zh}`,
      en: o.en,
      descZh: o.descZh,
      descEn: o.descEn,
      icon: d.icon,
      apply() { /* applied via Game.applyCard branch action */ },
    })),
  };
}

/** Synthetic level-card choices for ult pick UI (primary). */
export function buildUltOfferCards(weaponId, branch) {
  const d = weaponDef(weaponId);
  if (!d || d.category !== 'primary') return null;
  const opts = ultOptions(weaponId, branch);
  if (!opts.length) return null;
  return {
    kind: 'ult',
    weaponId: d.id,
    branch: String(branch).toUpperCase(),
    choices: opts.map((o) => ({
      id: `_ult_${o.id}`,
      weaponId: d.id,
      branch: o.letter,
      ult: o.key,
      ultId: o.id,
      pickupAction: 'ult',
      kind: 'weapon',
      zh: o.zh,
      en: o.en,
      descZh: o.descZh,
      descEn: o.descEn,
      icon: d.icon,
      apply() { /* applied via Game.applyCard ult action */ },
    })),
  };
}

/** Whether weapon lv crossed unlock and still needs a branch pick. */
export function needsBranchPick(weaponId, taken, branchesMap) {
  const d = weaponDef(weaponId);
  if (!d) return false;
  const id = d.id;
  if (branchesMap && branchesMap[id]) return false;
  return weaponLevel(id, taken) >= BRANCH_UNLOCK_LV;
}

/** Whether primary needs an ult pick. */
export function needsUltPick(weaponId, taken, branchesMap, ultsMap) {
  const d = weaponDef(weaponId);
  if (!d || d.category !== 'primary' || !d.ultsPerBranch) return false;
  const id = d.id;
  if (!branchesMap || !branchesMap[id]) return false;
  if (ultsMap && ultsMap[id]) return false;
  return weaponLevel(id, taken) >= ULT_UNLOCK_LV;
}
