/**
 * prototypes/q-3d-white-run — SEPARATE from tip.
 * White empty stage + Mixamo walk clip + virtual stick / WASD.
 * Tip stays v0.9.205; HORN_TRUE_3D remains false on tip. No tip bump.
 *
 * Model default: assets/mechs/horn/q-hero-mixamo-walk.raw.glb
 *   (NO meshopt — phone-safe; Mixamo walk clip; webp textures)
 * Opt-in:  ?meshopt=1 → q-hero-mixamo-walk.play.glb (needs MeshoptDecoder WASM)
 * Fallback: ?fbx=1 → assets/q-hero-tripo-mixamo-walking.fbx (NOT on Pages; local only)
 * Static:   ?static=1 → assets/q-hero-tripo.glb (NOT on Pages; local only)
 *
 * IMPORTANT: do NOT static-import FBXLoader — that file is not shipped to Pages
 * and a failed module graph leaves HUD stuck on "loading…" with no error UI.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const params = new URLSearchParams(location.search);
const USE_FBX = params.get('fbx') === '1' || params.get('src') === 'fbx';
const USE_STATIC = params.get('static') === '1' || params.get('src') === 'static';
const USE_MESHOPT = params.get('meshopt') === '1' || params.get('src') === 'meshopt';
const FIT_H = Number(params.get('fitH') || '1.76') || 1.76;
const MOVE_SPEED = Number(params.get('speed') || '3.4') || 3.4;
const CAM_DIST = Number(params.get('camDist') || '6.5') || 6.5;
const CAM_HEIGHT = Number(params.get('camH') || '3.2') || 3.2;
const CAM_LOOK_Y = Number(params.get('camLookY') || '1.1') || 1.1;

const RAW_GLB = '../../assets/mechs/horn/q-hero-mixamo-walk.raw.glb';
const PLAY_GLB = '../../assets/mechs/horn/q-hero-mixamo-walk.play.glb';
const STATIC_GLB = '../../assets/q-hero-tripo.glb';
const FBX_URL = '../../assets/q-hero-tripo-mixamo-walking.fbx';
const FBX_RES = '../../assets/q-hero-tripo-mixamo-walking.fbm/';

const statusEl = document.getElementById('status');
const errEl = document.getElementById('err');
const setStatus = (t) => { if (statusEl) statusEl.textContent = t; };
const showErr = (e) => {
  console.error(e);
  if (!errEl) return;
  errEl.style.display = 'block';
  errEl.textContent = String(e && e.stack ? e.stack : e);
};

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0xffffff, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
scene.fog = new THREE.Fog(0xffffff, 28, 72);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / Math.max(1, window.innerHeight), 0.1, 200);
camera.position.set(0, CAM_HEIGHT, CAM_DIST);

const hemi = new THREE.HemisphereLight(0xffffff, 0xe8e8e8, 1.05);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.85);
sun.position.set(6, 14, 4);
scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, 0.25);
fill.position.set(-8, 6, -4);
scene.add(fill);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0.0 }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = false;
scene.add(floor);

// Soft grid so "running" reads on pure white (very light grey lines)
const grid = new THREE.GridHelper(80, 40, 0xe8e8e8, 0xf0f0f0);
grid.position.y = 0.01;
scene.add(grid);

const keys = Object.create(null);
const stick = { active: false, dx: 0, dy: 0 }; // dx=+right, dy=+down on screen → world -Z forward bias

window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

/** Virtual stick — STICK-TOUCH-SHOW style: appear under finger, hide on release. */
(function bindStick() {
  const root = document.getElementById('stick');
  const knob = document.getElementById('stick-knob');
  if (!root || !knob) return;
  let pid = null, cx = 0, cy = 0;
  const R = 56;
  const DEAD = 8;
  const HALF = 66;
  const setKnob = (x, y) => { knob.style.transform = `translate(${x}px,${y}px)`; };
  const placeAt = (x, y) => {
    let top = y - HALF;
    let left = x - HALF;
    const maxBottom = window.innerHeight - 8;
    if (top + HALF * 2 > maxBottom) top = maxBottom - HALF * 2;
    if (top < 8) top = 8;
    if (left < 4) left = 4;
    if (left + HALF * 2 > window.innerWidth - 4) left = window.innerWidth - 4 - HALF * 2;
    root.style.left = Math.round(left) + 'px';
    root.style.top = Math.round(top) + 'px';
    root.style.right = 'auto';
    root.style.bottom = 'auto';
  };
  const resetHome = () => {
    root.style.left = '';
    root.style.top = '';
    root.style.right = '';
    root.style.bottom = '';
    root.classList.remove('active');
    root.classList.add('ready-hint');
    setKnob(0, 0);
  };
  const begin = (clientX, clientY, pointerId) => {
    // Prefer left half for move stick so right stays free for future actions
    pid = pointerId;
    cx = clientX; cy = clientY;
    placeAt(cx, cy);
    setKnob(0, 0);
    stick.active = true;
    stick.dx = 0; stick.dy = 0;
    root.classList.add('active');
    root.classList.remove('ready-hint');
  };
  const onMove = (e) => {
    if (!stick.active || pid == null) return;
    if (e.pointerId != null && e.pointerId !== pid) return;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const len = Math.hypot(dx, dy) || 1;
    const cl = Math.min(len, R);
    setKnob((dx / len) * cl, (dy / len) * cl);
    if (len < DEAD) { stick.dx = 0; stick.dy = 0; }
    else {
      const mag = Math.min(1, (len - DEAD) / (R - DEAD));
      stick.dx = (dx / len) * mag;
      stick.dy = (dy / len) * mag;
    }
    if (e.cancelable) e.preventDefault();
  };
  const onUp = (e) => {
    if (pid == null) return;
    if (e && e.pointerId != null && e.pointerId !== pid) return;
    stick.active = false; stick.dx = 0; stick.dy = 0; pid = null;
    resetHome();
  };
  const onDown = (e) => {
    if (pid != null) return;
    // Left 70% of screen starts stick (right edge reserved)
    if (e.clientX > window.innerWidth * 0.72) return;
    begin(e.clientX, e.clientY, e.pointerId ?? 'mouse');
    if (e.cancelable) e.preventDefault();
  };
  window.addEventListener('pointerdown', onDown, { passive: false });
  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  root.classList.add('ready-hint');
})();

