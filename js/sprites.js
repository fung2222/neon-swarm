/**
 * Approved PNG billboards for neon-swarm (暴走機甲).
 * Player: mech idle/move/attack/defend/hit/victory. Enemies: magenta/lime/orange.
 * NPC: scientist doctor (map prop until a shop hook exists).
 */
import * as THREE from 'three';
import { yawToCardinal as yawToCardinalShared, yawToOctant, muzzleWorld, HORN_MUZZLE_BY_DIR, muzzleUvAnchors, DIRS8 } from './muzzle.js';
export { yawToCardinalShared as yawToCardinal, yawToOctant, muzzleWorld, HORN_MUZZLE_BY_DIR, DIRS8 };

export const SPRITE_PATHS = {
  // Primary player set (approved mech poses). Old player_* kept only as unused files on disk.
  mech_idle: './assets/sprites/mech_idle.png?v=0.8.6',
  mech_move: './assets/sprites/mech_move.png?v=0.8.6',
  mech_move_1: './assets/sprites/mech_move_1.png?v=0.8.6',
  mech_move_2: './assets/sprites/mech_move_2.png?v=0.8.6',
  mech_attack: './assets/sprites/mech_attack.png?v=0.8.6',
  mech_defend: './assets/sprites/mech_defend.png?v=0.8.6',
  mech_hit: './assets/sprites/mech_hit.png?v=0.8.6',
  mech_victory: './assets/sprites/mech_victory.png?v=0.8.6',
  enemy_magenta: './assets/sprites/enemy_magenta.png',
  enemy_lime: './assets/sprites/enemy_lime.png',
  enemy_orange: './assets/sprites/enemy_orange.png',
  npc_doctor: './assets/sprites/npc_doctor.png',
};

/** Map every enemy type onto one of the three colour-coded PNGs (no shared cyan mesh). */
export const ENEMY_SPRITE_KEY = {
  staffer: 'enemy_lime',
  guard: 'enemy_lime',
  soldier: 'enemy_magenta',
  officer: 'enemy_magenta',
  chief: 'enemy_lime',
  drone: 'enemy_orange',
  walker: 'enemy_magenta',
  mech: 'enemy_magenta',
  sniper: 'enemy_magenta',
  shield: 'enemy_magenta',
};

/** World-space billboard size (width, height) + optional float. */
export const ENEMY_SPRITE_SIZE = {
  // ~82–85% visual scale (bump from prior ~70%)
  staffer: { w: 1.20, h: 1.70 },
  guard: { w: 1.24, h: 1.74 },
  soldier: { w: 1.40, h: 1.65 },
  officer: { w: 1.53, h: 1.78 },
  chief: { w: 1.62, h: 1.95 },
  drone: { w: 0.96, h: 0.96, float: true, flyer: true },
  walker: { w: 1.74, h: 1.87 },
  mech: { w: 1.95, h: 2.12 },
  sniper: { w: 1.45, h: 1.72 },
  shield: { w: 1.70, h: 1.85 },
};

/**
 * Ground-ring presence by enemy role (readability under swarm density).
 * Grunts: nearly invisible / tiny. Elite / heavy: keep a clear identity ring.
 * Danger telegraphs stay separate (projectiles / AOE) — do not steal warn colors here.
 */
export const ENEMY_RING_STYLE = {
  // v0.9.22 Phase 2: ordinary grunts — no ground rings (silhouette only).
  staffer: { radiusScale: 0.45, opacity: 0.0, visible: false },
  guard:   { radiusScale: 0.45, opacity: 0.0, visible: false },
  soldier: { radiusScale: 0.48, opacity: 0.0, visible: false },
  drone:   { radiusScale: 0.40, opacity: 0.0, visible: false },
  // elite / heavy / danger identity — keep strong rings
  officer: { radiusScale: 0.90, opacity: 0.34, visible: true },
  chief:   { radiusScale: 1.00, opacity: 0.42, visible: true },
  walker:  { radiusScale: 0.95, opacity: 0.36, visible: true },
  mech:    { radiusScale: 1.05, opacity: 0.40, visible: true },
  // sniper: thin identity ring (procedural mesh also draws one)
  sniper:  { radiusScale: 0.70, opacity: 0.28, visible: true },
  shield:  { radiusScale: 0.85, opacity: 0.30, visible: true },
};

