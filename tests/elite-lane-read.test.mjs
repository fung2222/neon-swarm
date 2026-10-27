/**
 * PHASE6-ELITE-LANE-READ-001 (v0.9.50)
 * Run: node tests/elite-lane-read.test.mjs
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  ELITE_LANE, ELITE_LANE_LEGACY, eliteLaneOpacity, eliteLaneWidth,
} from '../js/elite-lane-read.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const view = readFileSync(join(ROOT, 'js/view.js'), 'utf8');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');

assert.match(html, /\?v=0\.9\.50/);
assert.ok(view.includes("from './elite-lane-read.js'"));
assert.ok(view.includes('eliteLaneOpacity'));
assert.ok(view.includes('eliteLaneWidth'));
assert.ok(view.includes('ELITE_LANE.color'));
assert.ok(view.includes('ELITE_LANE.y'));

// Thicker than legacy
assert.ok(ELITE_LANE.dualWidth > ELITE_LANE_LEGACY.dualWidth);
assert.ok(ELITE_LANE.singleWidth > ELITE_LANE_LEGACY.singleWidth);
assert.ok(ELITE_LANE.dualWidth >= 1.2);
assert.ok(ELITE_LANE.singleWidth >= 1.5);

// Brighter floor opacity
assert.ok(ELITE_LANE.opacityBase > ELITE_LANE_LEGACY.opacityBase);
assert.ok(eliteLaneOpacity(0) >= 0.55);
assert.ok(eliteLaneOpacity(1) <= 1.0);
assert.ok(eliteLaneOpacity(1) > eliteLaneOpacity(0));
assert.equal(eliteLaneWidth(true), ELITE_LANE.dualWidth);
assert.equal(eliteLaneWidth(false), ELITE_LANE.singleWidth);

// Still danger-orange family, not cyan/teal décor
assert.ok(ELITE_LANE.color > 0xff0000);
assert.ok((ELITE_LANE.color & 0xff0000) > 0xcc0000); // strong red channel
assert.ok(ELITE_LANE.y >= ELITE_LANE_LEGACY.y);

// No hard-coded legacy widths left in sync path
assert.ok(!view.includes('place(lane, pdx * off, pdz * off, 0.85)'));
assert.ok(!view.includes('place(lane, 0, 0, 1.1)'));
assert.ok(!view.includes('mat.opacity = 0.42 + u * 0.50'));

console.log('elite-lane-read.test.mjs: PASS');
