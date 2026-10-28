/**
 * Mixamo-skinned Q hero for true-3D combat (horn).
 * Asset: assets/mechs/horn/q-hero-mixamo-walk.play.glb (meshopt+webp from Mixamo walking FBX).
 * Fallback: caller keeps baked PNG billboards if load fails.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

/**
 * Feature flag — horn combat uses Mixamo 3D when load succeeds.
 * PHONE-MENU-BLACK / MENU-NO-MESHOPT-BOOT (v0.9.201): forced false; boot uses q-hero-3d-flag.js
 * so meshopt is NOT on the module graph. This file must stay unimported until menu OK.
 * was: forced false so menu/boot never touch meshopt+webp GLB
 * (poisons WebGL on some phones even when menu never attaches Mixamo). Combat true-3D
 * paused until menu verified on Roy phone — re-enable after menu OK.
 */
export const HORN_TRUE_3D = false;

export const MIXAMO_GLB_URL = './assets/mechs/horn/q-hero-mixamo-walk.play.glb?v=0.9.200';

/** Target height ≈ prior baked sprite worldH (2.12 * ~0.83 visual). */
export const MIXAMO_FIT_H = 1.76;

/** Extra uniform scale so top-down footprint reads closer to old billboard. */
export const MIXAMO_FOOTPRINT_SCALE = 1.12;

/**
 * Mixamo faces +Z; game _facing historically used atan2 + PI for -Z procedural mechs.
 * yaw = aimYaw + MIXAMO_YAW_OFFSET.
 */
export const MIXAMO_YAW_OFFSET = 0;

/** Muzzle offset in model local space (forward +Z, up +Y). Keeps existing weapon logic. */
export const MIXAMO_MUZZLE_LOCAL = { x: 0.28, y: 0.95, z: 0.55 };

let _loader = null;
let _cache = null; // { scene, animations, error }
let _loading = null;

function getLoader() {
  if (_loader) return _loader;
  _loader = new GLTFLoader();
  if (MeshoptDecoder) {
    try { _loader.setMeshoptDecoder(MeshoptDecoder); } catch (_) { /* older */ }
  }
  return _loader;
}

async function ensureDecoder() {
  if (MeshoptDecoder && MeshoptDecoder.ready) {
    try { await MeshoptDecoder.ready; } catch (_) {}
  }
}

/** Kick off load once; safe to call from boot. */
export function preloadMixamoHero() {
  if (!HORN_TRUE_3D) return Promise.resolve(null);
  if (_cache && _cache.scene) return Promise.resolve(_cache);
  if (_loading) return _loading;
  _loading = ensureDecoder().then(() => getLoader().loadAsync(MIXAMO_GLB_URL)).then((gltf) => {
    const scene = gltf && gltf.scene;
    let meshCount = 0;
    if (scene) scene.traverse((c) => { if (c.isMesh) meshCount += 1; });
    if (!scene || meshCount === 0) {
      const err = new Error('Mixamo GLB has zero meshes');
      console.warn('[q-hero-3d] invalid GLB — keep baked sprites', err);
      _cache = { scene: null, animations: [], error: err };
      return _cache;
    }
    _cache = { scene, animations: gltf.animations || [], gltf };
    return _cache;
  }).catch((err) => {
    console.warn('[q-hero-3d] load failed — keep baked sprites', err);
    _cache = { scene: null, animations: [], error: err };
    return _cache;
  }).finally(() => { _loading = null; });
  return _loading;
}

export function mixamoReady() {
  return !!( _cache && _cache.scene );
}

export function mixamoFailed() {
  return !!( _cache && _cache.error );
}

function groundRing(color, radius, opacity = 0.32) {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.72, radius, 28),
    new THREE.MeshBasicMaterial({
      color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, fog: false,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.035;
  return m;
}

function makeStubMats() {
  const stub = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.85,
    transparent: true, opacity: 0, visible: false,
  });
  return stub;
}

/**
 * Clone cached GLB into a combat root compatible with View.setMech / sync.
 * Returns null if not loaded yet or load failed.
 */
