/**
 * Pure muzzle-world helpers (no THREE).
 * Bullet spawn and muzzle-flash VFX must share this once.
 *
 * Per-dir offsets are projected from buildPlayerMech rifle tip `muzzle`
 * from buildPlayerMech tip `muzzle` under bake camera (elev 60°, fov 28, dist 4.1)
 * with gun-layer arm Rx=-0.4; mech yawed per dir (same as bake-capture).
 * Cardinal snap only — not 360° smooth (honest gap).
 */

export const HORN_MUZZLE_BY_DIR = {
  n: { uv: [0.7259, 0.9579], world: [0.3136, 0.9556, 0.8593] },
  e: { uv: [0.0000, 0.6305], world: [0.8593, 0.9556, -0.3136] },
  s: { uv: [0.3358, 0.1190], world: [-0.3136, 0.9556, -0.8593] },
  w: { uv: [0.9926, 0.3310], world: [-0.8593, 0.9556, 0.3136] },
};

/** Map aim/move vector → 4-dir key. 0 = +Z (n), +X = e. */
export function yawToCardinal(x, z) {
  const a = Math.atan2(x || 0, z || 0);
  const t = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  if (t < Math.PI / 4 || t >= 7 * Math.PI / 4) return 'n';
  if (t < 3 * Math.PI / 4) return 'e';
  if (t < 5 * Math.PI / 4) return 's';
  return 'w';
}

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