function readMove() {
  let dx = 0, dz = 0;
  if (keys.KeyW || keys.ArrowUp) dz -= 1;
  if (keys.KeyS || keys.ArrowDown) dz += 1;
  if (keys.KeyA || keys.ArrowLeft) dx -= 1;
  if (keys.KeyD || keys.ArrowRight) dx += 1;
  if (stick.active) {
    // Screen: +x right, +y down → world: +X right, -Z forward (camera behind)
    dx += stick.dx;
    dz += stick.dy;
  }
  const len = Math.hypot(dx, dz);
  if (len > 1e-4) { dx /= len; dz /= len; }
  return { dx, dz, moving: len > 0.08, mag: Math.min(1, len) };
}

function fitToGround(root, targetH) {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);
  const h = size.y > 1e-4 ? size.y : targetH;
  const fit = targetH / h;
  root.scale.setScalar(fit);
  const box2 = new THREE.Box3().setFromObject(root);
  if (Number.isFinite(box2.min.y)) root.position.y -= box2.min.y;
}

/** Mixamo walk clips translate mixamorigHips in XZ. Combined with manual
 *  heroRoot translation that fights / snaps on loop → phone flicker/stutter.
 *  Lock hips/pelvis/root XZ to the first keyframe; keep Y for vertical bob. */
function stripHorizontalRootMotion(clip) {
  if (!clip || !clip.tracks) return clip;
  if (!stripHorizontalRootMotion._logged) {
    stripHorizontalRootMotion._logged = true;
    try {
      console.log('[walk3] clip tracks', clip.tracks.map((t) => t.name));
    } catch (_) {}
  }
  // Mixamo naming variants: mixamorigHips, mixamorig:Hips, Hips, Armature|Hips, pelvis, Root
  for (const track of clip.tracks) {
    const n = track.name || '';
    if (!/\.position$/i.test(n)) continue;
    const bone = n.replace(/\.position$/i, '');
    if (!/hips|pelvis/i.test(bone) && !/(^|\||\/)root$/i.test(bone)) continue;
    const v = track.values;
    if (!v || v.length < 3) continue;
    const x0 = v[0];
    const z0 = v[2];
    for (let i = 0; i < v.length; i += 3) {
      v[i] = x0;
      v[i + 2] = z0;
    }
  }
  return clip;
}

/** Shortest-path lerp for yaw angles (avoids atan2 snap flicker on noisy stick). */
function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

async function loadHero() {
  if (USE_STATIC) {
    setStatus('loading static GLB (no clips)…');
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(STATIC_GLB);
    return { scene: gltf.scene, animations: gltf.animations || [], label: 'q-hero-tripo.glb (static)' };
  }
  if (USE_FBX) {
    setStatus('loading Mixamo FBX (dynamic import)…');
    // Dynamic import only — FBXLoader.js / fflate / NURBSCurve are not on Pages.
    let FBXLoader;
    try {
      ({ FBXLoader } = await import('three/addons/loaders/FBXLoader.js'));
    } catch (impErr) {
      throw new Error(
        'FBXLoader not available on this host (404). Use default raw GLB, or serve locally with vendor FBXLoader. ' +
        String(impErr && impErr.message ? impErr.message : impErr),
      );
    }
    const manager = new THREE.LoadingManager();
    manager.setURLModifier((url) => {
      const base = (url.split('?')[0].split('/').pop() || '');
      const known = [
        'tripo_node_dca653f3-3002-4842-afb3-95e17540c956_BaseColor.png',
        'tripo_node_dca653f3-3002-4842-afb3-95e17540c956_Normal_Bake.png',
        'futuristic_robot_figure_3d_model_metallic.PNG',
        'futuristic_robot_figure_3d_model_roughness.PNG',
      ];
      const hit = known.find((n) => n.toLowerCase() === base.toLowerCase());
      if (hit) return FBX_RES + hit;
      return url;
    });
    const loader = new FBXLoader(manager);
    loader.setResourcePath(FBX_RES);
    const obj = await loader.loadAsync(FBX_URL);
    const anims = obj.animations || [];
    return { scene: obj, animations: anims, label: 'q-hero-tripo-mixamo-walking.fbx' };
  }
  if (USE_MESHOPT) {
    setStatus('loading Mixamo play GLB (meshopt)…');
    let MeshoptDecoder;
    try {
      ({ MeshoptDecoder } = await import('three/addons/libs/meshopt_decoder.module.js'));
    } catch (impErr) {
      throw new Error('MeshoptDecoder import failed: ' + String(impErr && impErr.message ? impErr.message : impErr));
    }
    const loader = new GLTFLoader();
    if (MeshoptDecoder) {
      try { loader.setMeshoptDecoder(MeshoptDecoder); } catch (_) {}
      if (MeshoptDecoder.ready) {
        try { await MeshoptDecoder.ready; } catch (_) {}
      }
    }
    const gltf = await loader.loadAsync(PLAY_GLB);
    return {
      scene: gltf.scene,
      animations: gltf.animations || [],
      label: 'q-hero-mixamo-walk.play.glb (meshopt)',
    };
  }
  setStatus('loading Mixamo raw GLB (no meshopt)…');
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(RAW_GLB);
  return {
    scene: gltf.scene,
    animations: gltf.animations || [],
    label: 'q-hero-mixamo-walk.raw.glb (Mixamo walk)',
  };
}