export function buildMixamoPlayer(cfg) {
  if (!_cache || !_cache.scene) return null;
  try {
  const trim = (cfg && cfg.trim) || 0x00e5ff;
  const root = new THREE.Group();
  root.name = 'mixamoPlayer';

  const model = cloneSkinned(_cache.scene);
  let meshCount = 0;
  model.traverse((c) => {
    if (c.isMesh) {
      meshCount += 1;
      c.frustumCulled = false; // top-down; bind-pose bounds unreliable for skinned
      c.castShadow = false;
      c.receiveShadow = false;
      if (c.material) {
        const src = Array.isArray(c.material) ? c.material : [c.material];
        // Combat arena has almost no lights (sprites are MeshBasic). Convert PBR → unlit
        // so the Mixamo hero reads like the old billboards under top-down camera.
        const cloned = src.map((m) => {
          if (!m) return m;
          try {
            if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
          } catch (_) { /* map may be disposed / non-texture */ }
          const basic = new THREE.MeshBasicMaterial({
            map: (m.map && m.map.isTexture) ? m.map : null,
            color: m.color ? m.color.clone() : new THREE.Color(0xffffff),
            transparent: !!m.transparent,
            opacity: m.opacity != null ? m.opacity : 1,
            side: m.side != null ? m.side : THREE.FrontSide,
            alphaTest: m.alphaTest || 0,
            fog: false,
            depthWrite: true,
          });
          if (m.normalMap) basic.userData.normalMap = m.normalMap;
          basic.userData._baseEmissive = 0.15;
          basic.needsUpdate = true;
          return basic;
        });
        c.material = Array.isArray(c.material) ? cloned : cloned[0];
      }
    }
  });
  if (meshCount === 0) {
    console.warn('[q-hero-3d] clone has zero meshes — mark failed');
    _cache = { scene: null, animations: [], error: new Error('zero meshes after clone') };
    return null;
  }

  const wrap = new THREE.Group();
  wrap.name = 'mixamoWrap';
  wrap.add(model);
  // Height-fit to MIXAMO_FIT_H, then footprint multiplier (was unused before v0.9.199).
  try {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const h = size.y > 1e-4 ? size.y : MIXAMO_FIT_H;
    const fit = (MIXAMO_FIT_H / h) * MIXAMO_FOOTPRINT_SCALE;
    wrap.scale.setScalar(fit);
    // Ground feet on y=0 after scale (box min may be below origin).
    const box2 = new THREE.Box3().setFromObject(wrap);
    if (Number.isFinite(box2.min.y)) wrap.position.y -= box2.min.y;
  } catch (fitErr) {
    console.warn('[q-hero-3d] height fit failed — footprint only', fitErr);
    wrap.scale.setScalar(MIXAMO_FOOTPRINT_SCALE);
  }
  root.add(wrap);

  const halo = groundRing(trim, 0.46, 0.32);
  root.add(halo);

  const stub = makeStubMats();
  const mixer = new THREE.AnimationMixer(model);
  const clips = _cache.animations || [];
  const walkClip = clips[0] || null;
  const walkAction = walkClip ? mixer.clipAction(walkClip) : null;
  if (walkAction) {
    walkAction.enabled = true;
    walkAction.setEffectiveWeight(1);
    walkAction.setLoop(THREE.LoopRepeat, Infinity);
    walkAction.clampWhenFinished = false;
    walkAction.play();
    walkAction.paused = true; // idle = frozen first frame / T-pose-ish
  }

  // Invisible muzzle anchor for optional future use (bullets still use muzzle.js table)
  const muzzle = new THREE.Object3D();
  muzzle.name = 'muzzle';
  muzzle.position.set(MIXAMO_MUZZLE_LOCAL.x, MIXAMO_MUZZLE_LOCAL.y, MIXAMO_MUZZLE_LOCAL.z);
  wrap.add(muzzle);

  root.userData.isSprite = false;
  root.userData.isMixamo3d = true;
  root.userData.baked = false;
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
  root.userData.body = wrap;
  root.userData.glowL = null;
  root.userData.glowR = null;
  root.userData.animPhase = 0;
  root.userData.idlePhase = 0;
  root.userData.mechId = (cfg && (cfg.id || cfg.model)) || 'horn';
  root.userData.mixer = mixer;
  root.userData.walkAction = walkAction;
  root.userData.walkClip = walkClip;
  root.userData.mixamoModel = model;
  root.userData.mixamoWrap = wrap;
  root.userData.muzzleAnchor = muzzle;
  root.userData.ringBaseOpacity = 0.32;
  root.userData.moving = false;

  return root;
  } catch (err) {
    console.warn('[q-hero-3d] buildMixamoPlayer failed — keep baked sprites', err);
    _cache = { scene: null, animations: [], error: err };
    return null;
  }
}

