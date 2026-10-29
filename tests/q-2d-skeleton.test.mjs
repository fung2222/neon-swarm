/**
 * Q-2D-SKELETON-DEMO (v0.9.203) — static wiring checks (no WebGL).
 * Run: node tests/q-2d-skeleton.test.mjs
 */
import assert from 'assert';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const html = read('index.html');
const puppet = read('js/q-hero-2d-puppet.js');
const sprites = read('js/sprites.js');
const view = read('js/view.js');
const flag = read('js/q-hero-3d-flag.js');
const agent = read('docs/AGENT_TASK.md');
const readme = read('README.md');

assert.ok(html.includes('?v=0.9.203'), 'index cache-bust 0.9.203');
assert.ok(html.includes('main.js?v=0.9.203'), 'main.js bust');
assert.ok(flag.includes('HORN_TRUE_3D = false'), 'Mixamo flag stays false');
assert.ok(puppet.includes('export const HORN_2D_SKELETON = true'), 'puppet flag on');
assert.ok(puppet.includes('buildHorn2dPuppet'), 'builder export');
assert.ok(puppet.includes('syncHorn2dPuppet'), 'sync export');
assert.ok(puppet.includes('idle') && puppet.includes('walk') && puppet.includes('attack'), 'idle/walk/attack mentioned');
assert.ok(!/from\s+['\"]\.\/q-hero-3d\.js['\"]/.test(puppet), 'puppet must not import Mixamo module');
assert.ok(!/GLTFLoader|FBXLoader|MeshoptDecoder|preloadMixamo/.test(puppet), 'no 3D loaders in puppet');
assert.ok(sprites.includes("from './q-hero-2d-puppet.js'"), 'sprites imports puppet');
assert.ok(sprites.includes('HORN_2D_SKELETON && id === \'horn\''), 'horn prefers puppet');
assert.ok(view.includes('syncHorn2dPuppet'), 'view syncs puppet');
assert.ok(view.includes('ud.isPuppet2d'), 'view branches on isPuppet2d');
assert.ok(agent.includes('Q-2D-SKELETON-DEMO'), 'AGENT_TASK tip id');
assert.ok(agent.includes('0.9.203'), 'AGENT_TASK version');
assert.ok(readme.includes('0.9.203'), 'README version');
assert.ok(existsSync(join(ROOT, 'js/q-hero-2d-puppet.js')));

// Menu path must still avoid Mixamo preload
const main = read('js/main.js');
assert.ok(main.includes('do NOT preload Mixamo') || main.includes('PHONE-MENU-BLACK'), 'menu Mixamo ban preserved');

console.log('q-2d-skeleton.test.mjs: PASS');
