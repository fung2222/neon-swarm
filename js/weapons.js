/**
 * WEAPONS-REDESIGN-001 (v0.9.53) + BRANCH-PICK (v0.9.54) + BRANCH-KITS (v0.9.55).
 * Spec: docs/WEAPONS.md. Deep A/B/C fire deltas; ult still light amp.
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
 * Full catalog. behavior: feel-matched fire path (all 14 live as of WEAPONS-CATALOG-FIRE-LIVE-001 / v0.9.75).
 * Every entry has exemplar:true — no shared-placeholder stub remaining for catalog fire.
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
const BRANCH_KIT_HINTS = Object.freeze({
  gatling: {
    A: { zh: '射速↑·過熱節奏', en: 'RoF↑ · heat cadence' },
    B: { zh: '穿透↑·單發更硬', en: 'Pierce↑ · harder bolts' },
    C: { zh: '三向散射網', en: '3-bolt cone spray' },
  },
  ion_beam: {
    A: { zh: '長充能·高傷穿透', en: 'Long charge · big pierce' },
    B: { zh: '命中後連鎖跳電', en: 'Chain jump on hit' },
    C: { zh: '短充能裂縫切割', en: 'Fast slit · high pierce' },
  },
  tracking_bomb: {
    A: { zh: '一次三枚微彈頭', en: 'Triple micro warheads' },
    B: { zh: '長黏著地雷', en: 'Long stick mine' },
    C: { zh: '疾速追蹤自爆', en: 'Fast seek then pop' },
  },
  vulcan: {
    A: { zh: '更密彈幕', en: 'Denser spray' },
    B: { zh: '燒夷 DoT', en: 'Incendiary DoT' },
    C: { zh: '開火緩移·堡壘精度', en: 'Fortress slow-move aim' },
  },
  zero_laser: {
    A: { zh: '更強寒緩', en: 'Stronger chill' },
    B: { zh: '命中霜爆', en: 'Frost burst on hit' },
    C: { zh: '開火短暫護盾', en: 'Tiny shield on fire' },
  },
  acid_gun: {
    A: { zh: '溶甲更強', en: 'Stronger dissolve' },
    B: { zh: '更大酸池', en: 'Bigger acid puddle' },
  },
  shotgun: {
    A: { zh: '更寬扇面', en: 'Wider cone' },
    B: { zh: '獨頭重彈', en: 'Slug · fewer pellets' },
  },
  slow_gun: {
    A: { zh: '緩速更久', en: 'Longer slow' },
    B: { zh: '更大緩速圈', en: 'Wider slow field' },
  },
  attack_drone: {
    A: { zh: '多一機護衛', en: '+1 escort drone' },
    B: { zh: '單機高傷', en: 'Harder drones' },
  },
  blackhole: {
    A: { zh: '拉力↑', en: 'Stronger pull' },
    B: { zh: '爆破傷害↑', en: 'Crush dmg↑' },
  },
  frag: {
    A: { zh: '高爆傷害', en: 'HE blast' },
    B: { zh: '破片雨', en: 'Shrapnel rain' },
  },
  chill: {
    A: { zh: '更大霜域', en: 'Wider frost' },
    B: { zh: '急凍高傷', en: 'Fast freeze core' },
  },
  flash: {
    A: { zh: '致盲更久', en: 'Longer stun' },
    B: { zh: '更快冷卻', en: 'Shorter CD' },
  },
  gravity: {
    A: { zh: '更強引力', en: 'Stronger pull' },
    B: { zh: '更快坍縮', en: 'Faster crush' },
  },
});

export function branchOptions(weaponId) {
  const d = weaponDef(weaponId);
  if (!d) return [];
  const names = d.branchNames || [];
  const n = d.branches || names.length || 0;
  const hints = BRANCH_KIT_HINTS[d.id] || {};
  const out = [];
  for (let i = 0; i < n; i++) {
    const letter = branchLetter(i);
    const zh = names[i] || `分支 ${letter}`;
    const hint = hints[letter] || {};
    out.push({
      letter,
      index: i,
      zh,
      en: `PATH ${letter}`,
      descZh: hint.zh ? `${zh} — ${hint.zh}` : `鎖定「${d.zh}」· ${zh}`,
      descEn: hint.en ? `${letter}: ${hint.en}` : `Lock ${d.en} · ${letter}`,
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
 * Deep branch kits (v0.9.55 WEAPONS-BRANCH-KITS-001).
 * Distinct fire/behavior deltas per letter; ult stays light amplifier only.
 */
