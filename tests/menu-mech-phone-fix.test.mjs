/**
 * PHONE-MENU-BLACK-001 (v0.9.200) / MENU-MECH-PHONE-FIX-001 (v0.9.199)
 * Menu showcase = buildPlayerMech; Mixamo off boot path (HORN_TRUE_3D=false).
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
  return m && Number(m[1]) >= 200;
})(), 'soft-pin ≥0.9.200');

// Flag off for this tip
assert.ok(/export const HORN_TRUE_3D\s*=\s*false/.test(q3d), 'HORN_TRUE_3D=false');
assert.ok(q3d.includes('PHONE-MENU-BLACK'), 'PHONE-MENU-BLACK comment');

// Boot must NOT call preloadMixamoHero
assert.ok(!/await\s+Promise\.race\(\s*\[\s*preloadMixamoHero/.test(main), 'boot does not await preloadMixamoHero');
assert.ok(!/^import\s+\{\s*preloadMixamoHero\s*\}/m.test(main), 'main does not import preloadMixamoHero');
assert.ok(main.includes('PHONE-MENU-BLACK'), 'main documents pause');

// Menu: setMenuMech must call buildPlayerMech and must NOT call buildMixamoPlayer
const setStart = view.indexOf('setMenuMech(id)');
const setEnd = view.indexOf('\n  updateMenuLayout(viewportWidth', setStart);
const setMenu = view.slice(setStart, setEnd);
assert.ok(setMenu.includes('buildPlayerMech'), 'menu uses buildPlayerMech');
assert.ok(!setMenu.includes('buildMixamoPlayer'), 'menu does not use Mixamo');
assert.ok(!setMenu.includes('mixamoReady'), 'menu does not gate on mixamoReady');
assert.ok(setMenu.includes('try') && setMenu.includes('catch'), 'setMenuMech try/catch');
assert.ok(setMenu.includes('console.warn'), 'setMenuMech warns on fail');

// Combat Mixamo path still present (paused by flag) with try/catch fallback
assert.ok(sprites.includes('buildMixamoPlayer') && sprites.includes('try {'), 'sprites Mixamo try');
assert.ok(sprites.includes('baked fallback') || sprites.includes('Mixamo player build failed'), 'sprites catch fallback');

assert.ok(existsSync(join(root, 'assets/mechs/horn/q-hero-mixamo-walk.play.glb')), 'play.glb kept');
assert.ok(agent.includes('PHONE-MENU-BLACK') || agent.includes('0.9.200'), 'agent tip');
assert.ok(agent.includes('HOLD') || agent.includes('肉眼'), 'HOLD');
assert.ok(agent.includes('Phase 4') && agent.includes('HARD BAN'), 'bans');

console.log('menu-mech-phone-fix.test.mjs: PASS');