const RING_BY_KEY = {
  enemy_lime: 0xb8ff3a,
  enemy_magenta: 0xff2bd6,
  enemy_orange: 0xff8a1a,
  npc_doctor: 0x00e5ff,
};

const loader = new THREE.TextureLoader();
const TEX = Object.create(null);

export function loadSpriteTex(key) {
  if (TEX[key]) return TEX[key];
  const path = SPRITE_PATHS[key];
  if (!path) throw new Error('unknown sprite key: ' + key);
  const tex = loader.load(path);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  // No mipmaps: averaging fringe under alphaTest looks like soft fog at distance.
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.premultiplyAlpha = false;
  TEX[key] = tex;
  return tex;
}

/** Kick off loads so first frame rarely shows blank planes. */
export function preloadAllSprites() {
  for (const k of Object.keys(SPRITE_PATHS)) loadSpriteTex(k);
}

function groundRing(color, radius, opacity = 0.4) {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.72, radius, 28),
    new THREE.MeshBasicMaterial({
      color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, fog: false,
    })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.035;
  return m;
}

/**
 * Upright textured plane parented under a Group. Plane billboards to the camera in sync.
 * `emissiveStub` keeps the existing View.sync flash API (emissiveIntensity) from crashing.
 */
export function makeBillboard(key, w, h, opts = {}) {
  const tex = loadSpriteTex(key);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.45,       // hard cut — kills soft fringe / fog pixels
    side: THREE.DoubleSide,
    depthWrite: true,
    color: 0xffffff,
    fog: false,            // scene FogExp2 must not tint sprite planes
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  plane.position.y = h * 0.5;
  plane.name = 'spritePlane';

  const root = new THREE.Group();
  root.add(plane);

  const ringColor = opts.ringColor != null ? opts.ringColor : (RING_BY_KEY[key] || 0x00e5ff);
  const ringR = opts.ringRadius != null ? opts.ringRadius : Math.max(0.28, w * 0.28);
  const halo = groundRing(ringColor, ringR, opts.ringOpacity != null ? opts.ringOpacity : 0.38);
  root.add(halo);

  const stub = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.85,
    transparent: true, opacity: 0, depth: false,
  });

  root.userData.isSprite = true;
  root.userData.plane = plane;
  root.userData.spriteMat = mat;
  root.userData.spriteKey = key;
  root.userData.spriteW = w;
  root.userData.spriteH = h;
  root.userData.halo = halo;
  root.userData.hullMats = [stub];
  root.userData.coreMats = [stub];
  root.userData.thrusterMats = [];
  root.userData.legs = [];
  root.userData.shins = [];
  root.userData.foots = [];
  root.userData.arms = [];
  root.userData.fists = [];
  root.userData.head = null;
  root.userData.body = null;
  root.userData.glowL = null;
  root.userData.glowR = null;
  root.userData.animPhase = 0;
  root.userData.idlePhase = 0;
  root.userData.bob = !!opts.float;
  root.userData.baseY = opts.float ? 0.55 : 0;
  return root;
}

