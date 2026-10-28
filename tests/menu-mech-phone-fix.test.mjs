/**
 * MENU-MECH-PHONE-FIX-001 (v0.9.199)
 * Menu showcase must always use buildPlayerMech (never Mixamo on turntable).
 * Combat keeps Mixamo with try/catch → baked fallback.
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

assert.ok((() => {
  const m = html.match(/\?v=0\.9\.(\d+)/);
  return m && Number(m[1]) >= 199;
})(), 'soft-pin ≥0.9.199');

// Menu: setMenuMech must call buildPlayerMech and must NOT call buildMixamoPlayer
const setMenu = view.slice(view.indexOf('setMenuMech('), view.indexOf('updateMenuLayout('));
assert.ok(setMenu.includes('buildPlayerMech'), 'menu uses buildPlayerMech');
assert.ok(!setMenu.includes('buildMixamoPlayer'), 'menu does not use Mixamo');
assert.ok(!setMenu.includes('mixamoReady'), 'menu does not gate on mixamoReady');

// Combat path still has Mixamo with try/catch
assert.ok(sprites.includes('buildMixamoPlayer') && sprites.includes('try {'), 'sprites Mixamo try');
assert.ok(sprites.includes('baked fallback') || sprites.includes('Mixamo player build failed'), 'sprites catch fallback');

// Hardening in q-hero-3d
assert.ok(q3d.includes('MIXAMO_FIT_H'), 'FIT_H defined');
assert.ok(q3d.includes('setFromObject') || q3d.includes('Box3'), 'height fit Box3');
assert.ok(q3d.includes('zero meshes') || q3d.includes('zero mesh'), 'zero-mesh validate');
assert.ok(q3d.includes('buildMixamoPlayer failed') || q3d.includes('catch (err)'), 'build try/catch');
assert.ok(q3d.includes('m.map && m.map.isTexture') || q3d.includes('m.map) m.map.colorSpace'), 'map guard');

assert.ok(existsSync(join(root, 'assets/mechs/horn/q-hero-mixamo-walk.play.glb')), 'play.glb kept');
assert.ok(agent.includes('MENU-MECH-PHONE-FIX') || agent.includes('0.9.199'), 'agent tip');
assert.ok(agent.includes('HOLD') || agent.includes('肉眼'), 'HOLD');
assert.ok(agent.includes('Phase 4') && agent.includes('HARD BAN'), 'bans');

console.log('menu-mech-phone-fix.test.mjs: PASS');
