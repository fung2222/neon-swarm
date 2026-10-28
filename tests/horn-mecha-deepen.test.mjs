/**
 * HORN-MECHA-DEEPEN (v0.9.187)
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
  return m && Number(m[1]) >= 187;
})(), 'soft-pin ≥0.9.187');
assert.ok(agent.includes('HORN-MECHA-DEEPEN') || agent.includes('0.9.187') || /MECH-HORN-ROY-PNG|Active|HOLD/.test(agent), 'AGENT_TASK soft');


assert.ok(mech.includes('HORN-MECHA-DEEPEN') || mech.includes('v0.9.187'), 'mech header');
assert.ok(mech.includes('hornRidge') || mech.includes('chestChevron') || mech.includes('packFinL'), 'deepen parts present');
assert.ok(existsSync(join(root, 'assets/mechs/horn/sheets/horn_atlas.json')), 'atlas');
assert.ok(existsSync(join(root, 'assets/mechs/horn/sheets/horn_n_idle_00.png')), 'idle n');
assert.ok(sprites.includes('horn_atlas.json?v=0.9.187') || sprites.includes('0.9.187'), 'atlas cache');
assert.ok(agent.includes('interim') || agent.includes('not §9') || hand.includes('not §9'), 'no lock claim');

console.log('horn-mecha-deepen.test.mjs: PASS');