export function buildPlayerSprite(cfg) {
  // Prefer baked buildPlayerMech sheets when available for this mech id.
  const baked = buildBakedPlayerSprite(cfg);
  if (baked) return baked;

  // Legacy whole-body PNG fallback (kept until bake is verified per-mech).
  const idle = loadSpriteTex('mech_idle');
  const move = loadSpriteTex('mech_move');
  const move1 = loadSpriteTex('mech_move_1');
  const move2 = loadSpriteTex('mech_move_2');
  const attack = loadSpriteTex('mech_attack');
  const defend = loadSpriteTex('mech_defend');
  const hit = loadSpriteTex('mech_hit');
  const victory = loadSpriteTex('mech_victory');
  const trim = (cfg && cfg.trim) || 0xb14cff;
  const root = makeBillboard('mech_idle', 1.78, 2.12, {
    ringColor: trim,
    ringRadius: 0.46,
    ringOpacity: 0.32,
  });
  // Hot-swap maps without reallocating materials each frame.
  // Keys match View.sync states; fire aliases attack for older call sites.
  root.userData.ringBaseOpacity = 0.32;
  root.userData.playerMaps = {
    idle,
    move,       // fallback single frame
    move1,
    move2,
    attack,
    fire: attack,
    defend,
    hit,
    victory,
  };
  root.userData.walkFrames = [move1, move2];
  root.userData.playerState = 'idle';
  root.userData.walkFrame = 0;
  root.userData.mechId = cfg && cfg.id;
  const id = cfg && cfg.id;
  root.scale.setScalar(id === 'heavy' ? 1.12 : id === 'prototype' ? 0.96 : 1);
  return root;
}

export function enemySpriteKey(type) {
  return ENEMY_SPRITE_KEY[type] || 'enemy_lime';
}

export function buildEnemySprite(type) {
  const key = enemySpriteKey(type);
  const size = ENEMY_SPRITE_SIZE[type] || { w: 1.12, h: 1.40 };
  const style = ENEMY_RING_STYLE[type] || { radiusScale: 0.55, opacity: 0.08, visible: true };
  const baseR = Math.max(0.26, size.w * 0.26);
  const root = makeBillboard(key, size.w, size.h, {
    ringColor: RING_BY_KEY[key],
    ringRadius: baseR * (style.radiusScale != null ? style.radiusScale : 1),
    ringOpacity: style.opacity != null ? style.opacity : 0.1,
    float: !!size.float,
  });
  if (root.userData.halo) {
    root.userData.halo.visible = style.visible !== false;
    root.userData.ringBaseOpacity = style.opacity != null ? style.opacity : 0.1;
  }
  root.userData.type = type;
  root.userData.spriteKey = key;
  root.userData.flyer = !!(size.flyer || size.float);
  return root;
}

/** Retarget a pooled enemy billboard to another type (swap map + rescale). */
export function retargetEnemySprite(root, type) {
  const key = enemySpriteKey(type);
  const size = ENEMY_SPRITE_SIZE[type] || { w: 1.12, h: 1.40 };
  const mat = root.userData.spriteMat;
  const plane = root.userData.plane;
  if (mat) {
    mat.map = loadSpriteTex(key);
    mat.needsUpdate = true;
  }
  if (plane) {
    plane.geometry.dispose();
    plane.geometry = new THREE.PlaneGeometry(size.w, size.h);
    plane.position.y = size.h * 0.5;
  }
  root.userData.type = type;
  root.userData.spriteKey = key;
  root.userData.spriteW = size.w;
  root.userData.spriteH = size.h;
  root.userData.bob = !!size.float;
  root.userData.flyer = !!(size.flyer || size.float);
  root.userData.baseY = size.float ? 0.55 : 0;
  if (root.userData.halo && root.userData.halo.material) {
    const style = ENEMY_RING_STYLE[type] || { radiusScale: 0.55, opacity: 0.08, visible: true };
    const baseR = Math.max(0.26, size.w * 0.26);
    const r = baseR * (style.radiusScale != null ? style.radiusScale : 1);
    const halo = root.userData.halo;
    halo.material.color.setHex(RING_BY_KEY[key] || 0x00e5ff);
    halo.material.opacity = style.opacity != null ? style.opacity : 0.1;
    halo.visible = style.visible !== false;
    root.userData.ringBaseOpacity = halo.material.opacity;
    // Rebuild ring geometry to new radius (pool reuse).
    if (halo.geometry) halo.geometry.dispose();
    halo.geometry = new THREE.RingGeometry(r * 0.72, r, 28);
  }
  return root;
}

export function buildDoctorNpc() {
  // Chibi doctor — smaller than 70% mech scale
  const root = makeBillboard('npc_doctor', 1.12, 1.48, {
    ringColor: 0x00e5ff,
    ringRadius: 0.34,
    ringOpacity: 0.45,
  });
  root.userData.isNpc = true;
  root.userData.type = 'doctor';
  return root;
}

