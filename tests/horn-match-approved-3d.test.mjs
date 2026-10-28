/**
 * HORN-MATCH-APPROVED-3D (v0.9.193)
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
  return m && Number(m[1]) >= 193;
})(), 'soft-pin ≥0.9.193');


assert.ok(agent.includes('HORN-MATCH-APPROVED-3D'), 'Active id');
assert.ok(agent.includes('跟圖重做') || agent.includes('rebuild'), 'Roy decision');
assert.ok(agent.includes('Phase 4') && agent.includes('HARD BAN'), 'Phase4 banned');

console.log('horn-match-approved-3d.test.mjs: PASS');
