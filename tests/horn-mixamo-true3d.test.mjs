/**
 * HORN-MIXAMO-TRUE3D-001 (v0.9.198)
 */
import assert from 'assert';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const agent = readFileSync(join(root, 'docs/AGENT_TASK.md'), 'utf8');
const q3d = readFileSync(join(root, 'js/q-hero-3d.js'), 'utf8');
const sprites = readFileSync(join(root, 'js/sprites.js'), 'utf8');
const view = readFileSync(join(root, 'js/view.js'), 'utf8');
const main = readFileSync(join(root, 'js/main.js'), 'utf8');

assert.ok((() => {
  const m = html.match(/\?v=0\.9\.(\d+)/);
  return m && Number(m[1]) >= 198;
})(), 'soft-pin ≥0.9.198');

assert.ok(existsSync(join(root, 'assets/mechs/horn/q-hero-mixamo-walk.play.glb')), 'play.glb');
assert.ok(existsSync(join(root, 'vendor/cyber-kit/three/addons/loaders/GLTFLoader.js')), 'GLTFLoader');
assert.ok(existsSync(join(root, 'vendor/cyber-kit/three/addons/libs/meshopt_decoder.module.js')), 'meshopt');
assert.ok(existsSync(join(root, 'vendor/cyber-kit/three/addons/utils/SkeletonUtils.js')), 'SkeletonUtils');

assert.ok(q3d.includes('HORN_TRUE_3D') && q3d.includes('buildMixamoPlayer') && q3d.includes('AnimationMixer'), 'q-hero-3d API');
assert.ok(q3d.includes('q-hero-mixamo-walk.play.glb'), 'play url');
assert.ok(sprites.includes('buildMixamoPlayer') && sprites.includes('mixamoReady'), 'sprites Mixamo path');
assert.ok(view.includes('syncMixamoPlayer') && view.includes('isMixamo3d'), 'view Mixamo sync');
// v0.9.200: Mixamo paused — boot must NOT call preload; flag false; API still present
assert.ok(/export const HORN_TRUE_3D\s*=\s*false/.test(q3d), 'HORN_TRUE_3D paused false');
assert.ok(q3d.includes('preloadMixamoHero'), 'preload API kept');
assert.ok(!/await\s+Promise\.race\(\s*\[\s*preloadMixamoHero/.test(main), 'boot does not preload');

assert.ok(agent.includes('HORN-MIXAMO-TRUE3D') || agent.includes('Mixamo'), 'agent tip');
assert.ok(agent.includes('HOLD') || agent.includes('肉眼'), 'HOLD');
assert.ok(agent.includes('Phase 4') && agent.includes('HARD BAN'), 'bans');

console.log('horn-mixamo-true3d.test.mjs: PASS');