/**
 * Per-frame: yaw to aim/move, play walk when moving else pause (idle/T-pose freeze).
 */
export function syncMixamoPlayer(root, {
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
  facingYaw = 0,
} = {}) {
  const ud = root && root.userData;
  if (!ud || !ud.isMixamo3d) return;

  // Prefer aim when shooting/holding; else move; else last facingYaw from View
  let yaw = facingYaw;
  if (aiming && (Math.abs(aimX) + Math.abs(aimZ)) > 0.05) {
    yaw = Math.atan2(aimX, aimZ) + MIXAMO_YAW_OFFSET;
  } else if (moving && (Math.abs(moveX) + Math.abs(moveZ)) > 0.04) {
    yaw = Math.atan2(moveX, moveZ) + MIXAMO_YAW_OFFSET;
  } else {
    yaw = facingYaw + MIXAMO_YAW_OFFSET;
  }
  // Smooth via View._facing usually; still apply directly on root
  root.rotation.set(0, yaw, 0);

  const action = ud.walkAction;
  const mixer = ud.mixer;
  const speed = Math.hypot(moveX, moveZ);
  if (action) {
    if (moving && speed > 0.08) {
      action.paused = false;
      action.setEffectiveTimeScale(THREE.MathUtils.clamp(0.85 + speed * 0.35, 0.75, 1.6));
      action.setEffectiveWeight(1);
    } else {
      // Idle: freeze near rest pose (frame 0)
      action.paused = true;
      action.time = 0;
      action.setEffectiveWeight(1);
    }
  }
  if (mixer) mixer.update(Math.max(0.001, Math.min(0.05, dt)));

  ud.moving = moving;
  ud.animPhase = (ud.animPhase || 0) + (moving ? speed * 5.5 : 0) * Math.max(0.001, Math.min(0.05, dt));

  // Flash: blink / hit via material emissive or opacity on meshes
  const wrap = ud.mixamoWrap || root;
  wrap.traverse((c) => {
    if (!c.isMesh || !c.material) return;
    const mats = Array.isArray(c.material) ? c.material : [c.material];
    for (const m of mats) {
      if (!m) continue;
      if (m.color) {
        if (hit) m.color.setRGB(1.35, 0.85, 0.85);
        else m.color.setRGB(1, 1, 1);
      }
      if ('opacity' in m && m.transparent) {
        m.opacity = blink ? 0.35 : 1;
      }
    }
  });
  if (wrap) wrap.visible = alive ? (blink ? ((ud._blinkT = (ud._blinkT || 0) + 1) % 2 === 0) : true) : true;

  const halo = ud.halo;
  if (halo && halo.material) {
    halo.material.opacity = (ud.ringBaseOpacity || 0.32) + (moving ? 0.08 : 0);
  }
}

/** World-space muzzle from local anchor (optional); else null to use table. */
export function mixamoMuzzleWorld(root, px, pz) {
  const ud = root && root.userData;
  if (!ud || !ud.muzzleAnchor) return null;
  const v = new THREE.Vector3();
  ud.muzzleAnchor.getWorldPosition(v);
  // If root not yet in scene graph, approximate from local + yaw
  if (!root.parent) {
    const yaw = root.rotation.y || 0;
    const lx = MIXAMO_MUZZLE_LOCAL.x * MIXAMO_FOOTPRINT_SCALE;
    const lz = MIXAMO_MUZZLE_LOCAL.z * MIXAMO_FOOTPRINT_SCALE;
    const c = Math.cos(yaw), s = Math.sin(yaw);
    return {
      x: px + lx * c + lz * s,
      y: MIXAMO_MUZZLE_LOCAL.y * MIXAMO_FOOTPRINT_SCALE,
      z: pz + -lx * s + lz * c,
    };
  }
  return { x: v.x, y: v.y, z: v.z };
}
