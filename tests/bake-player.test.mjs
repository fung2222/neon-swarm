/**
 * Baked protagonist vertical slice — atlas + 8-dir helper + mech lock.
 * Run: node tests/bake-player.test.mjs
 */
import assert from 'assert';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { isMechPlayable, MECH_BY_ID } from '../js/config.js';
import { yawToCardinal, HORN_MUZZLE_BY_DIR, DIRS8 } from '../js/muzzle.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHEETS = join(ROOT, 'assets/mechs/horn/sheets');

// ---- atlas present ----
{
  const atlasPath = join(SHEETS, 'horn_atlas.json');
  assert.ok(existsSync(atlasPath), 'horn_atlas.json missing');
  const atlas = JSON.parse(readFileSync(atlasPath, 'utf8'));
  assert.equal(atlas.id, 'horn');
  assert.equal(atlas.source, 'buildPlayerMech (js/mech-builder.js)');
  assert.ok(atlas.implemented);
  assert.deepEqual(atlas.dirs, DIRS8);
  assert.equal(atlas.frames, 4);
  assert.ok(atlas.anchors.foot);
  assert.ok(atlas.anchors.pivot);
  assert.ok(atlas.anchors.muzzle);
  assert.ok(atlas.cells.length >= 56, 'expected 8-dir idle/run/gun/hurt/death cells (≥56)');
  assert.equal(atlas.cells.length, 64, '8 dirs × (1 idle + 4 run + 1 gun + 1 hurt + 1 death) = 64');
  for (const c of atlas.cells) {
    assert.ok(existsSync(join(SHEETS, c.file)), 'missing cell ' + c.file);
  }
  // Gun layer present for every octant
  for (const d of DIRS8) {
    assert.ok(existsSync(join(SHEETS, `horn_${d}_gun_00_gun.png`)), 'missing gun ' + d);
  }
  console.log('atlas + cells OK', atlas.cells.length);
}

// ---- yaw / muzzle from shared muzzle.js (not a copied mirror) ----
{
  assert.equal(yawToCardinal(0, 1), 'n');
  assert.equal(yawToCardinal(1, 0), 'e');
  assert.equal(yawToCardinal(0, -1), 's');
  assert.equal(yawToCardinal(-1, 0), 'w');
  assert.equal(yawToCardinal(0.7, 0.7), 'ne');
  assert.equal(yawToCardinal(0.1, 1), 'n');
  assert.equal(yawToCardinal(1, 0.1), 'e');
  assert.equal(new Set(Object.values(HORN_MUZZLE_BY_DIR).map((e) => e.world.join(','))).size, 8);
  const atlas = JSON.parse(readFileSync(join(SHEETS, 'horn_atlas.json'), 'utf8'));
  assert.equal(atlas.version, '0.9.27');
  assert.ok(atlas.muzzleWorldByDir);
  assert.equal(new Set(Object.values(atlas.muzzleWorldByDir).map((w) => w.join(','))).size, 8);
  // Runtime table matches atlas
  for (const d of DIRS8) {
    assert.deepEqual(HORN_MUZZLE_BY_DIR[d].world, atlas.muzzleWorldByDir[d]);
    assert.deepEqual(HORN_MUZZLE_BY_DIR[d].uv, atlas.anchorsByDir[d].muzzle);
  }
  console.log('yawToCardinal 8-dir + atlas per-dir muzzle OK');
}

// ---- old PNG fallback files still on disk ----
{
  for (const f of ['mech_idle.png', 'mech_move_1.png', 'mech_move_2.png', 'mech_attack.png', 'mech_hit.png']) {
    assert.ok(existsSync(join(ROOT, 'assets/sprites', f)), f);
  }
  console.log('PNG fallback assets present');
}

// ---- playable lock ----
{
  assert.equal(isMechPlayable('horn'), true);
  assert.equal(isMechPlayable('heavy'), false);
  assert.equal(isMechPlayable('prototype'), false);
  assert.ok(MECH_BY_ID.heavy.comingSoon);
  console.log('mech lock OK');
}

console.log('bake-player tests passed');
