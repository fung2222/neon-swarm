/**
 * WEAPONS-BRANCH-HINT-SYNC-001 (v0.9.86)
 * BRANCH_KIT_HINTS match branchNames for known mismatches (no kit invent).
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { branchOptions } from '../js/weapons.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const weapons = readFileSync(new URL('../js/weapons.js', import.meta.url), 'utf8');
const agent = readFileSync(new URL('../docs/AGENT_TASK.md', import.meta.url), 'utf8');

assert.ok(/\?v=0\.9\.(86|[8-9]\d)/.test(html) || /\?v=0\.9\.8[6-9]/.test(html), 'cache-bust ≥0.9.86');
assert.ok(weapons.includes('WEAPONS-BRANCH-HINT-SYNC-001'), 'ship id');
assert.ok(agent.includes('WEAPONS-BRANCH-HINT-SYNC-001') || agent.includes('0.9.86'), 'AGENT_TASK');
assert.ok(weapons.includes('Sticky web snare'), 'slow_gun B');
assert.ok(weapons.includes('Suicide charge burst'), 'attack_drone B');
assert.ok(weapons.includes('EMP pulse'), 'flash B');
assert.ok(weapons.includes('Gravity hammer smash'), 'gravity B');
assert.ok(weapons.includes('Singularity blast'), 'blackhole B');
assert.ok(!weapons.includes('Harder drones'), 'old drone hint gone');
assert.ok(!weapons.includes('Wider slow field'), 'old slow hint gone');

const drone = branchOptions('attack_drone');
const b = drone.find((o) => o.letter === 'B');
assert.ok(b && b.descEn.includes('Suicide charge'), b);
assert.ok(b.zh.includes('自爆衝鋒'), b);

console.log('weapons-branch-hint-sync.test.mjs: PASS');
