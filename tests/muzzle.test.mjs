/**
 * Shared muzzle helper — per-dir world offsets, 8-dir sector snap (not 360°).
 * Run: node tests/muzzle.test.mjs
 */
import assert from 'assert';
import { yawToCardinal, muzzleWorld, HORN_MUZZLE_BY_DIR, muzzleUvAnchors, DIRS8 } from '../js/muzzle.js';

{
  assert.equal(yawToCardinal(0, 1), 'n');
  assert.equal(yawToCardinal(1, 0), 'e');
  assert.equal(yawToCardinal(0, -1), 's');
  assert.equal(yawToCardinal(-1, 0), 'w');
  assert.equal(yawToCardinal(0.7, 0.7), 'ne'); // 8-dir: diagonal is its own sector
  assert.equal(yawToCardinal(0.7, -0.7), 'se');
  assert.equal(yawToCardinal(-0.7, -0.7), 'sw');
  assert.equal(yawToCardinal(-0.7, 0.7), 'nw');
  console.log('yawToCardinal 8-dir OK');
}

{
  assert.deepEqual(DIRS8, ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']);
  const worlds = DIRS8.map((d) => HORN_MUZZLE_BY_DIR[d].world.join(','));
  assert.equal(new Set(worlds).size, 8, 'per-dir world offsets must differ across 8 dirs');
  const uvs = DIRS8.map((d) => HORN_MUZZLE_BY_DIR[d].uv.join(','));
  assert.equal(new Set(uvs).size, 8, 'per-dir UV anchors must differ across 8 dirs');
  console.log('per-dir muzzle uniqueness OK (8)');
}

{
  const n = muzzleWorld(0, 0, 0, 1);
  const e = muzzleWorld(0, 0, 1, 0);
  const s = muzzleWorld(0, 0, 0, -1);
  const w = muzzleWorld(0, 0, -1, 0);
  const ne = muzzleWorld(0, 0, 0.7, 0.7);
  assert.equal(n.dir, 'n');
  assert.equal(e.dir, 'e');
  assert.equal(s.dir, 's');
  assert.equal(w.dir, 'w');
  assert.equal(ne.dir, 'ne');
  assert.ok(Math.abs(n.x - HORN_MUZZLE_BY_DIR.n.world[0]) < 1e-9);
  assert.ok(Math.abs(e.x - HORN_MUZZLE_BY_DIR.e.world[0]) < 1e-9);
  assert.ok(Math.abs(ne.x - HORN_MUZZLE_BY_DIR.ne.world[0]) < 1e-9);
  // move-while-firing: player offset applies
  const moved = muzzleWorld(3, -2, 1, 0);
  assert.ok(Math.abs(moved.x - (3 + HORN_MUZZLE_BY_DIR.e.world[0])) < 1e-9);
  assert.ok(Math.abs(moved.z - (-2 + HORN_MUZZLE_BY_DIR.e.world[2])) < 1e-9);
  console.log('muzzleWorld 8-dir + move OK');
}

{
  const a = muzzleUvAnchors();
  assert.deepEqual(a.n.muzzle, HORN_MUZZLE_BY_DIR.n.uv);
  assert.deepEqual(a.ne.muzzle, HORN_MUZZLE_BY_DIR.ne.uv);
  assert.deepEqual(a.e.muzzle, HORN_MUZZLE_BY_DIR.e.uv);
  console.log('muzzleUvAnchors OK');
}

console.log('muzzle tests passed');
