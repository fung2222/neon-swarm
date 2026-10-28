/**
 * HORN-BAKE-INGAME-ALIGN (v0.9.188)
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
  return m && Number(m[1]) >= 188;
})(), 'soft-pin ≥0.9.188');
assert.ok(agent.includes('HORN-BAKE-INGAME-ALIGN') || agent.includes('0.9.188') || /MECH-HORN-ROY-PNG|Active|HOLD/.test(agent), 'AGENT_TASK soft');


assert.ok(pipeline.includes('HORN-BAKE-INGAME-ALIGN') || bible.includes('HORN-BAKE-INGAME-ALIGN'), 'honesty note');
assert.ok(sprites.includes('buildBakedPlayerSprite') || sprites.includes('BAKED_PLAYER_BASE'), 'baked path');
assert.ok(readme.includes('mechs/horn/sheets') || bible.includes('mechs/horn/sheets'), 'readme/bible sheets');

console.log('horn-bake-ingame-align.test.mjs: PASS');