/** Face the camera (paper doll) and optional left/right flip from facing yaw. */
export function billboardToCamera(root, camera, facingYaw = null) {
  const plane = root.userData && root.userData.plane;
  if (!plane || !camera) return;
  plane.quaternion.copy(camera.quaternion);
  if (facingYaw == null) return;
  // Flip when the facing vector points left of the camera forward (screen-space).
  const camFwdX = camera.position.x - root.position.x;
  const camFwdZ = camera.position.z - root.position.z;
  const camAng = Math.atan2(camFwdX, camFwdZ);
  let d = facingYaw - camAng;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  const flip = d > 0 ? -1 : 1;
  plane.userData = plane.userData || {};
  plane.userData._camFlip = flip;
  const sx = Math.abs(plane.scale.x) || 1;
  // Preserve walk-intent magnitude; cam flip applied here as base
  plane.scale.x = sx * flip;
}

/** Tint / opacity for hit flash & invuln blink on a sprite mat. */
export function applySpriteFlash(root, { blink = false, hit = false, move = 0 } = {}) {
  const mat = root.userData && root.userData.spriteMat;
  if (!mat) return;
  mat.opacity = blink ? 0.35 : 1;
  if (hit) mat.color.setRGB(1.12, 1.05, 1.05);
  else mat.color.setRGB(1, 1, 1);
  const halo = root.userData.halo;
  if (halo && halo.material) {
    // Respect per-enemy ringBaseOpacity (grunt dimming). Player fallback ~0.28.
    const base = root.userData.ringBaseOpacity != null ? root.userData.ringBaseOpacity : 0.28;
    const amp = root.userData.ringBaseOpacity != null ? Math.min(0.06, base * 0.5) : 0.12;
    halo.material.opacity = base + move * amp;
  }
}


/**
 * Vampire-Survivors-style 2D feel on a billboard:
 * bob / squash when moving, idle micro-sway when still, flip by velocity X.
 * phaseOffset keeps a swarm from syncing.
 */
export function applySpriteMotion(root, {
  moving = false,
  velX = 0,
  aimX = null,
  flipFromAim = false,
  phase = 0,
  phaseOffset = 0,
  strength = 1,
  camera = null,
  facingYaw = null,
  style = 'ground', // 'ground' | 'fly' | 'idle'
} = {}) {
  const plane = root.userData && root.userData.plane;
  if (!plane) return;
  const h = (root.userData.spriteH || 1.5);
  const p = phase + phaseOffset;
  const flipSign = () => (Math.sign(plane.scale.x || 1) || 1);
  // Lateral flip source: aim when shooting, else move velX
  const leanDir = (flipFromAim && aimX != null && Math.abs(aimX) > 0.02)
    ? (aimX >= 0 ? 1 : -1)
    : (velX >= 0 ? 1 : -1);

  if (style === 'fly') {
    // Jet / hover: soft float, no foot-plant squash — reads as thrust, not walking.
    const hover = 0.42 + Math.sin(p * 2.4) * 0.07 * strength;
    plane.position.y = h * 0.5 + hover;
    plane.scale.y = 1 + Math.sin(p * 3.1) * 0.03 * strength;
    plane.scale.x = flipSign() * (1 - Math.sin(p * 3.1) * 0.02 * strength);
    plane.rotation.z = Math.sin(p * 2.0) * 0.05 * strength * leanDir;
    root.userData.footPlant = false;
  } else if (moving && style !== 'idle') {
    // Ground RUN: quieter bob/squash so feet stay planted (v0.8.6).
    const cycle = Math.sin(p);
    const plant = Math.max(0, -cycle);
    const bob = Math.abs(cycle) * 0.016 * strength;
    const squashY = 1 + plant * 0.012 * strength;
    const stretchX = 1 - plant * 0.008 * strength;
    plane.position.y = h * 0.5 + bob;
    plane.scale.y = squashY;
    plane.scale.x = flipSign() * Math.abs(stretchX);
    plane.rotation.z = leanDir * 0.02 * strength;
    root.userData.footPlant = plant > 0.85;
    root.userData.runLean = 0.03 * strength;
  } else {
    // Idle sway / breathe — doctor & standing foes
    const sway = Math.sin(p * 1.8) * 0.03 * strength;
    const breathe = 1 + Math.sin(p * 1.1) * 0.018 * strength;
    plane.position.y = h * 0.5 + sway;
    plane.scale.y = breathe;
    plane.scale.x = flipSign() * (2 - breathe);
    plane.rotation.z = Math.sin(p * 1.15) * 0.035 * strength;
    root.userData.footPlant = false;
  }
  if (camera) billboardToCamera(root, camera, facingYaw);
  // Facing split (A2): when aiming/firing, flip from aim lateral — NOT velX.
  // Strafe-left + shoot-right must keep gun toward aim.
  if (flipFromAim && aimX != null && Math.abs(aimX) > 0.02) {
    const sx = Math.abs(plane.scale.x) || 1;
    plane.scale.x = (aimX < 0 ? -1 : 1) * sx;
  } else if (Math.abs(velX) > 0.08) {
    const sx = Math.abs(plane.scale.x) || 1;
    plane.scale.x = (velX < 0 ? -1 : 1) * sx;
  }
}

