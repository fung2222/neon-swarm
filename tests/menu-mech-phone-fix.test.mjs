/**
 * PHONE-MENU-CTA-VISIBLE-001 (v0.9.202)
 * Black canvas = phone CSS radial crush; dead Start = #mech-stage covering CTA.
 * Menu = buildPlayerMech; boot graph must NOT import q-hero-3d.js / meshopt.
 */
import assert from 'assert';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const agent = readFileSync(join(root, 'docs/AGENT_TASK.md'), 'utf8');
const css = readFileSync(join(root, 'css/game.css'), 'utf8');
const flag = readFileSync(join(root, 'js/q-hero-3d-flag.js'), 'utf8');
const q3d = readFileSync(join(root, 'js/q-hero-3d.js'), 'utf8');
const sprites = readFileSync(join(root, 'js/sprites.js'), 'utf8');
const view = readFileSync(join(root, 'js/view.js'), 'utf8');
const main = readFileSync(join(root, 'js/main.js'), 'utf8');

assert.ok((() => {
  const m = html.match(/\?v=0\.9\.(\d+)/);
  return m && Number(m[1]) >= 202;
})(), 'soft-pin ≥0.9.202');

assert.ok(/export const HORN_TRUE_3D\s*=\s*false/.test(flag), 'flag HORN_TRUE_3D=false');
assert.ok(!/from ['"]three\/addons/.test(flag), 'flag has no three/addons');
assert.ok(/export const HORN_TRUE_3D\s*=\s*false/.test(q3d), 'q-hero-3d still false');

// Boot graph: no static import of q-hero-3d.js (comments OK)
for (const [name, src] of [['main', main], ['sprites', sprites], ['view', view]]) {
  assert.ok(!/from\s+['"]\.\/q-hero-3d\.js['"]/.test(src), `${name} no static q-hero-3d import`);
  assert.ok(!/meshopt_decoder/.test(src), `${name} no meshopt`);
}
assert.ok(sprites.includes('q-hero-3d-flag.js'), 'sprites uses flag');
assert.ok(view.includes('q-hero-3d-flag.js'), 'view uses flag');
assert.ok(!/depth:\s*false/.test(sprites) || /depthWrite:\s*false/.test(sprites), 'no invalid depth:false');

assert.ok(!/await\s+Promise\.race\(\s*\[\s*preloadMixamoHero/.test(main), 'boot no preload');
assert.ok(main.includes('PHONE-MENU-BLACK') || main.includes('PHONE-MENU-CTA'), 'main documents pause');

const setStart = view.indexOf('setMenuMech(id)');
const setEnd = view.indexOf('\n  updateMenuLayout(viewportWidth', setStart);
const setMenu = view.slice(setStart, setEnd);
assert.ok(setMenu.includes('buildPlayerMech'), 'menu uses buildPlayerMech');
assert.ok(!setMenu.includes('buildMixamoPlayer'), 'menu no Mixamo');
assert.ok(setMenu.includes('menuStagePlate') || setMenu.includes('CircleGeometry'), 'menu stage plate');
assert.ok(setMenu.includes('try') && setMenu.includes('catch'), 'setMenuMech try/catch');
assert.ok(view.includes('0x080e1c') || view.includes('_menuPrevBg'), 'menu scene.background');

// CSS dual fix
assert.ok(css.includes('PHONE-MENU-CTA-VISIBLE-001'), 'css tip id');
assert.ok(/#screen-start\.menu-home[\s\S]{0,400}rgba\(5,\s*1,\s*15,\s*0\)/.test(css), 'css mid-band punch transparent');
assert.ok(/#screen-start \.mech-stage[\s\S]{0,120}bottom:\s*28%/.test(css), 'mech-stage mid-band bottom');
assert.ok(main.includes('onHomePlayTap') && main.includes('pointerup'), 'Start pointerup');
assert.ok(/startRun[\s\S]{0,200}try/.test(main) && main.includes('startRun failed'), 'startRun try/catch');

assert.ok(existsSync(join(root, 'assets/mechs/horn/q-hero-mixamo-walk.play.glb')), 'play.glb kept');
assert.ok(agent.includes('0.9.202') || agent.includes('PHONE-MENU-CTA-VISIBLE'), 'agent tip');
assert.ok(agent.includes('HOLD') || agent.includes('肉眼'), 'HOLD');
assert.ok(agent.includes('Phase 4') && agent.includes('HARD BAN'), 'bans');

console.log('menu-mech-phone-fix.test.mjs: PASS');
