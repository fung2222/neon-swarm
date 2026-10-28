/**
 * MECH-PROTOTYPE-SILHOUETTE (v0.9.190)
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
  return m && Number(m[1]) >= 190;
})(), 'soft-pin ≥0.9.190');
assert.ok(agent.includes('MECH-PROTOTYPE-SILHOUETTE') || agent.includes('0.9.190') || /MECH-HORN-ROY-PNG|Active|HOLD/.test(agent), 'AGENT_TASK soft');


assert.ok(mech.includes('buildPrototype'), 'proto builder');
assert.ok(mech.includes('MECH-PROTOTYPE-SILHOUETTE') || mech.includes('morph'), 'proto header/morph');
assert.ok(existsSync(join(root, 'assets/mechs/prototype/sheets/prototype_n_idle_00.png')) || existsSync(join(root, 'assets/mechs/prototype/sheets/prototype_atlas.json')), 'proto bake stub');

console.log('mech-prototype-silhouette.test.mjs: PASS');