// ---------------------------------------------------------------------------
// Baked player sheets (from buildPlayerMech via tools/bake-mech-sprites.mjs).
// HORN-BAKE-INGAME-ALIGN (v0.9.188): horn in-game uses these sheets — same 3D source as select.
// Old whole-body PNG remains fallback until atlas loads / verifies.
// ---------------------------------------------------------------------------

export const BAKED_PLAYER_BASE = {
  horn: {
    id: 'horn',
    root: './assets/mechs/horn/sheets/',
    atlasUrl: './assets/mechs/horn/sheets/horn_atlas.json?v=0.9.195',
    dirs: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'],
    runFrames: 4,
    cellSize: 256,
    anchors: { foot: [0.5, 0.92], pivot: [0.5, 0.52], muzzle: HORN_MUZZLE_BY_DIR.n.uv.slice() },
    anchorsByDir: muzzleUvAnchors(HORN_MUZZLE_BY_DIR),
    muzzleByDir: HORN_MUZZLE_BY_DIR,
    worldW: 1.78,
    worldH: 2.12,
  },
};

/** @deprecated use yawToCardinal from muzzle.js — kept as local alias */
const yawToCardinal = yawToCardinalShared;

function loadTexPath(path) {
  if (TEX[path]) return TEX[path];
  const tex = loader.load(path);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.premultiplyAlpha = false;
  TEX[path] = tex;
  return tex;
}

function cellPath(spec, dir, action, frame, layer) {
  const f = String(frame).padStart(2, '0');
  const suffix = layer === 'gun' ? '_gun' : '';
  // gun files: horn_n_gun_00_gun.png ; body: horn_n_idle_00.png
  if (layer === 'gun') return `${spec.root}${spec.id}_${dir}_gun_${f}_gun.png?v=0.9.187`;
  return `${spec.root}${spec.id}_${dir}_${action}_${f}.png?v=0.9.187`;
}

/**
 * Layered billboard: body (lower locomotion) + gun (upper aim) + optional hurt tint.
 * Foot planted — no bob/squash fake-run.
 */