const heroRoot = new THREE.Group();
heroRoot.name = 'heroRoot';
scene.add(heroRoot);

let mixer = null;
let walkAction = null;
let modelLabel = '';

try {
  const packed = await loadHero();
  modelLabel = packed.label;
  const model = packed.scene;
  model.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = false;
      c.receiveShadow = false;
      c.frustumCulled = true;
    }
  });
  heroRoot.add(model);
  fitToGround(heroRoot, FIT_H);

  mixer = new THREE.AnimationMixer(model);
  const clips = packed.animations || [];
  const walkClip = clips[0] || null;
  if (walkClip) {
    stripHorizontalRootMotion(walkClip);
    walkAction = mixer.clipAction(walkClip);
    walkAction.enabled = true;
    walkAction.setEffectiveWeight(0);
    walkAction.setLoop(THREE.LoopRepeat, Infinity);
    walkAction.clampWhenFinished = false;
    walkAction.play();
    // Keep playing at weight 0 — pause/unpause thrash reads as 閃 on phone.
    walkAction.paused = false;
    setStatus(`${modelLabel} · clip "${walkClip.name || 'walk'}" · stick/WASD to run`);
  } else {
    setStatus(`${modelLabel} · no clips — still movable via stick/WASD`);
  }
} catch (e) {
  showErr(e);
  setStatus('load failed — see error panel');
}

const camTarget = new THREE.Vector3();
const camDesired = new THREE.Vector3();
let facingYaw = 0;

function onResize() {
  const w = window.innerWidth;
  const h = Math.max(1, window.innerHeight);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
window.addEventListener('resize', onResize);
onResize();

const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta());
  const { dx, dz, moving, mag } = readMove();

  if (moving) {
    heroRoot.position.x += dx * MOVE_SPEED * mag * dt;
    heroRoot.position.z += dz * MOVE_SPEED * mag * dt;
    const targetYaw = Math.atan2(dx, dz);
    // Instant atan2 on noisy stick looks like 閃/褪 — slerp-ish angle lerp.
    facingYaw = lerpAngle(facingYaw, targetYaw, Math.min(1, dt * 14));
    heroRoot.rotation.y = facingYaw;
  }

  if (walkAction) {
    // Weight fade only. Never pause/unpause or reset time=0 (pose snap = flicker).
    const wantWalk = moving && mag > 0.12;
    const stopWalk = !moving || mag < 0.05;
    if (walkAction.paused) walkAction.paused = false;
    if (wantWalk) {
      walkAction.setEffectiveTimeScale(THREE.MathUtils.clamp(0.85 + mag * 0.55, 0.8, 1.7));
      const w = walkAction.getEffectiveWeight();
      walkAction.setEffectiveWeight(Math.min(1, w + dt * 8));
    } else if (stopWalk) {
      const w = walkAction.getEffectiveWeight();
      const next = Math.max(0, w - dt * 6);
      walkAction.setEffectiveWeight(next <= 0.01 ? 0 : next);
      // Leave clip time/pose alone when idle.
    }
  }
  if (mixer) mixer.update(dt);

  // Camera follow behind facing (slight lag)
  camDesired.set(
    heroRoot.position.x - Math.sin(facingYaw) * CAM_DIST,
    heroRoot.position.y + CAM_HEIGHT,
    heroRoot.position.z - Math.cos(facingYaw) * CAM_DIST,
  );
  camera.position.lerp(camDesired, 1 - Math.pow(0.001, dt));
  camTarget.set(heroRoot.position.x, heroRoot.position.y + CAM_LOOK_Y, heroRoot.position.z);
  camera.lookAt(camTarget);

  renderer.render(scene, camera);
}
frame();