export function branchStatMods(weaponId, branch, ult) {
  const d = weaponDef(weaponId);
  const mods = {
    dmgMul: 1, cdMul: 1, pierceAdd: 0,
    // optional kit flags (0 / false = off)
    boltCount: 1, spreadRad: 0, overheat: false,
    chargeMul: 1, chainJumps: 0, chainRange: 0, slit: false,
    warheads: 1, stickMul: 1, homingMul: 1, seekSpeedMul: 1,
    sprayMul: 1, burn: 0, burnDur: 0, fortressMoveMul: 1, fortressPierce: 0,
    chillMul: 1, frostBurstR: 0, frostBurstDmg: 0, selfShield: 0, selfShieldDur: 0,
    pelletsAdd: 0, aoeMul: 1, poolMul: 1, slowMul: 1, fuseMul: 1, shardsAdd: 0,
    dissolveMul: 1, droneAdd: 0, pullMul: 1, stunMul: 1,
  };
  if (!d || !branch) return mods;
  const letter = String(branch).toUpperCase();
  const id = d.id;

  // —— Primary deep kits (named branches in docs/WEAPONS.md) ——
  if (id === 'gatling') {
    if (letter === 'A') { // 過熱連射 — higher RoF + heat cadence
      mods.cdMul = 0.70; mods.dmgMul = 0.98; mods.overheat = true;
    } else if (letter === 'B') { // 穿甲芯
      mods.dmgMul = 1.14; mods.pierceAdd = 2; mods.cdMul = 1.05;
    } else if (letter === 'C') { // 散射網 — multi-bolt cone
      mods.boltCount = 3; mods.spreadRad = 0.28; mods.dmgMul = 0.72; mods.cdMul = 0.95;
    }
  } else if (id === 'ion_beam') {
    if (letter === 'A') { // 長焦聚焦
      mods.chargeMul = 1.40; mods.dmgMul = 1.38; mods.pierceAdd = 2; mods.cdMul = 1.05;
    } else if (letter === 'B') { // 連鎖跳電
      mods.chainJumps = 2; mods.chainRange = 3.6; mods.dmgMul = 0.92; mods.cdMul = 0.95;
    } else if (letter === 'C') { // 裂縫切割 — short charge, narrow high pierce
      mods.chargeMul = 0.52; mods.pierceAdd = 2; mods.dmgMul = 1.08; mods.slit = true; mods.cdMul = 0.90;
    }
  } else if (id === 'tracking_bomb') {
    if (letter === 'A') { // 三重彈頭
      mods.warheads = 3; mods.dmgMul = 0.62; mods.aoeMul = 0.78; mods.cdMul = 1.05;
    } else if (letter === 'B') { // 黏著地雷
      mods.stickMul = 2.6; mods.aoeMul = 1.15; mods.dmgMul = 1.05; mods.cdMul = 1.08;
    } else if (letter === 'C') { // 自殺無人機 — faster seek then pop
      mods.homingMul = 1.85; mods.seekSpeedMul = 1.35; mods.stickMul = 0.55; mods.dmgMul = 1.08;
    }
  } else if (id === 'vulcan') {
    if (letter === 'A') { // 彈幕風暴
      mods.cdMul = 0.72; mods.dmgMul = 0.88; mods.sprayMul = 1.35; mods.boltCount = 2; mods.spreadRad = 0.18;
    } else if (letter === 'B') { // 燒夷彈
      mods.burn = 1.1; mods.burnDur = 1.6; mods.dmgMul = 0.95; mods.cdMul = 1.02;
    } else if (letter === 'C') { // 機槍堡壘
      mods.fortressMoveMul = 0.42; mods.fortressPierce = 1; mods.pierceAdd = 1;
      mods.dmgMul = 1.22; mods.cdMul = 1.08; mods.spreadRad = -0.08;
    }
  } else if (id === 'zero_laser') {
    if (letter === 'A') { // 絕對零度
      mods.chillMul = 1.85; mods.dmgMul = 1.08; mods.cdMul = 1.02;
    } else if (letter === 'B') { // 霜爆裂縫
      mods.frostBurstR = 2.2; mods.frostBurstDmg = 1.4; mods.dmgMul = 0.95; mods.chillMul = 1.15;
    } else if (letter === 'C') { // 寒晶護盾 — tiny self-shield on fire cadence
      mods.selfShield = 1.25; mods.selfShieldDur = 0.40; mods.dmgMul = 0.96; mods.cdMul = 1.05;
    }
  } else if (d.category === 'secondary') {
    // Cheap A/B deepen — distinct mods, no new weapons
    if (id === 'acid_gun') {
      if (letter === 'A') { mods.dissolveMul = 1.45; mods.dmgMul = 1.10; }
      else if (letter === 'B') { mods.aoeMul = 1.40; mods.cdMul = 0.92; mods.poolMul = 0.9; }
    } else if (id === 'shotgun') {
      if (letter === 'A') { mods.pelletsAdd = 4; mods.spreadRad = 0.18; mods.dmgMul = 0.88; }
      else if (letter === 'B') { mods.pelletsAdd = -5; mods.dmgMul = 1.55; mods.pierceAdd = 1; mods.spreadRad = -0.25; }
    } else if (id === 'slow_gun') {
      if (letter === 'A') { mods.slowMul = 1.45; mods.dmgMul = 1.05; }
      else if (letter === 'B') { mods.aoeMul = 1.35; mods.cdMul = 0.90; }
    } else if (id === 'attack_drone') {
      if (letter === 'A') { mods.droneAdd = 1; mods.cdMul = 1.08; }
      else if (letter === 'B') { mods.dmgMul = 1.35; mods.cdMul = 0.92; }
    } else if (id === 'blackhole') {
      if (letter === 'A') { mods.pullMul = 1.35; mods.aoeMul = 1.15; }
      else if (letter === 'B') { mods.dmgMul = 1.30; mods.cdMul = 0.90; }
    } else {
      if (letter === 'A') mods.dmgMul = 1.12;
      else if (letter === 'B') mods.cdMul = 0.88;
    }
  } else if (d.category === 'throw') {
    if (id === 'frag') {
      if (letter === 'A') { mods.dmgMul = 1.28; mods.aoeMul = 1.12; }
      else if (letter === 'B') { mods.shardsAdd = 4; mods.aoeMul = 1.20; mods.dmgMul = 0.92; }
    } else if (id === 'chill') {
      if (letter === 'A') { mods.aoeMul = 1.30; mods.slowMul = 1.25; }
      else if (letter === 'B') { mods.dmgMul = 1.35; mods.fuseMul = 0.75; mods.slowMul = 1.15; }
    } else if (id === 'flash') {
      if (letter === 'A') { mods.stunMul = 1.40; mods.aoeMul = 1.15; }
      else if (letter === 'B') { mods.cdMul = 0.82; mods.stunMul = 0.9; }
    } else if (id === 'gravity') {
      if (letter === 'A') { mods.pullMul = 1.40; mods.aoeMul = 1.15; }
      else if (letter === 'B') { mods.dmgMul = 1.30; mods.fuseMul = 0.80; }
    } else {
      if (letter === 'A') mods.dmgMul = 1.12;
      else if (letter === 'B') mods.cdMul = 0.88;
    }
  }

  // Ult = light amplifier only (not full unique kits this beat)
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