export function buildBakedPlayerSprite(cfg) {
  const id = (cfg && (cfg.model || cfg.id)) || 'horn';
  const spec = BAKED_PLAYER_BASE[id];
  if (!spec) return null;

  const trim = (cfg && cfg.trim) || 0xb14cff;
  const w = spec.worldW;
  const h = spec.worldH;

  const mkPlane = (name) => {
    const mat = new THREE.MeshBasicMaterial({
      map: null,
      transparent: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      depthWrite: true,
      color: 0xffffff,
      fog: false,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    plane.position.y = h * 0.5;
    plane.name = name;
    return { plane, mat };
  };

  const body = mkPlane('bodyPlane');
  const gun = mkPlane('gunPlane');
  gun.plane.renderOrder = 1;
  gun.mat.depthWrite = false;

  const root = new THREE.Group();
  root.add(body.plane);
  root.add(gun.plane);
  const halo = groundRing(trim, 0.46, 0.32);
  root.add(halo);

  const stub = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.85,
    transparent: true, opacity: 0, visible: false,
  });

  // Preload all cells
  const maps = { body: {}, gun: {}, hurt: {}, death: {}, idle: {}, run: {} };
  for (const dir of spec.dirs) {
    maps.idle[dir] = loadTexPath(cellPath(spec, dir, 'idle', 0, 'body'));
    maps.hurt[dir] = loadTexPath(cellPath(spec, dir, 'hurt', 0, 'body'));
    maps.death[dir] = loadTexPath(cellPath(spec, dir, 'death', 0, 'body'));
    maps.gun[dir] = loadTexPath(cellPath(spec, dir, 'gun', 0, 'gun'));
    maps.run[dir] = [];
    for (let f = 0; f < spec.runFrames; f++) {
      maps.run[dir].push(loadTexPath(cellPath(spec, dir, 'run', f, 'body')));
    }
  }
  body.mat.map = maps.idle.n;
  gun.mat.map = maps.gun.n;

  root.userData.isSprite = true;
  root.userData.baked = true;
  root.userData.bakedSpec = spec;
  root.userData.bakedMaps = maps;
  root.userData.plane = body.plane; // primary for flash/billboard helpers
  root.userData.bodyPlane = body.plane;
  root.userData.bodyMat = body.mat;
  root.userData.gunPlane = gun.plane;
  root.userData.gunMat = gun.mat;
  root.userData.spriteMat = body.mat;
  root.userData.spriteKey = 'baked_' + id;
  root.userData.spriteW = w;
  root.userData.spriteH = h;
  root.userData.halo = halo;
  root.userData.hullMats = [stub];
  root.userData.coreMats = [stub];
  root.userData.thrusterMats = [];
  root.userData.legs = [];
  root.userData.shins = [];
  root.userData.foots = [];
  root.userData.arms = [];
  root.userData.fists = [];
  root.userData.head = null;
  root.userData.body = null;
  root.userData.glowL = null;
  root.userData.glowR = null;
  root.userData.animPhase = 0;
  root.userData.idlePhase = 0;
  root.userData.bob = false;
  root.userData.baseY = 0;
  root.userData.mechId = id;
  root.userData.bodyDir = 'n';
  root.userData.gunDir = 'n';
  root.userData.runFrame = 0;
  root.userData.anchors = spec.anchors;
  root.userData.anchorsByDir = spec.anchorsByDir || null;
  root.userData.muzzleByDir = spec.muzzleByDir || HORN_MUZZLE_BY_DIR;
  root.scale.setScalar(id === 'heavy' ? 1.12 : id === 'prototype' ? 0.96 : 1);
  return root;
}

/**
 * Sync baked layers: body from movement, gun from primary visual aim (8-dir).
 * Legs≠aim: bodyDir from move, gunDir from visualAim independently.
 * Hurt = tint overlay only (does not swap run off). Death uses death cell.
 * No bob / squash. Honest: 8-dir sector snap — not continuous 360° turret.
 */
