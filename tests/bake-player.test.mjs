/**
 * Baked protagonist vertical slice — atlas + cardinal helper + mech lock.
 * Run: node tests/bake-player.test.mjs
 */
import assert from 'assert';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { isMechPlayable, MECH_BY_ID } from '../js/config.js';
import { yawToCardinal, HORN_MUZZLE_BY_DIR } from '../js/muzzle.js';

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
  assert.deepEqual(atlas.dirs, ['n', 'e', 's', 'w']);
  assert.equal(atlas.frames, 4);
  assert.ok(atlas.anchors.foot);
  assert.ok(atlas.anchors.pivot);
  assert.ok(atlas.anchors.muzzle);
  assert.ok(atlas.cells.length >= 28, 'expected idle/run/gun/hurt/death cells');
  for (const c of atlas.cells) {
    assert.ok(existsSync(join(SHEETS, c.file)), 'missing cell ' + c.file);
  }
  console.log('atlas + cells OK', atlas.cells.length);
}

// ---- yaw / muzzle from shared muzzle.js (not a copied mirror) ----
{
  assert.equal(yawToCardinal(0, 1), 'n');
  assert.equal(yawToCardinal(1, 0), 'e');
  assert.equal(yawToCardinal(0, -1), 's');
  assert.equal(yawToCardinal(-1, 0), 'w');
  assert.equal(yawToCardinal(0.1, 1), 'n');
  assert.equal(yawToCardinal(1, 0.1), 'e');
  assert.equal(new Set(Object.values(HORN_MUZZLE_BY_DIR).map((e) => e.world.join(','))).size, 4);
  const atlas = JSON.parse(readFileSync(join(SHEETS, 'horn_atlas.json'), 'utf8'));
  assert.equal(atlas.version, '0.9.2');
  assert.ok(atlas.muzzleWorldByDir);
  assert.equal(new Set(Object.values(atlas.muzzleWorldByDir).map((w) => w.join(','))).size, 4);
  console.log('yawToCardinal + atlas per-dir muzzle OK');
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
