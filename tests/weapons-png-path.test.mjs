/**
 * WEAPONS-PNG-PATH (v0.9.191)
 */
import assert from 'assert';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const agent = readFileSync(join(root, 'docs/AGENT_TASK.md'), 'utf8');
const hand = readFileSync(join(root, 'docs/HANDOFF.md'), 'utf8');
const bible = readFileSync(join(root, 'docs/art-bible.md'), 'utf8');
const mech = readFileSync(join(root, 'js/mech-builder.js'), 'utf8');
const sprites = readFileSync(join(root, 'js/sprites.js'), 'utf8');
const icons = readFileSync(join(root, 'js/weapons-icons.js'), 'utf8');
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const pipeline = readFileSync(join(root, 'docs/render-pipeline.md'), 'utf8');

assert.ok((() => {
  const m = html.match(/\?v=0\.9\.(\d+)/);
  return m && Number(m[1]) >= 191;
})(), 'soft-pin ≥0.9.191');
assert.ok(agent.includes('WEAPONS-PNG-PATH') || agent.includes('0.9.191') || /MECH-HORN-ROY-PNG|Active|HOLD/.test(agent), 'AGENT_TASK soft');


assert.ok(icons.includes('assets/weapons/') && icons.includes('WEAPON_ICON_SRC'), 'src map');
assert.ok(existsSync(join(root, 'assets/weapons/README.md')), 'drop readme');
assert.ok((() => { const main = readFileSync(join(root, 'js/main.js'), 'utf8'); return main.includes('preferSrc: true') || main.includes('WEAPONS-PNG-PATH'); })(), 'preferSrc wired');
function rfMainPrefer() {
  const main = readFileSync(join(root, 'js/main.js'), 'utf8');
  return main.includes('preferSrc: true') || main.includes('WEAPONS-PNG-PATH');
}

console.log('weapons-png-path.test.mjs: PASS');