export function syncBakedPlayerSprite(root, {
  moveX = 0,
  moveZ = 0,
  moving = false,
  aimX = 0,
  aimZ = 1,
  aiming = false,
  hit = false,
  blink = false,
  alive = true,
  dt = 0.016,
  camera = null,
} = {}) {
  const ud = root.userData;
  if (!ud || !ud.baked) return;
  const maps = ud.bakedMaps;
  const spec = ud.bakedSpec;
  const frames = spec.runFrames || 4;

  // Body dir from movement when moving; else face visual aim / last gun dir
  let bodyDir;
  if (moving && (Math.abs(moveX) + Math.abs(moveZ)) > 0.04) {
    bodyDir = yawToCardinal(moveX, moveZ);
  } else if (aiming) {
    bodyDir = yawToCardinal(aimX, aimZ);
  } else {
    bodyDir = ud.bodyDir || ud.gunDir || 'n';
  }
  const gunDir = (aiming || (Math.abs(aimX) + Math.abs(aimZ)) > 0.05)
    ? yawToCardinal(aimX, aimZ)
    : (ud.gunDir || bodyDir);

  if (moving) ud.animPhase = (ud.animPhase || 0) + Math.max(0.35, Math.hypot(moveX, moveZ)) * 8.2 * Math.max(0.001, Math.min(0.05, dt));
  else ud.animPhase = (ud.animPhase || 0) * 0.88;

  const runIdx = moving ? (Math.floor((ud.animPhase || 0) / (Math.PI / 2)) % frames) : 0;

  // Prefer exact dir; fall back to nearest cardinal then n (mixed 4/8 atlases).
  const CARDINAL_FALLBACK = { ne: 'n', se: 'e', sw: 's', nw: 'w' };
  const pickDirMap = (table, dir) => {
    if (!table) return null;
    if (table[dir]) return table[dir];
    const fb = CARDINAL_FALLBACK[dir];
    if (fb && table[fb]) return table[fb];
    return table.n || null;
  };

  let bodyMap;
  if (!alive) {
    bodyMap = pickDirMap(maps.death, bodyDir);
    if (ud.gunPlane) ud.gunPlane.visible = false;
  } else if (moving) {
    const runArr = pickDirMap(maps.run, bodyDir);
    bodyMap = (Array.isArray(runArr) && runArr[runIdx]) || pickDirMap(maps.idle, bodyDir);
    if (ud.gunPlane) ud.gunPlane.visible = true;
  } else {
    bodyMap = pickDirMap(maps.idle, bodyDir);
    if (ud.gunPlane) ud.gunPlane.visible = true;
  }

  if (bodyMap && ud.bodyMat && ud.bodyMat.map !== bodyMap) {
    ud.bodyMat.map = bodyMap;
    ud.bodyMat.needsUpdate = true;
  }
  const gunMap = pickDirMap(maps.gun, gunDir);
  if (gunMap && ud.gunMat && ud.gunMat.map !== gunMap) {
    ud.gunMat.map = gunMap;
    ud.gunMat.needsUpdate = true;
  }

  ud.bodyDir = bodyDir;
  ud.gunDir = gunDir;
  ud.runFrame = runIdx;
  ud.playerState = !alive ? 'death' : (moving ? 'run' : 'idle');

  // Plant feet — no bob
  const h = ud.spriteH || 2.12;
  if (ud.bodyPlane) {
    ud.bodyPlane.position.y = h * 0.5;
    ud.bodyPlane.scale.set(1, 1, 1);
    ud.bodyPlane.rotation.z = 0;
  }
  if (ud.gunPlane) {
    ud.gunPlane.position.y = h * 0.5;
    ud.gunPlane.scale.set(1, 1, 1);
    ud.gunPlane.rotation.z = 0;
  }

  if (camera) {
    billboardToCamera(root, camera, null);
    if (ud.gunPlane) ud.gunPlane.quaternion.copy(camera.quaternion);
  }

  // Hurt overlay: tint only — never cancel run
  applySpriteFlash(root, { blink, hit, move: moving ? 1 : 0 });
  if (ud.gunMat) {
    ud.gunMat.opacity = blink ? 0.35 : 1;
    if (hit) ud.gunMat.color.setRGB(1.12, 1.05, 1.05);
    else ud.gunMat.color.setRGB(1, 1, 1);
  }
}

/**
 * World-space muzzle — delegates to shared pure helper (same path as bullet spawn).
 * Per-dir recorded projections; no identical 4-dir estimate.
 */
export function bakedMuzzleWorld(root, px, pz, aimX, aimZ) {
  const ud = root && root.userData;
  const byDir = (ud && ud.muzzleByDir)
    || (ud && ud.bakedSpec && ud.bakedSpec.muzzleByDir)
    || HORN_MUZZLE_BY_DIR;
  const m = muzzleWorld(px, pz, aimX, aimZ, { byDir });
  return { x: m.x, y: m.y, z: m.z };
}
