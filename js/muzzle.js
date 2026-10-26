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

/** Synced from horn_atlas.json bake (v0.9.27 8-dir). */
export const HORN_MUZZLE_BY_DIR = {
  n: { uv: [0.6514, 0.9685], world: [0.2156, 0.8796, 0.8406] },
  ne: { uv: [0.1957, 0.9081], world: [0.7469, 0.8796, 0.4420] },
  e: { uv: [-0.0210, 0.6061], world: [0.8406, 0.8796, -0.2156] },
  se: { uv: [0.0881, 0.3068], world: [0.4420, 0.8796, -0.7469] },
  s: { uv: [0.3885, 0.1554], world: [-0.2156, 0.8796, -0.8406] },
  sw: { uv: [0.7319, 0.1893], world: [-0.7469, 0.8796, -0.4420] },
  w: { uv: [0.9819, 0.4021], world: [-0.8406, 0.8796, 0.2156] },
  nw: { uv: [0.9835, 0.7271], world: [-0.4420, 0.8796, 0.7469] },
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
