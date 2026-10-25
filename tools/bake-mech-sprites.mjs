#!/usr/bin/env node
/**
 * Phase 1 stub — bake contract for mech sprite sheets.
 * Full headless WebGL capture lands with Phase 3; this CLI documents the interface.
 *
 * Usage:
 *   node tools/bake-mech-sprites.mjs --id horn --dirs 4 --actions idle,run --dry-run
 *   node tools/bake-mech-sprites.mjs --help
 *
 * Output (when implemented):
 *   assets/mechs/{id}/sheets/{id}_{dir}_{action}_{frame}.png
 *   assets/mechs/{id}/sheets/{id}_anchors.json
 *
 * Source of truth: js/view.js buildPlayerMech(cfg) (or future GLB at assets/mechs/{id}/source.glb)
 * See docs/render-pipeline.md
 */

import { parseArgs } from 'node:util';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const DIRS4 = ['n', 'e', 's', 'w'];
const DIRS8 = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

function help() {
  console.log(`bake-mech-sprites (Phase 1 stub)

  --id <horn|heavy|prototype>   Mech id (default: horn)
  --dirs <4|8>                  Direction count (default: 4)
  --actions <csv>               idle,run,aim,fire,hurt,death (default: idle,run)
  --frames <n>                  Frames per run cycle (default: 4)
  --size <px>                   Cell size (default: 256)
  --out <dir>                   Output root (default: assets/mechs/<id>/sheets)
  --dry-run                     Print plan only; write a manifest JSON under tools/.cache
  --help                        This text

Contract: camera elevation ~60°, foot baseline shared, muzzle + pivot in anchors JSON.
Real WebGL bake is NOT implemented in Phase 1 — do not claim sprites were rendered.
`);
}

const { values } = parseArgs({
  options: {
    id: { type: 'string', default: 'horn' },
    dirs: { type: 'string', default: '4' },
    actions: { type: 'string', default: 'idle,run' },
    frames: { type: 'string', default: '4' },
    size: { type: 'string', default: '256' },
    out: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
  strict: false,
});

if (values.help) {
  help();
  process.exit(0);
}

const id = values.id || 'horn';
const dirCount = Number(values.dirs) === 8 ? 8 : 4;
const dirs = dirCount === 8 ? DIRS8 : DIRS4;
const actions = String(values.actions || 'idle,run').split(',').map((s) => s.trim()).filter(Boolean);
const frames = Math.max(1, Number(values.frames) || 4);
const size = Math.max(64, Number(values.size) || 256);
const outDir = values.out || join(ROOT, 'assets', 'mechs', id, 'sheets');
const dry = !!values['dry-run'];

const plan = [];
for (const action of actions) {
  const nFrames = action === 'run' || action === 'runfire' ? frames : 1;
  for (const dir of dirs) {
    for (let f = 0; f < nFrames; f++) {
      const name = `${id}_${dir}_${action}_${String(f).padStart(2, '0')}.png`;
      plan.push({
        file: join(outDir, name),
        id, dir, action, frame: f,
        camera: { elevationDeg: 60, characterHeightFrac: 0.75, cell: size },
        anchors: { foot: [0.5, 0.92], pivot: [0.5, 0.55], muzzle: [0.72, 0.48] },
      });
    }
  }
}

const manifest = {
  version: '0.9.0-phase1-stub',
  implemented: false,
  source: 'buildPlayerMech (js/view.js) — GLB swap later at assets/mechs/{id}/source.glb',
  id, dirCount, actions, frames, size, outDir,
  cells: plan.length,
  plan: plan.map((p) => ({
    file: p.file.replace(ROOT + '/', ''),
    dir: p.dir, action: p.action, frame: p.frame,
  })),
  note: 'Phase 1 stub only. Run a real headless Three.js capture in Phase 3 before writing PNGs.',
};

console.log(JSON.stringify(manifest, null, 2));

if (dry) {
  const cacheDir = join(ROOT, 'tools', '.cache');
  mkdirSync(cacheDir, { recursive: true });
  const manPath = join(cacheDir, `bake-plan-${id}.json`);
  writeFileSync(manPath, JSON.stringify(manifest, null, 2));
  console.error(`[bake-mech-sprites] dry-run manifest → ${manPath.replace(ROOT + '/', '')}`);
  process.exit(0);
}

console.error('[bake-mech-sprites] ERROR: real bake not implemented in Phase 1.');
console.error('Re-run with --dry-run to emit the contract manifest, or wait for Phase 3.');
process.exit(2);
