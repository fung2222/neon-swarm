/**
 * GAMES-JSON-STAGE-010 (v0.9.197)
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
  return m && Number(m[1]) >= 197;
})(), 'soft-pin ≥0.9.197');


assert.ok(agent.includes('HOLD') || agent.includes('肉眼'), 'HOLD');
assert.ok(agent.includes('HORN-MATCH-APPROVED-3D') || agent.includes('approved'), 'match active');
assert.ok(bible.includes('sword-mech-sideview-approved') || bible.includes('HORN-MESH-MATCH'), 'bible target');
assert.ok(agent.includes('Phase 4') && agent.includes('HARD BAN'), 'bans');

console.log('games-json-stage-010.test.mjs: PASS');
