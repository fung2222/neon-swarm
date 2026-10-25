/**
 * Shared muzzle helper — per-dir world offsets, not identical 4-dir estimate.
 * Run: node tests/muzzle.test.mjs
 */
import assert from 'assert';
import { yawToCardinal, muzzleWorld, HORN_MUZZLE_BY_DIR, muzzleUvAnchors } from '../js/muzzle.js';

{
  assert.equal(yawToCardinal(0, 1), 'n');
  assert.equal(yawToCardinal(1, 0), 'e');
  assert.equal(yawToCardinal(0, -1), 's');
  assert.equal(yawToCardinal(-1, 0), 'w');
  assert.equal(yawToCardinal(0.7, 0.7), 'e'); // diagonal snaps (honest gap)
  console.log('yawToCardinal OK');
}

{
  const dirs = ['n', 'e', 's', 'w'];
  const worlds = dirs.map((d) => HORN_MUZZLE_BY_DIR[d].world.join(','));
  assert.equal(new Set(worlds).size, 4, 'per-dir world offsets must differ');
  const uvs = dirs.map((d) => HORN_MUZZLE_BY_DIR[d].uv.join(','));
  assert.equal(new Set(uvs).size, 4, 'per-dir UV anchors must differ');
  console.log('per-dir muzzle uniqueness OK');
}

{
  const n = muzzleWorld(0, 0, 0, 1);
  const e = muzzleWorld(0, 0, 1, 0);
  const s = muzzleWorld(0, 0, 0, -1);
  const w = muzzleWorld(0, 0, -1, 0);
  assert.equal(n.dir, 'n');
  assert.equal(e.dir, 'e');
  assert.equal(s.dir, 's');
  assert.equal(w.dir, 'w');
  assert.ok(Math.abs(n.x - HORN_MUZZLE_BY_DIR.n.world[0]) < 1e-9);
  assert.ok(Math.abs(e.x - HORN_MUZZLE_BY_DIR.e.world[0]) < 1e-9);
  // move-while-firing: player offset applies
  const moved = muzzleWorld(3, -2, 1, 0);
  assert.ok(Math.abs(moved.x - (3 + HORN_MUZZLE_BY_DIR.e.world[0])) < 1e-9);
  assert.ok(Math.abs(moved.z - (-2 + HORN_MUZZLE_BY_DIR.e.world[2])) < 1e-9);
  // diagonal
  const diag = muzzleWorld(0, 0, -0.7, 0.7);
  assert.ok(['n', 'w'].includes(diag.dir));
  console.log('muzzleWorld N/E/S/W + move + diagonal OK');
}

{
  const a = muzzleUvAnchors();
  assert.deepEqual(a.n.muzzle, HORN_MUZZLE_BY_DIR.n.uv);
  assert.deepEqual(a.e.muzzle, HORN_MUZZLE_BY_DIR.e.uv);
  console.log('muzzleUvAnchors OK');
}

console.log('muzzle tests passed');
