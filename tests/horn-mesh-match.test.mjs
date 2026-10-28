/**
 * HORN-MESH-MATCH-001 (v0.9.194)
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
  return m && Number(m[1]) >= 194;
})(), 'soft-pin ≥0.9.194');


assert.ok(mech.includes('HORN-MESH-MATCH-001') || mech.includes('sword-mech-sideview-approved'), 'mesh header');
assert.ok(mech.includes('swept') || mech.includes('SWEPT-BACK') || mech.includes('crest'), 'swept crest');
assert.ok(/accent:\s*0x1e242e/.test(cfg) || cfg.includes('0x1e242e'), 'charcoal accent');
assert.ok(!/accent:\s*0x3a2a55/.test(cfg), 'no purple accent');
assert.ok(agent.includes('HORN-MESH-MATCH-001'), 'agent slice');

console.log('horn-mesh-match.test.mjs: PASS');
