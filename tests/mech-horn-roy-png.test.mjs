/**
 * MECH-HORN-ROY-PNG (v0.9.186)
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
  return m && Number(m[1]) >= 186;
})(), 'soft-pin ≥0.9.186');
assert.ok(agent.includes('MECH-HORN-ROY-PNG') || agent.includes('0.9.186') || /MECH-HORN-ROY-PNG|Active|HOLD/.test(agent), 'AGENT_TASK soft');


assert.ok(agent.includes('MECH-HORN-ROY-PNG'), 'Active id');
assert.ok(agent.includes('機體／角／Roy PNG') || agent.includes('MECH-HORN'), 'Roy decision');
assert.ok(/Lifted|lift/.test(agent) || bible.includes('MECH-HORN-ROY-PNG'), 'art bans lifted');
assert.ok(agent.includes('Phase 4') && agent.includes('HARD BAN'), 'Phase4 still banned');
assert.ok(!/btn-glow/.test(html) || !html.includes('id="btn-glow"'), 'no pause glow');

console.log('mech-horn-roy-png.test.mjs: PASS');
