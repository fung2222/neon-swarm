/**
 * Approved PNG billboards for neon-swarm (暴走機甲).
 * Player: idle / move / fire. Enemies: magenta stubby / lime claw / orange drone.
 * NPC: scientist doctor (map prop until a shop hook exists).
 */
import * as THREE from 'three';

export const SPRITE_PATHS = {
  player_idle: './assets/sprites/player_idle.png',
  player_move: './assets/sprites/player_move.png',
  player_fire: './assets/sprites/player_fire.png',
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
};

/** World-space billboard size (width, height) + optional float. */
export const ENEMY_SPRITE_SIZE = {
  staffer: { w: 1.45, h: 2.05 },
  guard: { w: 1.5, h: 2.1 },
  soldier: { w: 1.7, h: 2.0 },
  officer: { w: 1.85, h: 2.15 },
  chief: { w: 1.95, h: 2.35 },
  drone: { w: 1.15, h: 1.15, float: true },
  walker: { w: 2.1, h: 2.25 },
  mech: { w: 2.35, h: 2.55 },
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
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
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
      color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false,
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
    alphaTest: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false,
    color: 0xffffff,
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
  root.userData.baseY = opts.float ? 0.45 : 0;
  return root;
}

export function buildPlayerSprite(cfg) {
  const idle = loadSpriteTex('player_idle');
  loadSpriteTex('player_move');
  loadSpriteTex('player_fire');
  const trim = (cfg && cfg.trim) || 0xb14cff;
  const root = makeBillboard('player_idle', 2.15, 2.55, {
    ringColor: trim,
    ringRadius: 0.55,
    ringOpacity: 0.32,
  });
  // Hot-swap maps without reallocating materials each frame.
  root.userData.playerMaps = {
    idle,
    move: loadSpriteTex('player_move'),
    fire: loadSpriteTex('player_fire'),
  };
  root.userData.playerState = 'idle';
  root.userData.mechId = cfg && cfg.id;
  // Slightly taller horn / heavy silhouette via scale (same art for all three frames for now).
  const id = cfg && cfg.id;
  root.scale.setScalar(id === 'heavy' ? 1.12 : id === 'prototype' ? 0.96 : 1);
  return root;
}

export function enemySpriteKey(type) {
  return ENEMY_SPRITE_KEY[type] || 'enemy_lime';
}

export function buildEnemySprite(type) {
  const key = enemySpriteKey(type);
  const size = ENEMY_SPRITE_SIZE[type] || { w: 1.6, h: 2.0 };
  const root = makeBillboard(key, size.w, size.h, {
    ringColor: RING_BY_KEY[key],
    ringRadius: Math.max(0.26, size.w * 0.26),
    float: !!size.float,
  });
  root.userData.type = type;
  root.userData.spriteKey = key;
  return root;
}

/** Retarget a pooled enemy billboard to another type (swap map + rescale). */
export function retargetEnemySprite(root, type) {
  const key = enemySpriteKey(type);
  const size = ENEMY_SPRITE_SIZE[type] || { w: 1.6, h: 2.0 };
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
  root.userData.baseY = size.float ? 0.45 : 0;
  if (root.userData.halo && root.userData.halo.material) {
    root.userData.halo.material.color.setHex(RING_BY_KEY[key] || 0x00e5ff);
  }
  return root;
}

export function buildDoctorNpc() {
  const root = makeBillboard('npc_doctor', 1.55, 2.15, {
    ringColor: 0x00e5ff,
    ringRadius: 0.42,
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
  const sx = Math.abs(plane.scale.x) || 1;
  plane.scale.x = sx * flip;
}

/** Tint / opacity for hit flash & invuln blink on a sprite mat. */
export function applySpriteFlash(root, { blink = false, hit = false, move = 0 } = {}) {
  const mat = root.userData && root.userData.spriteMat;
  if (!mat) return;
  mat.opacity = blink ? 0.35 : 1;
  if (hit) mat.color.setRGB(1.85, 1.35, 1.35);
  else mat.color.setRGB(1, 1, 1);
  const halo = root.userData.halo;
  if (halo && halo.material) halo.material.opacity = 0.28 + move * 0.12;
}
