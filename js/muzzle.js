/**
 * Pure muzzle-world helpers (no THREE).
 * Bullet spawn and muzzle-flash VFX must share this once.
 *
 * Per-dir offsets are projected from buildPlayerMech rifle tip `muzzle`
 * under bake camera (elev 60°, fov 28, dist 4.1)
 * with gun-layer arm Rx=-0.4; mech yawed per dir (same as bake-capture).
 * 8-dir sector snap (N/NE/E/SE/S/SW/W/NW) — not continuous 360° turret (honest gap).
 */

/** Ordered octants: 0=+Z (n), clockwise toward +X (e). */
export const DIRS8 = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
export const DIRS4 = ['n', 'e', 's', 'w'];

/** Synced from horn_atlas.json bake (v0.9.187 8-dir). */
export const HORN_MUZZLE_BY_DIR = {
  n: { uv: [0.6532, 0.9955], world: [0.2156, 0.8866, 0.8844] },
  ne: { uv: [0.1716, 0.9257], world: [0.7778, 0.8866, 0.4729] },
  e: { uv: [-0.0490, 0.6037], world: [0.8844, 0.8866, -0.2156] },
  se: { uv: [0.0726, 0.2917], world: [0.4729, 0.8866, -0.7778] },
  s: { uv: [0.3891, 0.1372], world: [-0.2156, 0.8866, -0.8844] },
  sw: { uv: [0.7473, 0.1753], world: [-0.7778, 0.8866, -0.4729] },
  w: { uv: [1.0078, 0.3995], world: [-0.8844, 0.8866, 0.2156] },
  nw: { uv: [1.0075, 0.7421], world: [-0.4729, 0.8866, 0.7778] },
};

/**
 * Map aim/move vector → 8-dir key (sector snap).
 * 0 = +Z (n), +X = e. Sectors centered on each octant, width π/4.
 * Name kept as yawToCardinal for call-site compatibility; returns octants too.
 */
export function yawToCardinal(x, z) {
  const a = Math.atan2(x || 0, z || 0);
  const t = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const idx = Math.floor(((t + Math.PI / 8) % (Math.PI * 2)) / (Math.PI / 4)) % 8;
  return DIRS8[idx];
}

/** Alias — explicit 8-dir name for new call sites. */
export const yawToOctant = yawToCardinal;

/**
 * World-space muzzle from recorded per-dir projections.
 * @param {number} px
 * @param {number} pz
 * @param {number} aimX
 * @param {number} aimZ
 * @param {object} [opts]
 * @param {Record<string,{world:number[]}>} [opts.byDir] override table
 * @param {string} [opts.mechId]
 * @returns {{ x:number, y:number, z:number, dir:string }}
 */
export function muzzleWorld(px, pz, aimX, aimZ, opts = {}) {
  const byDir = opts.byDir || HORN_MUZZLE_BY_DIR;
  const dir = yawToCardinal(aimX, aimZ);
  const entry = byDir[dir] || byDir.n;
  const w = entry.world || [0, 0.95, 0.72];
  return {
    x: px + (w[0] || 0),
    y: w[1] != null ? w[1] : 0.95,
    z: pz + (w[2] || 0),
    dir,
  };
}

/** Normalized UV anchors per dir (atlas / sheets metadata). */
export function muzzleUvAnchors(byDir = HORN_MUZZLE_BY_DIR) {
  const out = {};
  for (const [d, e] of Object.entries(byDir)) {
    out[d] = {
      foot: [0.5, 0.92],
      pivot: [0.5, 0.52],
      muzzle: e.uv ? e.uv.slice() : [0.68, 0.48],
    };
  }
  return out;
}
