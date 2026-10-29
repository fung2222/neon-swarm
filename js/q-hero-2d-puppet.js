/**
 * Q hero 2D skeletal / puppet demo (v0.9.203 Q-2D-SKELETON-DEMO).
 *
 * Free Spine-like path: lightweight bone hierarchy in Three.js + canvas-drawn
 * charcoal+cyan part planes (no Spine Editor, no Mixamo, no meshopt).
 * Inspired by 蔚藍星球:國王很忙 style layered 2D bone motion — inside 暴走機甲.
 *
 * Menu / Start stay on buildPlayerMech procedural path (0.9.200–202).
 * HORN_TRUE_3D stays false — this module never imports q-hero-3d.js.
 */
import * as THREE from 'three';
import { HORN_MUZZLE_BY_DIR, yawToCardinal, muzzleWorld } from './muzzle.js';

/** Combat-only 2D skeleton for player horn. Keep true for this tip. */
export const HORN_2D_SKELETON = true;

const W = 1.78;
const H = 2.12;

const COL = {
  // Readable mid plates on near-black arena (dark charcoal vanished → cyan edge-only).
  plate: '#6a7a92',
  plateHi: '#9aacc4',
  edge: '#00e5ff',
  visor: '#b8fbff',
  dark: '#2a3548',
  hot: '#ffe66a',
};

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function makePartTex(draw, size = 128) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.premultiplyAlpha = false;
  tex.needsUpdate = true;
  return tex;
}

function partMat(tex) {
  return new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.08,
    side: THREE.DoubleSide,
    depthWrite: true,
    color: 0xffffff,
    fog: false,
  });
}

function partMesh(tex, w, h, name) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), partMat(tex));
  m.name = name;
  return m;
}

function bone(name, x = 0, y = 0) {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(x, y, 0);
  return g;
}

function drawPlateLimb(ctx, s, opts = {}) {
  const { tip = false, thin = false } = opts;
  const w = thin ? s * 0.46 : s * 0.58;
  const h = tip ? s * 0.78 : s * 0.84;
  const x = (s - w) / 2;
  const y = (s - h) / 2;
  ctx.fillStyle = COL.plate;
  roundRect(ctx, x, y, w, h, s * 0.1);
  ctx.fill();
  ctx.fillStyle = COL.plateHi;
  roundRect(ctx, x + w * 0.12, y + h * 0.12, w * 0.55, h * 0.7, s * 0.06);
  ctx.fill();
  ctx.strokeStyle = COL.edge;
  ctx.lineWidth = Math.max(3, s * 0.045);
  roundRect(ctx, x + 1, y + 1, w - 2, h - 2, s * 0.09);
  ctx.stroke();
  // hinge dot
  ctx.fillStyle = COL.edge;
  ctx.beginPath();
  ctx.arc(s * 0.5, y + h * 0.1, s * 0.06, 0, Math.PI * 2);
  ctx.fill();
}

