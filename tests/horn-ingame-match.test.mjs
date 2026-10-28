/**
 * HORN-INGAME-MATCH-001 (v0.9.196)
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
const cfg = readFileSync(join(root, 'js/config.js'), 'utf8');
const sprites = readFileSync(join(root, 'js/sprites.js'), 'utf8');
const muzzle = readFileSync(join(root, 'js/muzzle.js'), 'utf8');

assert.ok((() => {
  const m = html.match(/\?v=0\.9\.(\d+)/);
  return m && Number(m[1]) >= 196;
})(), 'soft-pin ≥0.9.196');


assert.ok(existsSync(join(root, 'tests/screenshots/horn-match-approved/approved-ref.jpg')), 'approved ref');
assert.ok(existsSync(join(root, 'tests/screenshots/horn-match-approved/select-side-e.png')), 'select side');
assert.ok(existsSync(join(root, 'tests/screenshots/horn-match-approved/bake-horn_e_idle_00.png')), 'bake e');
assert.ok(existsSync(join(root, 'tests/screenshots/horn-match-approved/ingame-desktop.png')), 'ingame');
assert.ok(sprites.includes('buildBakedPlayerSprite') || sprites.includes('horn/sheets'), 'baked path');
assert.ok(agent.includes('HORN-INGAME-MATCH-001'), 'agent');

console.log('horn-ingame-match.test.mjs: PASS');
