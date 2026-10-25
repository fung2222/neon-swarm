/**
 * Approved PNG billboards for neon-swarm (暴走機甲).
 * Player: mech idle/move/attack/defend/hit/victory. Enemies: magenta/lime/orange.
 * NPC: scientist doctor (map prop until a shop hook exists).
 */
import * as THREE from 'three';

export const SPRITE_PATHS = {
  // Primary player set (approved mech poses). Old player_* kept only as unused files on disk.
  mech_idle: './assets/sprites/mech_idle.png?v=0.8.3',
  mech_move: './assets/sprites/mech_move.png?v=0.8.3',
  mech_move_1: './assets/sprites/mech_move_1.png?v=0.8.3',
  mech_move_2: './assets/sprites/mech_move_2.png?v=0.8.3',
  mech_attack: './assets/sprites/mech_attack.png?v=0.8.3',
  mech_defend: './assets/sprites/mech_defend.png?v=0.8.3',
  mech_hit: './assets/sprites/mech_hit.png?v=0.8.3',
  mech_victory: './assets/sprites/mech_victory.png?v=0.8.3',
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
  // ~82–85% visual scale (bump from prior ~70%)
  staffer: { w: 1.20, h: 1.70 },
  guard: { w: 1.24, h: 1.74 },
  soldier: { w: 1.40, h: 1.65 },
  officer: { w: 1.53, h: 1.78 },
  chief: { w: 1.62, h: 1.95 },
  drone: { w: 0.96, h: 0.96, float: true, flyer: true },
  walker: { w: 1.74, h: 1.87 },
  mech: { w: 1.95, h: 2.12 },
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
  const root = makeBillboard(key, size.w, size.h, {
    ringColor: RING_BY_KEY[key],
    ringRadius: Math.max(0.26, size.w * 0.26),
    float: !!size.float,
  });
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
    root.userData.halo.material.color.setHex(RING_BY_KEY[key] || 0x00e5ff);
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
  if (hit) mat.color.setRGB(1.85, 1.35, 1.35);
  else mat.color.setRGB(1, 1, 1);
  const halo = root.userData.halo;
  if (halo && halo.material) halo.material.opacity = 0.28 + move * 0.12;
}


/**
 * Vampire-Survivors-style 2D feel on a billboard:
 * bob / squash when moving, idle micro-sway when still, flip by velocity X.
 * phaseOffset keeps a swarm from syncing.
 */
export function applySpriteMotion(root, {
  moving = false,
  velX = 0,
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

  if (style === 'fly') {
    // Jet / hover: soft float, no foot-plant squash — reads as thrust, not walking.
    const hover = 0.42 + Math.sin(p * 2.4) * 0.07 * strength;
    plane.position.y = h * 0.5 + hover;
    plane.scale.y = 1 + Math.sin(p * 3.1) * 0.03 * strength;
    plane.scale.x = flipSign() * (1 - Math.sin(p * 3.1) * 0.02 * strength);
    plane.rotation.z = Math.sin(p * 2.0) * 0.05 * strength * (velX >= 0 ? 1 : -1);
    root.userData.footPlant = false;
  } else if (moving && style !== 'idle') {
    // Ground RUN: hard bob, forward lean, squash on foot-plant (impact, not float).
    const cycle = Math.sin(p * 3.6);
    const plant = Math.max(0, -cycle); // 0..1 on the down beat
    const bob = Math.abs(cycle) * 0.13 * strength;
    const squashY = 1 + plant * 0.14 * strength;       // compress into the floor
    const stretchX = 1 - plant * 0.08 * strength + Math.max(0, cycle) * 0.05 * strength;
    plane.position.y = h * 0.5 + bob;
    plane.scale.y = squashY;
    plane.scale.x = flipSign() * Math.abs(stretchX);
    // Forward lean into the charge + slight bank
    plane.rotation.z = (velX >= 0 ? 1 : -1) * (0.06 + Math.abs(cycle) * 0.1) * strength
      + Math.sin(p * 3.6) * 0.04 * strength;
    root.userData.footPlant = plant > 0.85;
    root.userData.runLean = 0.1 * strength;
  } else {
    // Idle sway / breathe — doctor & standing foes
    const sway = Math.sin(p * 1.8) * 0.045 * strength;
    const breathe = 1 + Math.sin(p * 1.1) * 0.025 * strength;
    plane.position.y = h * 0.5 + sway;
    plane.scale.y = breathe;
    plane.scale.x = flipSign() * (2 - breathe);
    plane.rotation.z = Math.sin(p * 1.15) * 0.05 * strength;
    root.userData.footPlant = false;
  }
  if (camera) billboardToCamera(root, camera, facingYaw);
  // Prefer walk velocity for left/right flip (VS-style); otherwise keep camera-relative facing.
  if (Math.abs(velX) > 0.08) {
    const sx = Math.abs(plane.scale.x) || 1;
    plane.scale.x = (velX < 0 ? -1 : 1) * sx;
  }
}