function buildPartLibrary() {
  const head = makePartTex((ctx, s) => {
    // helmet
    ctx.fillStyle = COL.plate;
    roundRect(ctx, s * 0.22, s * 0.38, s * 0.56, s * 0.42, s * 0.1);
    ctx.fill();
    // crest / horn swept back
    ctx.fillStyle = COL.plateHi;
    ctx.beginPath();
    ctx.moveTo(s * 0.42, s * 0.42);
    ctx.lineTo(s * 0.5, s * 0.08);
    ctx.lineTo(s * 0.62, s * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COL.edge;
    ctx.lineWidth = Math.max(2, s * 0.03);
    ctx.beginPath();
    ctx.moveTo(s * 0.46, s * 0.4);
    ctx.lineTo(s * 0.5, s * 0.12);
    ctx.lineTo(s * 0.58, s * 0.4);
    ctx.stroke();
    // visor slit
    ctx.fillStyle = COL.visor;
    roundRect(ctx, s * 0.3, s * 0.52, s * 0.4, s * 0.08, s * 0.03);
    ctx.fill();
    // chin plate
    ctx.fillStyle = COL.dark;
    roundRect(ctx, s * 0.34, s * 0.68, s * 0.32, s * 0.1, s * 0.04);
    ctx.fill();
    ctx.strokeStyle = COL.edge;
    ctx.lineWidth = Math.max(2, s * 0.028);
    roundRect(ctx, s * 0.22, s * 0.38, s * 0.56, s * 0.42, s * 0.1);
    ctx.stroke();
  });

  const torso = makePartTex((ctx, s) => {
    ctx.fillStyle = COL.plate;
    // tapered torso
    ctx.beginPath();
    ctx.moveTo(s * 0.22, s * 0.18);
    ctx.lineTo(s * 0.78, s * 0.18);
    ctx.lineTo(s * 0.7, s * 0.82);
    ctx.lineTo(s * 0.3, s * 0.82);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COL.edge;
    ctx.lineWidth = Math.max(2, s * 0.032);
    ctx.stroke();
    // chest core
    ctx.fillStyle = COL.visor;
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.42, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COL.hot;
    ctx.lineWidth = Math.max(1.5, s * 0.02);
    ctx.stroke();
    // plate seams
    ctx.strokeStyle = COL.edge;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(s * 0.35, s * 0.55);
    ctx.lineTo(s * 0.65, s * 0.55);
    ctx.moveTo(s * 0.38, s * 0.68);
    ctx.lineTo(s * 0.62, s * 0.68);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, 160);

  const upper = makePartTex((ctx, s) => drawPlateLimb(ctx, s, { thin: true }));
  const forearm = makePartTex((ctx, s) => drawPlateLimb(ctx, s, { thin: true, tip: true }));
  const thigh = makePartTex((ctx, s) => drawPlateLimb(ctx, s, {}));
  const shin = makePartTex((ctx, s) => drawPlateLimb(ctx, s, { tip: true }));
  const foot = makePartTex((ctx, s) => {
    ctx.fillStyle = COL.plateHi;
    roundRect(ctx, s * 0.18, s * 0.42, s * 0.64, s * 0.28, s * 0.06);
    ctx.fill();
    ctx.strokeStyle = COL.edge;
    ctx.lineWidth = Math.max(2, s * 0.03);
    ctx.stroke();
    ctx.fillStyle = COL.dark;
    roundRect(ctx, s * 0.22, s * 0.55, s * 0.56, s * 0.1, s * 0.03);
    ctx.fill();
  }, 96);

  const weapon = makePartTex((ctx, s) => {
    // mid rifle silhouette
    ctx.fillStyle = COL.dark;
    roundRect(ctx, s * 0.12, s * 0.42, s * 0.72, s * 0.16, s * 0.04);
    ctx.fill();
    ctx.fillStyle = COL.plateHi;
    roundRect(ctx, s * 0.18, s * 0.38, s * 0.28, s * 0.24, s * 0.04);
    ctx.fill();
    // barrel
    ctx.fillStyle = COL.plate;
    roundRect(ctx, s * 0.68, s * 0.46, s * 0.22, s * 0.08, s * 0.02);
    ctx.fill();
    ctx.strokeStyle = COL.edge;
    ctx.lineWidth = Math.max(2, s * 0.025);
    roundRect(ctx, s * 0.12, s * 0.42, s * 0.72, s * 0.16, s * 0.04);
    ctx.stroke();
    // muzzle glow
    ctx.fillStyle = COL.visor;
    ctx.beginPath();
    ctx.arc(s * 0.9, s * 0.5, s * 0.045, 0, Math.PI * 2);
    ctx.fill();
  }, 160);

  const pad = makePartTex((ctx, s) => {
    ctx.fillStyle = COL.plateHi;
    roundRect(ctx, s * 0.2, s * 0.3, s * 0.6, s * 0.4, s * 0.1);
    ctx.fill();
    ctx.strokeStyle = COL.edge;
    ctx.lineWidth = Math.max(2, s * 0.035);
    ctx.stroke();
  }, 96);

  return { head, torso, upper, forearm, thigh, shin, foot, weapon, pad };
}

function groundRing(color, radius, opacity = 0.4) {
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

/**
 * Build charcoal+cyan 2D bone puppet for player horn (combat only).
 * Parts are canvas PNGs parented under Groups (bones). Phone-safe: no FBX/GLB/meshopt.
 */
export function buildHorn2dPuppet(cfg) {
  const trim = (cfg && cfg.trim) || 0x00e5ff;
  const lib = buildPartLibrary();

  const root = new THREE.Group();
  root.name = 'horn2dPuppet';

  // Paper-doll space: Y up, parts face +Z; root billboards so +Z faces camera.
  const doll = new THREE.Group();
  doll.name = 'puppetDoll';
  // Lift so feet plant near y=0 after scale
  doll.position.y = 0.02;
  root.add(doll);

  const hips = bone('hips', 0, 0.95);
  doll.add(hips);

  const torsoB = bone('torso', 0, 0.08);
  hips.add(torsoB);
  const torsoM = partMesh(lib.torso, 0.72, 0.9, 'torsoMesh');
  torsoM.position.y = 0.32;
  torsoB.add(torsoM);

  const headB = bone('head', 0, 0.7);
  torsoB.add(headB);
  const headM = partMesh(lib.head, 0.55, 0.55, 'headMesh');
  headM.position.y = 0.16;
  headB.add(headM);

  // Arms
  const shoulderL = bone('shoulderL', -0.28, 0.55);
  const shoulderR = bone('shoulderR', 0.28, 0.55);
  torsoB.add(shoulderL, shoulderR);
  shoulderL.add(partMesh(lib.pad, 0.3, 0.24, 'padL'));
  shoulderR.add(partMesh(lib.pad, 0.3, 0.24, 'padR'));

  const upperL = bone('upperArmL', 0, -0.02);
  const upperR = bone('upperArmR', 0, -0.02);
  shoulderL.add(upperL);
  shoulderR.add(upperR);
  const uL = partMesh(lib.upper, 0.28, 0.46, 'upperL');
  uL.position.y = -0.16;
  upperL.add(uL);
  const uR = partMesh(lib.upper, 0.28, 0.46, 'upperR');
  uR.position.y = -0.16;
  upperR.add(uR);

  const foreL = bone('foreArmL', 0, -0.34);
  const foreR = bone('foreArmR', 0, -0.34);
  upperL.add(foreL);
  upperR.add(foreR);
  const fL = partMesh(lib.forearm, 0.26, 0.4, 'foreL');
  fL.position.y = -0.14;
  foreL.add(fL);
  const fR = partMesh(lib.forearm, 0.26, 0.4, 'foreR');
  fR.position.y = -0.14;
  foreR.add(fR);

  const weaponB = bone('weapon', 0.02, -0.28);
  foreR.add(weaponB);
  const wM = partMesh(lib.weapon, 0.9, 0.34, 'weaponMesh');
  wM.position.set(0.22, 0, 0.02);
  wM.renderOrder = 2;
  weaponB.add(wM);

  // Legs
  const hipL = bone('hipL', -0.12, -0.02);
  const hipR = bone('hipR', 0.12, -0.02);
  hips.add(hipL, hipR);

  const thighL = bone('thighL', 0, 0);
  const thighR = bone('thighR', 0, 0);
  hipL.add(thighL);
  hipR.add(thighR);
  const tL = partMesh(lib.thigh, 0.3, 0.52, 'thighL');
  tL.position.y = -0.2;
  thighL.add(tL);
  const tR = partMesh(lib.thigh, 0.3, 0.52, 'thighR');
  tR.position.y = -0.2;
  thighR.add(tR);

  const shinL = bone('shinL', 0, -0.4);
  const shinR = bone('shinR', 0, -0.4);
  thighL.add(shinL);
  thighR.add(shinR);
  const sL = partMesh(lib.shin, 0.28, 0.5, 'shinL');
  sL.position.y = -0.18;
  shinL.add(sL);
  const sR = partMesh(lib.shin, 0.28, 0.5, 'shinR');
  sR.position.y = -0.18;
  shinR.add(sR);

  const footL = bone('footL', 0, -0.38);
  const footR = bone('footR', 0, -0.38);
  shinL.add(footL);
  shinR.add(footR);
  const ftL = partMesh(lib.foot, 0.36, 0.18, 'footL');
  ftL.position.set(0, -0.02, 0.02);
  footL.add(ftL);
  const ftR = partMesh(lib.foot, 0.36, 0.18, 'footR');
  ftR.position.set(0, -0.02, 0.02);
  footR.add(ftR);

  const halo = groundRing(trim, 0.46, 0.32);
  root.add(halo);

  // Invisible primary plane for flash / billboard helpers that expect userData.plane
  const stubTex = makePartTex((ctx, s) => { /* empty */ }, 8);
  const stubMat = partMat(stubTex);
  stubMat.opacity = 0;
  stubMat.transparent = true;
  stubMat.depthWrite = false;
  stubMat.visible = false;
  const stubPlane = new THREE.Mesh(new THREE.PlaneGeometry(W, H), stubMat);
  stubPlane.position.y = H * 0.5;
  stubPlane.visible = false;
  stubPlane.name = 'puppetStubPlane';
  root.add(stubPlane);

  const flashStub = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.85,
    transparent: true, opacity: 0, visible: false,
  });

  const bones = {
    hips, torso: torsoB, head: headB,
    shoulderL, shoulderR, upperL, upperR, foreL, foreR, weapon: weaponB,
    hipL, hipR, thighL, thighR, shinL, shinR, footL, footR,
  };

  // Rest pose baselines (radians, local Z)
  const rest = {
    thighL: 0.08, thighR: -0.08,
    shinL: 0.06, shinR: -0.04,
    upperL: 0.15, upperR: -0.2,
    foreL: 0.1, foreR: 0.35,
    weapon: -0.15,
    torso: 0, head: 0, hips: 0,
  };
  for (const [k, v] of Object.entries(rest)) {
    if (bones[k]) bones[k].rotation.z = v;
  }

  root.userData.isSprite = true;
  root.userData.isPuppet2d = true;
  root.userData.baked = false;
  root.userData.puppetBones = bones;
  root.userData.puppetRest = rest;
  root.userData.puppetDoll = doll;
  root.userData.plane = stubPlane;
  root.userData.spriteMat = stubMat;
  root.userData.spriteKey = 'horn_2d_puppet';
  root.userData.spriteW = W;
  root.userData.spriteH = H;
  root.userData.halo = halo;
  root.userData.hullMats = [flashStub];
  root.userData.coreMats = [flashStub];
  root.userData.thrusterMats = [];
  root.userData.legs = [thighL, thighR];
  root.userData.shins = [shinL, shinR];
  root.userData.foots = [footL, footR];
  root.userData.arms = [upperL, upperR];
  root.userData.fists = [foreL, foreR];
  root.userData.head = headB;
  root.userData.body = torsoB;
  root.userData.glowL = null;
  root.userData.glowR = null;
  root.userData.animPhase = 0;
  root.userData.idlePhase = 0;
  root.userData.attackKick = 0;
  root.userData.bob = false;
  root.userData.baseY = 0;
  root.userData.mechId = 'horn';
  root.userData.playerState = 'idle';
  root.userData.muzzleByDir = HORN_MUZZLE_BY_DIR;
  root.userData.ringBaseOpacity = 0.32;
  // Scale doll to ~worldH
  doll.scale.setScalar(1.35);
  root.scale.setScalar(1);
  return root;
}

/**
 * Animate puppet: idle breathe, walk cycle, attack kick on fire.
 * Root billboards to camera; facing flips via doll.scale.x.
 */
export function syncHorn2dPuppet(root, {
  moveX = 0,
  moveZ = 0,
  moving = false,
  aimX = 0,
  aimZ = 1,
  aiming = false,
  firing = false,
  hit = false,
  blink = false,
  alive = true,
  dt = 0.016,
  camera = null,
  t = 0,
} = {}) {
  const ud = root && root.userData;
  if (!ud || !ud.isPuppet2d) return;
  const B = ud.puppetBones;
  const R = ud.puppetRest;
  const dtp = Math.max(0.001, Math.min(0.05, dt));

  if (!alive) {
    // Collapse pose
    B.hips.rotation.z = 0.4;
    B.torso.rotation.z = 0.5;
    B.head.rotation.z = 0.3;
    ud.playerState = 'death';
  } else {
    const spd = Math.hypot(moveX, moveZ);
    if (moving && spd > 0.04) {
      ud.animPhase = (ud.animPhase || 0) + Math.max(0.4, spd) * 9.5 * dtp;
      ud.playerState = 'walk';
    } else {
      ud.animPhase = (ud.animPhase || 0) * 0.9;
      ud.playerState = firing ? 'attack' : (aiming ? 'aim' : 'idle');
    }
    ud.idlePhase = t * 2.2;

    const ph = ud.animPhase || 0;
    const breath = Math.sin(ud.idlePhase) * 0.025;

    if (moving && spd > 0.04) {
      // Walk cycle — opposite legs / arms
      const swing = Math.sin(ph) * 0.55;
      const shinKick = Math.max(0, Math.sin(ph)) * 0.35;
      const shinKickB = Math.max(0, Math.sin(ph + Math.PI)) * 0.35;
      B.thighL.rotation.z = R.thighL + swing;
      B.thighR.rotation.z = R.thighR - swing;
      B.shinL.rotation.z = R.shinL + shinKick;
      B.shinR.rotation.z = R.shinR + shinKickB;
      B.upperL.rotation.z = R.upperL - swing * 0.7;
      B.upperR.rotation.z = R.upperR + swing * 0.55;
      B.foreL.rotation.z = R.foreL + Math.abs(swing) * 0.2;
      B.foreR.rotation.z = R.foreR + Math.abs(swing) * 0.15;
      B.hips.rotation.z = swing * 0.06;
      B.torso.rotation.z = R.torso - swing * 0.05;
      B.head.rotation.z = R.head + swing * 0.04;
      // slight vertical bob on doll
      ud.puppetDoll.position.y = 0.02 + Math.abs(Math.sin(ph)) * 0.03;
    } else {
      // Idle breathe
      B.thighL.rotation.z = R.thighL + breath * 0.4;
      B.thighR.rotation.z = R.thighR - breath * 0.4;
      B.shinL.rotation.z = R.shinL;
      B.shinR.rotation.z = R.shinR;
      B.upperL.rotation.z = R.upperL + breath;
      B.upperR.rotation.z = R.upperR - breath * 0.6;
      B.foreL.rotation.z = R.foreL;
      B.foreR.rotation.z = R.foreR;
      B.hips.rotation.z = breath * 0.3;
      B.torso.rotation.z = R.torso + breath * 0.5;
      B.head.rotation.z = R.head - breath * 0.4;
      ud.puppetDoll.position.y = 0.02 + Math.sin(ud.idlePhase * 0.5) * 0.012;
    }

    // Attack kick — weapon arm snap on fire
    if (firing) ud.attackKick = 1;
    else ud.attackKick = (ud.attackKick || 0) * Math.pow(0.001, dtp); // fast decay
    const kick = ud.attackKick || 0;
    if (kick > 0.02 || aiming) {
      B.upperR.rotation.z = (moving ? B.upperR.rotation.z : R.upperR) - 0.35 * kick - (aiming ? 0.12 : 0);
      B.foreR.rotation.z = R.foreR - 0.55 * kick;
      B.weapon.rotation.z = R.weapon - 0.4 * kick;
      B.torso.rotation.z += -0.08 * kick;
    } else {
      B.weapon.rotation.z = R.weapon;
    }
  }

  // Billboard doll to camera (halo stays world-flat on root). Bone Z-rotations stay in paper-doll plane.
  root.rotation.set(0, 0, 0);
  if (camera && ud.puppetDoll) {
    ud.puppetDoll.quaternion.copy(camera.quaternion);
  }

  const flipSrc = (aiming || firing) ? aimX : moveX;
  if (ud.puppetDoll) {
    const base = Math.abs(ud.puppetDoll.userData.baseScaleX || ud.puppetDoll.scale.x) || 1;
    ud.puppetDoll.userData.baseScaleX = base;
    if (Math.abs(flipSrc) > 0.08) {
      ud.puppetDoll.scale.x = (flipSrc < 0 ? -1 : 1) * base;
    } else {
      ud.puppetDoll.scale.x = Math.sign(ud.puppetDoll.scale.x || 1) * base || base;
    }
  }

  // Flash / blink via doll mesh material tint
  ud.puppetDoll.traverse((o) => {
    if (!o.isMesh || !o.material || !o.material.color) return;
    if (blink) {
      o.material.opacity = 0.35;
      o.material.transparent = true;
    } else {
      o.material.opacity = 1;
      if (hit) o.material.color.setRGB(1.15, 0.95, 0.95);
      else o.material.color.setRGB(1, 1, 1);
    }
  });

  if (ud.halo) {
    ud.halo.material.opacity = (ud.ringBaseOpacity || 0.32) + (moving ? 0.08 : 0);
  }
}

/** Muzzle world — reuse shared table (honest 8-dir). */
export function puppetMuzzleWorld(root, px, pz, aimX, aimZ) {
  const ud = root && root.userData;
  const byDir = (ud && ud.muzzleByDir) || HORN_MUZZLE_BY_DIR;
  const m = muzzleWorld(px, pz, aimX, aimZ, { byDir });
  return { x: m.x, y: m.y, z: m.z };
}

export { yawToCardinal };
