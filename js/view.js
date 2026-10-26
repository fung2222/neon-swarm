import * as THREE from 'three';
import { buildPlayerMech } from './mech-builder.js';
import { ARENA, ENEMIES, DROP, MECH_BY_ID, WEAPON_SHOT, AMMO_PATHS, WEAPON_DROP_LABEL, ARTILLERY, BOMBER, FLANKER, MEDIC, JAMMER, DANGER_PULSE, ZONE_PRESSURE } from './config.js';
import {
  preloadAllSprites,
  buildPlayerSprite,
  buildEnemySprite,
  retargetEnemySprite,
  buildDoctorNpc,
  billboardToCamera,
  applySpriteFlash,
  applySpriteMotion,
  syncBakedPlayerSprite,
} from './sprites.js';

// ---------------------------------------------------------------------------
// Shared materials. Everything is a lit standard material plus an emissive edge so
// silhouettes stay readable on a dark floor without washing out under bloom.
// ---------------------------------------------------------------------------
const mat = (c, e = 0.7) => new THREE.MeshStandardMaterial({
  color: c, emissive: c, emissiveIntensity: e, roughness: 0.35, metalness: 0.4,
});
const hullMat = (c, e = 0.35) => new THREE.MeshStandardMaterial({
  color: c, emissive: c, emissiveIntensity: e, roughness: 0.42, metalness: 0.62,
});
const glowMat = (c, e = 1.2) => new THREE.MeshBasicMaterial({ color: c });
const flatMat = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 1 });

/** Thin emissive strip: the "panel seam" that gives a mech a built, commercial read. */
function seam(w, h, d, color, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glowMat(color));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

/**
 * Player frame builder — three selectable silhouettes sharing one rig so animation,
 * hit flash and pooling all keep working:
 *   horn    violet horned assault frame (palette homage only)
 *   heavy   white/blue heavy assault frame with shoulder cannons (palette homage only)
 *   proto   original neon prototype with an offset visor
 * `cfg` is a MECHS entry: { plate, accent, trim, hot, visor }.
 */
// ---------------------------------------------------------------------------
// Geometry helpers — beveled boxes and wedges are what make a block read as a
// modelled mecha pauldron instead of a raw cube.
// ---------------------------------------------------------------------------
function beveledGeo(w, h, d, bevel = 0.08) {
  const g = new THREE.BoxGeometry(w, h, d);
  const pos = g.attributes.position;
  const signs = [];
  for (let i = 0; i < pos.count; i++) {
    signs.push([Math.sign(pos.getX(i)), Math.sign(pos.getY(i)), Math.sign(pos.getZ(i))]);
  }
  const min = Math.min(w, h, d) * bevel;
  for (let i = 0; i < pos.count; i++) {
    const [sx, sy, sz] = signs[i];
    pos.setXYZ(i, (sx * (w / 2 - min)) + sx * min, (sy * (h / 2 - min)) + sy * min, (sz * (d / 2 - min)) + sz * min);
  }
  g.computeVertexNormals();
  return g;
}

function box(w, h, d, material, x = 0, y = 0, z = 0, bevel = 0.08) {
  const m = new THREE.Mesh(beveledGeo(w, h, d, bevel), material);
  m.position.set(x, y, z);
  return m;
}

/** Trapezoid slab (top narrower than bottom, or vice versa) — pauldrons, shins, skirts. */
function slab(wTop, wBottom, h, d, material, taperBack = 0) {
  const g = new THREE.BoxGeometry(1, 1, 1);
  g.scale(wBottom, h, d);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y > 0) pos.setX(i, pos.getX(i) * (wTop / wBottom));
    if (taperBack) pos.setZ(i, pos.getZ(i) - (y > 0 ? 0 : taperBack));
  }
  g.computeVertexNormals();
  return new THREE.Mesh(g, material);
}

/** Cylinder cast as a tapered joint / thruster muzzle. */
function cyl(rTop, rBottom, h, material, seg = 12) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg), material);
}

// buildPlayerMech lives in ./mech-builder.js (select + bake source of truth)

// ---------------------------------------------------------------------------
// Hostiles: humans first (the lab), mechs / drones as their support.
// Every silhouette carries its own accent colour (ring + visor) so a unit never disappears into
// the dark blue floor, and tiers differ in mass, not just hue.
// ---------------------------------------------------------------------------

/** Flat ground ring in the unit's accent colour — the "I am here" read at phone distance. */
function unitRing(color, radius, opacity = 0.55) {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.72, radius, 28),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.035;
  return m;
}

function humanMesh(kind, color, coat) {
  const g = new THREE.Group();
  const clothC = clothColor(kind, coat);
  const cloth = new THREE.MeshStandardMaterial({ color: clothC, emissive: clothC, emissiveIntensity: 0.5, roughness: 0.7, metalness: 0.12 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xf1cfa8, emissive: 0x6a4a30, emissiveIntensity: 0.15, roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2c3450, emissive: 0x1b2338, emissiveIntensity: 0.45, roughness: 0.65, metalness: 0.45 });
  const accent = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.85, roughness: 0.35 });
  const scale = kind === 'chief' ? 2.15 : kind === 'officer' ? 2.0 : kind === 'soldier' ? 1.9 : kind === 'guard' ? 1.85 : 1.75;
  const legs = [];
  const arms = [];

  // ---- legs with boots
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.07, -0.2, 0);
    const thigh = box(0.09, 0.2, 0.1, dark, 0, -0.06, 0);
    const boot = box(0.1, 0.12, 0.13, kind === 'soldier' || kind === 'officer' ? dark : cloth, 0, -0.2, 0.01);
    leg.add(thigh, boot);
    g.add(leg);
    legs.push(leg);
  }
  // ---- torso: uniform coat with an accent chest stripe
  const torso = slab(0.22, 0.25, 0.3, 0.15, cloth);
  torso.position.set(0, 0.11, 0);
  const stripe = box(0.2, 0.025, 0.02, accent, 0, 0.18, 0.08);
  const belt = box(0.24, 0.045, 0.16, dark, 0, -0.02, 0);
  g.add(torso, stripe, belt);
  // lab coat tail for scientists
  if (kind === 'staffer' || kind === 'chief') {
    const tail = slab(0.22, 0.26, 0.2, 0.03, cloth);
    tail.position.set(0, -0.04, -0.09);
    tail.rotation.x = -0.18;
    g.add(tail);
  }
  if (kind === 'soldier' || kind === 'officer') {
    const vest = box(0.24, 0.2, 0.16, dark, 0, 0.14, 0);
    const shoulder = box(0.26, 0.05, 0.16, accent, 0, 0.25, 0);
    g.add(vest, shoulder);
    const pack = box(0.18, 0.2, 0.09, dark, 0, 0.12, -0.13);
    g.add(pack);
  }
  // Phase 3: security guard — armored vest + radio + distinct from white-coat staffer
  if (kind === 'guard') {
    const vest = box(0.26, 0.22, 0.17, dark, 0, 0.12, 0);
    const plate = box(0.18, 0.12, 0.04, accent, 0, 0.14, 0.09);
    const shoulder = box(0.30, 0.05, 0.14, accent, 0, 0.24, 0);
    const radio = box(0.06, 0.12, 0.05, dark, -0.14, 0.22, -0.02);
    const antenna = box(0.015, 0.14, 0.015, accent, -0.14, 0.34, -0.02);
    g.add(vest, plate, shoulder, radio, antenna);
  }

  // ---- head: skin + helmet / cap + glowing eyewear
  const head = new THREE.Group();
  head.position.set(0, 0.38, 0);
  head.add(box(0.15, 0.16, 0.15, skin, 0, 0, 0, 0.2));
  if (kind === 'staffer' || kind === 'chief' || kind === 'officer') {
    const hair = box(0.16, 0.05, 0.16, dark, 0, 0.09, -0.01, 0.2);
    const specs = box(0.14, 0.03, 0.02, accent, 0, 0.01, 0.08, 0.2);
    head.add(hair, specs);
  }
  if (kind === 'soldier' || kind === 'officer') {
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.7), dark);
    helm.position.set(0, 0.04, 0);
    const visor = box(0.15, 0.04, 0.03, accent, 0, 0.0, 0.09, 0.2);
    head.add(helm, visor);
  }
  if (kind === 'guard') {
    // security cap + goggles — reads as armed chase, not lab coat
    const cap = box(0.17, 0.05, 0.16, dark, 0, 0.09, 0, 0.15);
    const brim = box(0.18, 0.02, 0.07, dark, 0, 0.07, 0.08, 0.15);
    const gog = box(0.14, 0.035, 0.03, accent, 0, 0.01, 0.08, 0.2);
    head.add(cap, brim, gog);
  }
  if (kind === 'chief') {
    const cap = box(0.17, 0.05, 0.17, accent, 0, 0.1, 0, 0.2);
    const brim = box(0.18, 0.02, 0.06, accent, 0, 0.08, 0.1, 0.2);
    head.add(cap, brim);
  }
  g.add(head);

  // ---- arms (right hand carries the weapon)
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.15, 0.2, 0);
    const upper = box(0.065, 0.24, 0.07, cloth, 0, -0.11, 0, 0.2);
    const hand = box(0.06, 0.06, 0.06, skin, 0, -0.24, 0.02, 0.3);
    arm.add(upper, hand);
    if (side === 1 && kind !== 'staffer') {
      const gun = box(0.05, 0.05, 0.28, dark, 0, -0.25, 0.14, 0.2);
      const tip = box(0.03, 0.03, 0.03, accent, 0, -0.25, 0.29, 0.2);
      arm.add(gun, tip);
      arm.rotation.x = -0.5;
    }
    if (side === -1 && kind === 'staffer') {
      const clip = box(0.12, 0.16, 0.02, dark, 0, -0.26, 0.04, 0.15);
      arm.add(clip);
    }
    g.add(arm);
    arms.push(arm);
  }

  if (kind === 'chief') {
    const aura = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.02, 6, 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 })
    );
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.05;
    g.add(aura);
  }
  // v0.9.22 Phase 2: ordinary grunts — no ground rings; chief/officer keep identity.
  if (kind === 'chief') g.add(unitRing(color, 0.42, 0.52));
  else if (kind === 'officer') g.add(unitRing(color, 0.36, 0.34));

  g.scale.setScalar(scale);
  g.userData.legs = legs;
  g.userData.arms = arms;
  g.userData.type = kind;
  return g;
}

function clothColor(kind, coat) {
  if (kind === 'staffer') return 0xeef2fb;      // white lab coat
  if (kind === 'chief') return 0xffe9c4;        // warm lab coat
  if (kind === 'officer') return 0x6b2f6e;      // plum command uniform
  if (kind === 'soldier') return 0x4a7f99;      // slate-blue combat uniform, bright enough to read
  if (kind === 'guard') return 0x2a3548;       // dark security uniform (vest/helmet carry silhouette)
  return coat || 0x2b3350;
}

/**
 * Phase 3 sniper: lean marksman + long rifle + scope (silhouette ≠ soldier/officer).
 * Dark olive cloth, crimson trim — red reserved for aim telegraph line.
 */
function sniperMesh() {
  const g = new THREE.Group();
  const color = 0xc93a4a;
  const clothC = 0x2f3a2c;
  const cloth = new THREE.MeshStandardMaterial({ color: clothC, emissive: clothC, emissiveIntensity: 0.45, roughness: 0.75, metalness: 0.15 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xf1cfa8, emissive: 0x6a4a30, emissiveIntensity: 0.15, roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1c2218, emissive: 0x10140e, emissiveIntensity: 0.4, roughness: 0.6, metalness: 0.5 });
  const accent = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9, roughness: 0.35 });
  const legs = [];
  const arms = [];

  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.065, -0.2, 0);
    leg.add(box(0.08, 0.22, 0.09, dark, 0, -0.06, 0));
    leg.add(box(0.09, 0.11, 0.14, dark, 0, -0.22, 0.02));
    g.add(leg);
    legs.push(leg);
  }

  // Lean torso + cloak cape (reads longer than soldier vest)
  const torso = slab(0.18, 0.22, 0.28, 0.14, cloth);
  torso.position.set(0, 0.12, 0);
  const stripe = box(0.16, 0.02, 0.02, accent, 0, 0.2, 0.08);
  const belt = box(0.2, 0.04, 0.14, dark, 0, -0.02, 0);
  const cape = slab(0.2, 0.24, 0.28, 0.04, dark);
  cape.position.set(0, 0.02, -0.1);
  cape.rotation.x = -0.22;
  g.add(torso, stripe, belt, cape);

  // Hooded head + optic
  const head = new THREE.Group();
  head.position.set(0, 0.4, 0);
  head.add(box(0.13, 0.14, 0.13, skin, 0, 0, 0, 0.2));
  const hood = box(0.16, 0.08, 0.16, dark, 0, 0.06, -0.01, 0.15);
  const optic = box(0.12, 0.03, 0.04, accent, 0, 0.01, 0.08, 0.2);
  head.add(hood, optic);
  g.add(head);

  // Arms — right carries LONG rifle (≈2× soldier gun)
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.14, 0.2, 0);
    arm.add(box(0.06, 0.22, 0.06, cloth, 0, -0.1, 0, 0.2));
    arm.add(box(0.055, 0.055, 0.055, skin, 0, -0.22, 0.02, 0.3));
    if (side === 1) {
      const rifle = new THREE.Group();
      rifle.position.set(0, -0.22, 0.08);
      // barrel + receiver + stock + scope + bipod — readable long-gun silhouette
      rifle.add(box(0.04, 0.04, 0.62, dark, 0, 0, 0.22, 0.15)); // long barrel
      rifle.add(box(0.055, 0.06, 0.18, dark, 0, 0.01, -0.02, 0.15)); // receiver
      rifle.add(box(0.045, 0.05, 0.14, dark, 0, -0.01, -0.16, 0.15)); // stock
      rifle.add(box(0.035, 0.05, 0.08, accent, 0, 0.06, 0.02, 0.2)); // scope
      rifle.add(box(0.02, 0.08, 0.02, dark, -0.04, -0.05, 0.28, 0.15)); // bipod L
      rifle.add(box(0.02, 0.08, 0.02, dark, 0.04, -0.05, 0.28, 0.15)); // bipod R
      rifle.add(box(0.03, 0.03, 0.03, accent, 0, 0, 0.54, 0.2)); // muzzle tip
      arm.add(rifle);
      arm.rotation.x = -0.85;
      arm.userData.rifle = rifle;
    } else {
      // support hand forward
      arm.rotation.x = -0.55;
    }
    g.add(arm);
    arms.push(arm);
  }

  // Thin identity ring (danger-adjacent crimson, low opacity — not grunt-off)
  g.add(unitRing(color, 0.34, 0.28));
  g.scale.setScalar(1.95);
  g.userData.legs = legs;
  g.userData.arms = arms;
  g.userData.type = 'sniper';
  g.userData.sniper = true;
  return g;
}


/**
 * Phase 3 shield guard: stocky body + LARGE front shield plate (silhouette ≠ walker/soldier).
 * Steel-blue plate, navy cloth — red reserved for bash contact telegraph.
 */
function shieldMesh() {
  const g = new THREE.Group();
  const color = 0x6a8cff;
  const clothC = 0x243048;
  const steel = 0x8aa0c8;
  const cloth = new THREE.MeshStandardMaterial({ color: clothC, emissive: clothC, emissiveIntensity: 0.45, roughness: 0.72, metalness: 0.2 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xf1cfa8, emissive: 0x6a4a30, emissiveIntensity: 0.15, roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a2235, emissive: 0x101828, emissiveIntensity: 0.4, roughness: 0.55, metalness: 0.55 });
  const plateM = new THREE.MeshStandardMaterial({ color: steel, emissive: color, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.75 });
  const accent = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.95, roughness: 0.3 });
  const legs = [];
  const arms = [];

  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.09, -0.18, 0);
    leg.add(box(0.11, 0.24, 0.12, dark, 0, -0.06, 0));
    leg.add(box(0.12, 0.1, 0.16, dark, 0, -0.22, 0.02));
    g.add(leg);
    legs.push(leg);
  }

  const torso = slab(0.28, 0.3, 0.34, 0.2, cloth);
  torso.position.set(0, 0.14, 0);
  const vest = box(0.3, 0.22, 0.18, dark, 0, 0.16, 0.02);
  const belt = box(0.3, 0.05, 0.18, dark, 0, -0.02, 0);
  g.add(torso, vest, belt);

  const head = new THREE.Group();
  head.position.set(0, 0.42, 0);
  head.add(box(0.14, 0.14, 0.14, skin, 0, 0, 0, 0.2));
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.6), dark);
  helm.position.set(0, 0.04, 0);
  const visor = box(0.16, 0.04, 0.04, accent, 0, 0.0, 0.09, 0.2);
  head.add(helm, visor);
  g.add(head);

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.18, 0.22, 0);
    arm.add(box(0.08, 0.22, 0.08, cloth, 0, -0.1, 0, 0.2));
    arm.add(box(0.07, 0.07, 0.07, skin, 0, -0.22, 0.02, 0.3));
    if (side === -1) {
      const shield = new THREE.Group();
      shield.position.set(0.02, -0.05, 0.22);
      shield.add(box(0.42, 0.55, 0.06, plateM, 0, 0.05, 0, 0.05));
      shield.add(box(0.46, 0.06, 0.07, accent, 0, 0.28, 0.01, 0.05));
      shield.add(box(0.46, 0.06, 0.07, dark, 0, -0.2, 0.01, 0.05));
      shield.add(box(0.08, 0.4, 0.04, accent, 0, 0.05, 0.04, 0.1));
      shield.add(box(0.12, 0.12, 0.05, accent, 0, 0.08, 0.05, 0.15));
      shield.add(box(0.06, 0.48, 0.05, dark, -0.22, 0.04, 0, 0.05));
      shield.add(box(0.06, 0.48, 0.05, dark, 0.22, 0.04, 0, 0.05));
      arm.add(shield);
      arm.userData.shieldPlate = shield;
      arm.rotation.x = -0.35;
      arm.rotation.z = 0.25;
    } else {
      const baton = box(0.045, 0.045, 0.28, dark, 0, -0.22, 0.12, 0.15);
      const tip = box(0.04, 0.04, 0.04, accent, 0, -0.22, 0.28, 0.2);
      arm.add(baton, tip);
      arm.rotation.x = -0.55;
    }
    g.add(arm);
    arms.push(arm);
  }

  g.add(unitRing(color, 0.42, 0.32));
  g.scale.setScalar(2.05);
  g.userData.legs = legs;
  g.userData.arms = arms;
  g.userData.type = 'shield';
  g.userData.shieldGuard = true;
  return g;
}


/**
 * Phase 3 heavy artillery: squat carriage + BIG howitzer barrel (silhouette ≠ walker/mech/sniper).
 * Steel/olive hull, amber trim — orange reserved for blast telegraph ring.
 */
function artilleryMesh() {
  const g = new THREE.Group();
  const color = 0xff8a20;
  const hullC = 0x2a2e28;
  const steelC = 0x6a7060;
  const hull = new THREE.MeshStandardMaterial({ color: hullC, emissive: hullC, emissiveIntensity: 0.4, roughness: 0.7, metalness: 0.35 });
  const steel = new THREE.MeshStandardMaterial({ color: steelC, emissive: 0x3a4030, emissiveIntensity: 0.35, roughness: 0.45, metalness: 0.7 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x181c16, emissive: 0x0e120c, emissiveIntensity: 0.4, roughness: 0.55, metalness: 0.6 });
  const accent = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.95, roughness: 0.3 });
  const legs = [];
  const arms = [];

  // Wide tracked / wheeled base (reads as gun carriage, not biped walker)
  const base = box(0.55, 0.12, 0.42, dark, 0, -0.22, 0, 0.1);
  const skirt = box(0.58, 0.06, 0.38, hull, 0, -0.14, 0, 0.1);
  g.add(base, skirt);
  for (const side of [-1, 1]) {
    const track = box(0.1, 0.14, 0.48, dark, side * 0.28, -0.24, 0, 0.1);
    const wheelF = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 10), steel);
    wheelF.rotation.z = Math.PI / 2;
    wheelF.position.set(side * 0.28, -0.28, 0.16);
    const wheelR = wheelF.clone();
    wheelR.position.z = -0.16;
    g.add(track, wheelF, wheelR);
    legs.push(track);
  }

  // Low squat turret body
  const body = slab(0.36, 0.28, 0.32, 0.28, hull);
  body.position.set(0, 0.08, -0.02);
  const plate = box(0.38, 0.16, 0.22, steel, 0, 0.18, 0.02);
  const hatch = box(0.14, 0.04, 0.14, dark, 0, 0.28, -0.02);
  g.add(body, plate, hatch);

  // BIG howitzer barrel — dominant silhouette cue (much longer/thicker than sniper rifle)
  const barrelG = new THREE.Group();
  barrelG.position.set(0, 0.22, 0.12);
  const breech = box(0.18, 0.16, 0.22, steel, 0, 0, -0.02, 0.1);
  const tube = box(0.11, 0.11, 0.72, dark, 0, 0.02, 0.42, 0.1);
  const reinforce = box(0.14, 0.14, 0.18, steel, 0, 0.02, 0.22, 0.1);
  const muzzle = box(0.13, 0.13, 0.08, accent, 0, 0.02, 0.78, 0.15);
  const muzzleRing = box(0.16, 0.16, 0.04, accent, 0, 0.02, 0.72, 0.2);
  const elev = box(0.06, 0.2, 0.06, dark, 0.12, -0.02, 0.0, 0.1);
  barrelG.add(breech, tube, reinforce, muzzle, muzzleRing, elev);
  barrelG.rotation.x = -0.28; // elevated howitzer angle
  g.add(barrelG);
  arms.push(barrelG);
  g.userData.barrel = barrelG;

  // Side ammo crates (bulk silhouette)
  g.add(box(0.12, 0.14, 0.16, dark, -0.28, 0.02, -0.08, 0.1));
  g.add(box(0.12, 0.14, 0.16, dark, 0.28, 0.02, -0.08, 0.1));
  g.add(box(0.08, 0.04, 0.08, accent, 0, 0.32, 0.08, 0.2)); // optic

  g.add(unitRing(color, 0.48, 0.3));
  g.scale.setScalar(2.1);
  g.userData.legs = legs;
  g.userData.arms = arms;
  g.userData.type = 'artillery';
  g.userData.artillery = true;
  return g;
}



/**
 * Phase 3 suicide bomber: compact fast runner + visible charge pack / antenna / blinker.
 * Dark steel hull + danger crimson/magenta accents — NOT a solid red wash (readable silhouette).
 * Distinct from drone/soldier/artillery/walker recolor.
 */
function bomberMesh() {
  const g = new THREE.Group();
  const accent = 0xff2a6a;
  const mag = 0xd02080;
  const hullC = 0x2a2c32;
  const steelC = 0x5a6068;
  const hull = new THREE.MeshStandardMaterial({ color: hullC, emissive: 0x1a1c22, emissiveIntensity: 0.45, roughness: 0.55, metalness: 0.65 });
  const steel = new THREE.MeshStandardMaterial({ color: steelC, emissive: 0x2a3038, emissiveIntensity: 0.35, roughness: 0.4, metalness: 0.75 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x14161a, emissive: 0x0a0c10, emissiveIntensity: 0.4, roughness: 0.5, metalness: 0.7 });
  const danger = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.05, roughness: 0.3 });
  const magMat = new THREE.MeshStandardMaterial({ color: mag, emissive: mag, emissiveIntensity: 0.9, roughness: 0.35 });
  const legs = [];
  const arms = [];

  // Compact runner legs (shorter stance than soldier)
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.07, -0.18, 0);
    leg.add(box(0.07, 0.2, 0.09, dark, 0, -0.05, 0));
    leg.add(box(0.08, 0.08, 0.13, steel, 0, -0.2, 0.02));
    g.add(leg);
    legs.push(leg);
  }

  // Compact torso (narrower/shorter than soldier)
  const torso = slab(0.2, 0.2, 0.26, 0.16, hull);
  torso.position.set(0, 0.1, 0);
  const chestPlate = box(0.18, 0.1, 0.08, steel, 0, 0.14, 0.08);
  g.add(torso, chestPlate);

  // Visible rear CHARGE PACK (silhouette cue ≠ backpack drone)
  const pack = new THREE.Group();
  pack.position.set(0, 0.12, -0.12);
  pack.add(box(0.2, 0.22, 0.12, dark, 0, 0, 0, 0.1));
  pack.add(box(0.08, 0.14, 0.08, danger, -0.06, 0.02, -0.02, 0.15)); // charge cell L
  pack.add(box(0.08, 0.14, 0.08, magMat, 0.06, 0.02, -0.02, 0.15)); // charge cell R
  pack.add(box(0.04, 0.04, 0.04, danger, 0, 0.14, 0.02, 0.25)); // top blinker
  g.add(pack);
  g.userData.chargePack = pack;

  // Antenna mast (reads as fuse/antenna, not rifle)
  const antenna = new THREE.Group();
  antenna.position.set(0.06, 0.28, -0.06);
  antenna.add(box(0.025, 0.28, 0.025, steel, 0, 0.1, 0, 0.1));
  antenna.add(box(0.05, 0.05, 0.05, danger, 0, 0.28, 0, 0.3)); // tip blinker
  g.add(antenna);
  g.userData.antenna = antenna;

  // Head — compact helm + visor stripe (magenta, not full red hull)
  const head = new THREE.Group();
  head.position.set(0, 0.36, 0.02);
  head.add(box(0.14, 0.12, 0.14, hull, 0, 0, 0, 0.15));
  head.add(box(0.12, 0.03, 0.04, magMat, 0, 0.01, 0.08, 0.25));
  g.add(head);

  // Arms — forward runner pose (no big gun)
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.15, 0.18, 0);
    arm.add(box(0.055, 0.18, 0.055, hull, 0, -0.08, 0, 0.2));
    arm.add(box(0.05, 0.05, 0.05, steel, 0, -0.18, 0.02, 0.25));
    arm.rotation.x = -0.7;
    g.add(arm);
    arms.push(arm);
  }

  // Side danger stripe (accent only — hull stays steel)
  g.add(box(0.02, 0.12, 0.08, danger, -0.12, 0.1, 0.02, 0.2));
  g.add(box(0.02, 0.12, 0.08, danger, 0.12, 0.1, 0.02, 0.2));

  g.add(unitRing(accent, 0.32, 0.28));
  g.scale.setScalar(1.9);
  g.userData.legs = legs;
  g.userData.arms = arms;
  g.userData.type = 'bomber';
  g.userData.bomber = true;
  return g;
}



/**
 * Phase 3 flanker: lean runner + asymmetric side blades / vents.
 * Steel hull + violet/cyan trim — NO red hull (danger cyan reserved for dash telegraph).
 * Distinct from soldier/bomber/hunter/drone recolor.
 */
function flankerMesh() {
  const g = new THREE.Group();
  const violet = 0x9b6dff;
  const cyan = 0x00e5ff;
  const hullC = 0x2a2e38;
  const steelC = 0x6a7080;
  const hull = new THREE.MeshStandardMaterial({ color: hullC, emissive: 0x1a1e28, emissiveIntensity: 0.45, roughness: 0.5, metalness: 0.7 });
  const steel = new THREE.MeshStandardMaterial({ color: steelC, emissive: 0x2a3040, emissiveIntensity: 0.35, roughness: 0.4, metalness: 0.78 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x141820, emissive: 0x0a0c12, emissiveIntensity: 0.4, roughness: 0.5, metalness: 0.72 });
  const vio = new THREE.MeshStandardMaterial({ color: violet, emissive: violet, emissiveIntensity: 0.95, roughness: 0.3 });
  const cy = new THREE.MeshStandardMaterial({ color: cyan, emissive: cyan, emissiveIntensity: 1.0, roughness: 0.28 });
  const legs = [];
  const arms = [];

  // Lean runner legs (longer stride cue than bomber)
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.065, -0.16, 0);
    leg.add(box(0.055, 0.26, 0.07, dark, 0, -0.06, 0));
    leg.add(box(0.065, 0.06, 0.12, steel, 0, -0.22, 0.03));
    g.add(leg);
    legs.push(leg);
  }

  // Slim torso
  const torso = slab(0.16, 0.2, 0.28, 0.14, hull);
  torso.position.set(0, 0.12, 0);
  g.add(torso);
  g.add(box(0.14, 0.08, 0.06, steel, 0, 0.16, 0.07)); // chest plate

  // Asymmetric LEFT side blade (large) — silhouette cue
  const bladeL = new THREE.Group();
  bladeL.position.set(-0.16, 0.14, 0.02);
  bladeL.add(box(0.04, 0.22, 0.28, steel, 0, 0, 0.04, 0.12));
  bladeL.add(box(0.03, 0.06, 0.22, vio, -0.02, 0.04, 0.06, 0.2));
  bladeL.rotation.y = 0.25;
  bladeL.rotation.z = -0.15;
  g.add(bladeL);
  g.userData.bladeL = bladeL;

  // Asymmetric RIGHT vents (smaller stacked) — ≠ mirrored blade
  const ventsR = new THREE.Group();
  ventsR.position.set(0.14, 0.14, -0.02);
  ventsR.add(box(0.06, 0.05, 0.1, dark, 0, 0.06, 0, 0.15));
  ventsR.add(box(0.06, 0.05, 0.1, dark, 0, 0.0, 0, 0.15));
  ventsR.add(box(0.06, 0.05, 0.1, dark, 0, -0.06, 0, 0.15));
  ventsR.add(box(0.03, 0.03, 0.04, cy, 0.04, 0.06, 0.04, 0.25)); // cyan vent glow
  ventsR.add(box(0.03, 0.03, 0.04, vio, 0.04, -0.06, 0.04, 0.25));
  g.add(ventsR);
  g.userData.ventsR = ventsR;

  // Head — slim helm + cyan/violet visor stripe (not red)
  const head = new THREE.Group();
  head.position.set(0, 0.38, 0.02);
  head.add(box(0.12, 0.11, 0.13, hull, 0, 0, 0, 0.15));
  head.add(box(0.1, 0.025, 0.035, cy, 0, 0.01, 0.07, 0.25));
  head.add(box(0.04, 0.04, 0.04, vio, 0.05, 0.06, 0, 0.3)); // side fin
  g.add(head);

  // Arms — sprint pose; left carries small blade stub
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.14, 0.2, 0);
    arm.add(box(0.05, 0.2, 0.05, hull, 0, -0.08, 0, 0.2));
    arm.add(box(0.045, 0.045, 0.045, steel, 0, -0.2, 0.02, 0.25));
    if (side < 0) {
      arm.add(box(0.03, 0.04, 0.14, vio, 0, -0.18, 0.1, 0.2)); // forearm blade
    }
    arm.rotation.x = -0.85;
    g.add(arm);
    arms.push(arm);
  }

  // Cyan/violet trim stripes (accent only — hull stays steel)
  g.add(box(0.018, 0.14, 0.06, cy, -0.1, 0.12, 0.08, 0.2));
  g.add(box(0.018, 0.1, 0.05, vio, 0.1, 0.1, 0.08, 0.2));

  g.add(unitRing(violet, 0.3, 0.26));
  g.scale.setScalar(1.95);
  g.userData.legs = legs;
  g.userData.arms = arms;
  g.userData.type = 'flanker';
  g.userData.flanker = true;
  return g;
}

/** Drone / walker / escort mech support frames. */
function supportMesh(kind, color) {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x5c688c, emissive: 0x2a3450, emissiveIntensity: 0.45, roughness: 0.5, metalness: 0.7 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a3148, emissive: 0x1c2438, emissiveIntensity: 0.4, roughness: 0.6, metalness: 0.6 });
  const trim = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.85, roughness: 0.35 });
  if (kind === 'drone') {
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.17, 0), metal);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), trim);
    eye.position.set(0, 0.02, 0.15);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.03, 8, 20), trim);
    ring.rotation.x = Math.PI / 2;
    g.add(core, eye, ring);
    for (const side of [-1, 1]) {
      const fin = box(0.26, 0.03, 0.1, dark, side * 0.24, 0, -0.04, 0.1);
      fin.rotation.z = side * 0.25;
      g.add(fin);
      const thr = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), trim);
      thr.position.set(side * 0.36, -0.02, -0.04);
      g.add(thr);
    }
    // v0.9.22: no ground ring on ordinary drones (silhouette/fin read is enough)
    g.userData.bob = true;
    g.userData.flyer = true;
    g.userData.baseY = 0.55;
  } else if (kind === 'walker') {
    const torso = slab(0.5, 0.62, 0.42, 0.44, metal);
    torso.position.y = 0.16;
    const chest = box(0.26, 0.2, 0.06, trim, 0, 0.54, 0.24);
    const head = box(0.24, 0.18, 0.24, dark, 0, 0.82, 0.06, 0.2);
    const vis = box(0.2, 0.055, 0.03, trim, 0, 0.83, 0.19);
    g.add(torso, chest, head, vis);
    const legs = [];
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(side * 0.2, 0.0, 0);
      const thigh = slab(0.18, 0.22, 0.3, 0.22, metal);
      thigh.position.set(0, -0.16, 0);
      const foot = slab(0.2, 0.3, 0.1, 0.36, dark);
      foot.position.set(0, -0.45, 0.05);
      leg.add(thigh, foot);
      g.add(leg);
      legs.push(leg);
      const pad = box(0.14, 0.16, 0.3, metal, side * 0.36, 0.62, 0, 0.15);
      const gun = cyl(0.05, 0.06, 0.34, dark, 10);
      gun.rotation.x = Math.PI / 2;
      gun.position.set(side * 0.36, 0.62, 0.2);
      g.add(pad, gun);
    }
    g.add(unitRing(color, 0.42, 0.36)); // walker elite keep
    g.userData.legs = legs;
  } else {
    // escort mech — heaviest support frame, angular anime-style mass
    const torso = slab(0.6, 0.74, 0.5, 0.5, metal);
    torso.position.y = 0.62;
    const chest = box(0.3, 0.24, 0.07, trim, 0, 0.68, 0.27);
    const head = box(0.26, 0.2, 0.26, dark, 0, 0.95, 0.02, 0.18);
    const vis = box(0.22, 0.06, 0.03, trim, 0, 0.96, 0.16);
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.26, 4), trim);
    horn.position.set(0, 1.14, 0.02);
    g.add(torso, chest, head, vis, horn);
    const legs = [];
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(side * 0.22, 0.44, 0);
      const thigh = slab(0.2, 0.26, 0.46, 0.24, metal);
      thigh.position.set(0, -0.25, 0);
      leg.add(thigh);
      g.add(leg);
      legs.push(leg);
      const pad = slab(0.2, 0.28, 0.2, 0.34, metal);
      pad.position.set(side * 0.46, 0.82, 0);
      const barrel = cyl(0.05, 0.06, 0.4, trim, 10);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(side * 0.46, 0.82, 0.22);
      g.add(pad, barrel);
    }
    g.add(unitRing(color, 0.52, 0.40)); // escort mech keep
    g.userData.legs = legs;
  }
  g.userData.type = kind;
  return g;
}

/** Phase 3 elite: heavy biped + acid elite ring (violet hull, no red). */
function eliteMesh() {
  const color = 0xb44dff;
  const acid = 0xb8ff3a;
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x3a2a55, emissive: 0x2a1840, emissiveIntensity: 0.55, roughness: 0.45, metalness: 0.65 });
  const plate = new THREE.MeshStandardMaterial({ color: 0x1a1e28, emissive: 0x12161f, emissiveIntensity: 0.4, roughness: 0.5, metalness: 0.7 });
  const trim = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9, roughness: 0.3 });
  const acidM = new THREE.MeshBasicMaterial({ color: acid, transparent: true, opacity: 0.85 });

  const torso = slab(0.55, 0.7, 0.48, 0.48, metal);
  torso.position.y = 0.55;
  const chest = box(0.28, 0.22, 0.08, trim, 0, 0.62, 0.26);
  const head = box(0.28, 0.22, 0.28, plate, 0, 0.95, 0.02, 0.15);
  const vis = box(0.24, 0.06, 0.04, trim, 0, 0.96, 0.16);
  g.add(torso, chest, head, vis);

  const legs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.2, 0.35, 0);
    const thigh = slab(0.18, 0.24, 0.4, 0.22, metal);
    thigh.position.set(0, -0.22, 0);
    const shin = slab(0.16, 0.2, 0.28, 0.2, plate);
    shin.position.set(0, -0.5, 0.02);
    const foot = slab(0.18, 0.26, 0.1, 0.32, plate);
    foot.position.set(0, -0.68, 0.06);
    leg.add(thigh, shin, foot);
    g.add(leg);
    legs.push(leg);
    // shoulder cannons
    const pad = slab(0.18, 0.26, 0.18, 0.3, metal);
    pad.position.set(side * 0.42, 0.78, 0);
    const barrel = cyl(0.045, 0.055, 0.38, trim, 10);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(side * 0.42, 0.78, 0.2);
    g.add(pad, barrel);
  }

  const eliteRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.035, 8, 36), acidM);
  eliteRing.rotation.x = -Math.PI / 2;
  eliteRing.position.y = 0.08;
  eliteRing.userData.eliteRing = true;
  g.add(eliteRing);
  g.add(unitRing(acid, 0.58, 0.45));

  g.scale.setScalar(1.55);
  g.userData.legs = legs;
  g.userData.eliteRing = eliteRing;
  g.userData.type = 'sentinel';
  g.userData.elite = true;
  return g;
}

/** Phase 3 elite #2: low hunter-mech — quadruped + dual blade pods (cyan/steel, no red). */
function hunterMesh() {
  const cyan = 0x3de0ff;
  const steel = 0x6a7a8c;
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({
    color: 0x2a3440, emissive: 0x152028, emissiveIntensity: 0.55, roughness: 0.42, metalness: 0.72,
  });
  const plate = new THREE.MeshStandardMaterial({
    color: 0x1a222c, emissive: 0x0e141a, emissiveIntensity: 0.4, roughness: 0.48, metalness: 0.78,
  });
  const trim = new THREE.MeshStandardMaterial({
    color: cyan, emissive: cyan, emissiveIntensity: 0.95, roughness: 0.28, metalness: 0.35,
  });
  const bladeM = new THREE.MeshStandardMaterial({
    color: steel, emissive: cyan, emissiveIntensity: 0.55, roughness: 0.25, metalness: 0.85,
  });
  const ringM = new THREE.MeshBasicMaterial({ color: cyan, transparent: true, opacity: 0.85 });

  // Low elongated torso (quadruped silhouette — distinct from tall SENTINEL biped)
  const torso = slab(0.62, 0.48, 0.32, 0.85, metal);
  torso.position.set(0, 0.42, 0);
  const chest = box(0.36, 0.16, 0.1, trim, 0, 0.5, 0.38);
  const head = box(0.26, 0.18, 0.3, plate, 0, 0.58, 0.52, 0.12);
  const vis = box(0.22, 0.05, 0.04, trim, 0, 0.6, 0.68);
  g.add(torso, chest, head, vis);

  // Four legs (front + rear pairs)
  const legs = [];
  const places = [
    [-0.26, 0.22, 0.28],
    [0.26, 0.22, 0.28],
    [-0.24, 0.22, -0.32],
    [0.24, 0.22, -0.32],
  ];
  for (const [lx, ly, lz] of places) {
    const leg = new THREE.Group();
    leg.position.set(lx, ly, lz);
    const thigh = slab(0.12, 0.14, 0.22, 0.14, metal);
    thigh.position.set(0, -0.12, 0);
    const shin = slab(0.1, 0.12, 0.2, 0.12, plate);
    shin.position.set(0, -0.32, 0.02);
    const foot = slab(0.12, 0.16, 0.07, 0.2, plate);
    foot.position.set(0, -0.44, 0.04);
    leg.add(thigh, shin, foot);
    g.add(leg);
    legs.push(leg);
  }

  // Dual blade / pod weapons on hips (reads as hunter, not cannon sentinel)
  for (const side of [-1, 1]) {
    const pod = slab(0.14, 0.18, 0.16, 0.28, metal);
    pod.position.set(side * 0.4, 0.48, 0.05);
    const blade = box(0.05, 0.08, 0.55, bladeM, side * 0.48, 0.46, 0.42, 0.02);
    blade.rotation.y = side * 0.12;
    const tip = box(0.04, 0.05, 0.12, trim, side * 0.5, 0.46, 0.72, 0.01);
    g.add(pod, blade, tip);
  }

  // Dorsal fin / sensor mast — unique read vs SENTINEL shoulder cannons
  const mast = box(0.08, 0.28, 0.12, plate, 0, 0.72, -0.1);
  const mastGlow = box(0.06, 0.08, 0.06, trim, 0, 0.88, -0.1);
  g.add(mast, mastGlow);

  const eliteRing = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.032, 8, 36), ringM);
  eliteRing.rotation.x = -Math.PI / 2;
  eliteRing.position.y = 0.06;
  eliteRing.userData.eliteRing = true;
  g.add(eliteRing);
  g.add(unitRing(cyan, 0.55, 0.42));

  g.scale.setScalar(1.45);
  g.userData.legs = legs;
  g.userData.eliteRing = eliteRing;
  g.userData.type = 'hunter';
  g.userData.elite = true;
  return g;
}

/** Phase 3 elite #3: tall officer-mech / army commander — crest, baton, signal mast (≠ sentinel/hunter). */
function commanderMesh() {
  const amber = 0xffb020;
  const brass = 0xd4a24a;
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({
    color: 0x3a3228, emissive: 0x241c14, emissiveIntensity: 0.5, roughness: 0.44, metalness: 0.68,
  });
  const plate = new THREE.MeshStandardMaterial({
    color: 0x1e1a16, emissive: 0x12100c, emissiveIntensity: 0.38, roughness: 0.5, metalness: 0.72,
  });
  const trim = new THREE.MeshStandardMaterial({
    color: amber, emissive: amber, emissiveIntensity: 0.95, roughness: 0.3, metalness: 0.4,
  });
  const brassM = new THREE.MeshStandardMaterial({
    color: brass, emissive: amber, emissiveIntensity: 0.45, roughness: 0.35, metalness: 0.8,
  });
  const ringM = new THREE.MeshBasicMaterial({ color: amber, transparent: true, opacity: 0.85 });

  // Tall biped torso (officer silhouette — taller/narrower than SENTINEL cannons)
  const torso = slab(0.42, 0.52, 0.78, 0.42, metal);
  torso.position.y = 0.72;
  const chest = box(0.3, 0.2, 0.08, trim, 0, 0.82, 0.24);
  // Peaked command helm / crest
  const head = box(0.26, 0.24, 0.28, plate, 0, 1.22, 0.02, 0.12);
  const vis = box(0.22, 0.05, 0.04, trim, 0, 1.22, 0.16);
  const crest = box(0.06, 0.22, 0.14, brassM, 0, 1.42, -0.02);
  const brim = box(0.3, 0.04, 0.12, plate, 0, 1.12, 0.14);
  g.add(torso, chest, head, vis, crest, brim);

  // Wide epaulettes (officer read — not shoulder cannons)
  for (const side of [-1, 1]) {
    const epaul = slab(0.22, 0.28, 0.12, 0.28, brassM);
    epaul.position.set(side * 0.38, 1.05, 0);
    g.add(epaul);
  }

  // Long coat / cape plate hanging behind hips
  const coat = slab(0.48, 0.55, 0.45, 0.12, plate);
  coat.position.set(0, 0.42, -0.22);
  g.add(coat);

  // Command baton (right) + open gesturing pad (left)
  const batonArm = new THREE.Group();
  batonArm.position.set(0.42, 0.88, 0.05);
  const baton = cyl(0.035, 0.04, 0.55, brassM, 8);
  baton.rotation.z = Math.PI / 2;
  baton.position.set(0.22, 0.05, 0.1);
  const batonTip = box(0.08, 0.08, 0.08, trim, 0.48, 0.05, 0.1);
  batonArm.add(baton, batonTip);
  g.add(batonArm);

  // Signal mast / antenna (command silhouette vs hunter dorsal fin)
  const mast = box(0.07, 0.55, 0.07, plate, -0.12, 1.35, -0.18);
  const dish = cyl(0.12, 0.12, 0.04, trim, 12);
  dish.position.set(-0.12, 1.62, -0.18);
  dish.rotation.x = Math.PI / 2;
  const blink = box(0.05, 0.05, 0.05, trim, -0.12, 1.72, -0.18);
  g.add(mast, dish, blink);

  // Tall legs
  const legs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.16, 0.38, 0);
    const thigh = slab(0.15, 0.18, 0.42, 0.18, metal);
    thigh.position.set(0, -0.2, 0);
    const shin = slab(0.13, 0.15, 0.36, 0.16, plate);
    shin.position.set(0, -0.55, 0.02);
    const foot = slab(0.16, 0.22, 0.1, 0.28, plate);
    foot.position.set(0, -0.78, 0.05);
    leg.add(thigh, shin, foot);
    g.add(leg);
    legs.push(leg);
  }

  const eliteRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.032, 8, 36), ringM);
  eliteRing.rotation.x = -Math.PI / 2;
  eliteRing.position.y = 0.07;
  eliteRing.userData.eliteRing = true;
  g.add(eliteRing);
  g.add(unitRing(amber, 0.54, 0.44));

  g.scale.setScalar(1.65);
  g.userData.legs = legs;
  g.userData.eliteRing = eliteRing;
  g.userData.type = 'commander';
  g.userData.elite = true;
  return g;
}

/** Ground warning lane: thin additive strip elite → player during telegraph. */
function warningLane() {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    // v0.9.22: danger orange — reads vs floor / player cyan / décor teal
    color: 0xff6a1a, transparent: true, opacity: 0.62, depthWrite: false, side: THREE.DoubleSide,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  quad.rotation.x = -Math.PI / 2;
  quad.position.y = 0.06;
  g.add(quad);
  g.userData.quad = quad;
  g.userData.mat = mat;
  g.visible = false;
  return g;
}


/** Short red contact-slam wedge for shield bash telegraph (red = contact, not AoE orange). */
function shieldBashLane() {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff2a4a, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  quad.rotation.x = -Math.PI / 2;
  quad.position.y = 0.08;
  g.add(quad);
  g.userData.quad = quad;
  g.userData.mat = mat;
  g.visible = false;
  return g;
}



/**
 * Phase 3 combat medic: white/teal support pack + antenna + lime cross plate.
 * Distinct from staffer / chief / drone / flanker (no red hull).
 */
function medicMesh() {
  const g = new THREE.Group();
  const teal = 0x3ad7c8;
  const white = 0xe8f4f2;
  const lime = 0xb6ff3a;
  const steel = 0x2a3238;
  const matBody = new THREE.MeshStandardMaterial({ color: white, metalness: 0.25, roughness: 0.55, emissive: teal, emissiveIntensity: 0.18 });
  const matPack = new THREE.MeshStandardMaterial({ color: steel, metalness: 0.55, roughness: 0.4, emissive: teal, emissiveIntensity: 0.22 });
  const matLime = new THREE.MeshStandardMaterial({ color: lime, metalness: 0.2, roughness: 0.45, emissive: lime, emissiveIntensity: 0.55 });
  const matAnt = new THREE.MeshStandardMaterial({ color: teal, metalness: 0.4, roughness: 0.35, emissive: teal, emissiveIntensity: 0.4 });

  // Lean torso (white/teal)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.48, 0.28), matBody);
  torso.position.y = 0.52;
  g.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), matBody);
  head.position.y = 0.88;
  g.add(head);

  // Support pack (rear asymmetrical canister)
  const pack = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.36, 6), matPack);
  pack.position.set(0.02, 0.58, -0.22);
  pack.rotation.x = 0.15;
  g.add(pack);
  const packCap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 6), matAnt);
  packCap.position.set(0.02, 0.78, -0.22);
  g.add(packCap);

  // Antenna (asymmetric — left tall)
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 5), matAnt);
  ant.position.set(-0.12, 1.05, -0.05);
  g.add(ant);
  const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), matLime);
  antTip.position.set(-0.12, 1.28, -0.05);
  g.add(antTip);

  // Lime cross plate (chest badge) — horizontal + vertical bars
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.04), matLime);
  crossH.position.set(0, 0.58, 0.16);
  g.add(crossH);
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.04), matLime);
  crossV.position.set(0, 0.58, 0.16);
  g.add(crossV);

  // Side vent / injector (right only — asymmetric)
  const vent = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.1), matPack);
  vent.position.set(0.22, 0.5, 0.02);
  g.add(vent);
  const ventGlow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.06), matLime);
  ventGlow.position.set(0.26, 0.5, 0.02);
  g.add(ventGlow);

  // Legs
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.12), matPack);
  legL.position.set(-0.1, 0.16, 0);
  g.add(legL);
  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.12), matPack);
  legR.position.set(0.1, 0.16, 0);
  g.add(legR);

  g.userData.type = 'medic';
  g.userData.medic = true;
  g.userData.baseY = 0;
  return g;
}

/** Lime heal aura ring for medic telegraph (lime = heal; ≠ red AoE / cyan dash / orange blast). */
function medicHealAura() {
  const group = new THREE.Group();
  const r = (typeof MEDIC !== 'undefined' && MEDIC.healRadius) ? MEDIC.healRadius : 4.2;
  const ringGeo = new THREE.RingGeometry(r * 0.92, r, 48);
  ringGeo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xb6ff3a,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, mat);
  ring.position.y = 0.04;
  group.add(ring);
  const fillGeo = new THREE.CircleGeometry(r * 0.9, 48);
  fillGeo.rotateX(-Math.PI / 2);
  const fillMat = new THREE.MeshBasicMaterial({
    color: 0x7dffb0,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const fill = new THREE.Mesh(fillGeo, fillMat);
  fill.position.y = 0.02;
  group.add(fill);
  // Small cross mark at center
  const crossMat = new THREE.MeshBasicMaterial({ color: 0xb6ff3a, transparent: true, opacity: 0.7, depthWrite: false });
  const ch = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.12), crossMat);
  ch.rotation.x = -Math.PI / 2;
  ch.position.y = 0.06;
  group.add(ch);
  const cv = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.55), crossMat.clone());
  cv.rotation.x = -Math.PI / 2;
  cv.position.y = 0.06;
  group.add(cv);
  group.visible = false;
  group.userData.mat = mat;
  group.userData.fillMat = fillMat;
  group.userData.crossMat = crossMat;
  group.userData.baseR = r;
  return group;
}

/** Cyan/danger dash wedge for flanker telegraph (cyan = dash lane; ≠ red AoE / orange blast). */
/**
 * Phase 3 signal jammer: dark steel hull + dish / mast / magenta-violet emitter pods.
 * Distinct from drone / medic / artillery / flanker (no red hull).
 */
function jammerMesh() {
  const g = new THREE.Group();
  const steel = 0x1e222a;
  const steelHi = 0x3a4050;
  const mag = 0xc44dff;
  const violet = 0x9b4dff;
  const matHull = new THREE.MeshStandardMaterial({ color: steel, metalness: 0.65, roughness: 0.38, emissive: violet, emissiveIntensity: 0.12 });
  const matHi = new THREE.MeshStandardMaterial({ color: steelHi, metalness: 0.55, roughness: 0.4, emissive: mag, emissiveIntensity: 0.18 });
  const matEmit = new THREE.MeshStandardMaterial({ color: mag, metalness: 0.25, roughness: 0.35, emissive: mag, emissiveIntensity: 0.7 });
  const matDish = new THREE.MeshStandardMaterial({ color: 0x2a3040, metalness: 0.7, roughness: 0.32, emissive: violet, emissiveIntensity: 0.25 });

  // Compact chassis
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 0.36), matHull);
  body.position.y = 0.42;
  g.add(body);

  // Mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.55, 6), matHi);
  mast.position.y = 0.85;
  g.add(mast);

  // Dish (asymmetric tilt)
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8, 0, Math.PI), matDish);
  dish.position.set(0.08, 1.12, 0.02);
  dish.rotation.x = -0.55;
  dish.rotation.y = 0.35;
  g.add(dish);
  const dishCore = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), matEmit);
  dishCore.position.set(0.08, 1.12, 0.08);
  g.add(dishCore);

  // Emitter pods (left + right, asymmetric heights)
  const podL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.1), matHi);
  podL.position.set(-0.26, 0.48, 0.05);
  g.add(podL);
  const tipL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), matEmit);
  tipL.position.set(-0.26, 0.6, 0.05);
  g.add(tipL);
  const podR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.26, 0.1), matHi);
  podR.position.set(0.28, 0.52, -0.04);
  g.add(podR);
  const tipR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), matEmit);
  tipR.position.set(0.28, 0.68, -0.04);
  g.add(tipR);

  // Legs / skids
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.14), matHull);
  legL.position.set(-0.12, 0.12, 0);
  g.add(legL);
  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.14), matHull);
  legR.position.set(0.12, 0.12, 0);
  g.add(legR);

  g.userData.type = 'jammer';
  g.userData.jammer = true;
  g.userData.baseY = 0;
  return g;
}

/** Violet jam ring for jammer telegraph (violet = jam; ≠ red AoE / cyan dash / lime heal). */
function jammerJamAura() {
  const group = new THREE.Group();
  const r = (typeof JAMMER !== 'undefined' && JAMMER.jamRange) ? Math.min(4.8, JAMMER.jamRange * 0.45) : 4.0;
  const ringGeo = new THREE.RingGeometry(r * 0.88, r, 48);
  ringGeo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xc44dff,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, mat);
  ring.position.y = 0.04;
  group.add(ring);
  const fillGeo = new THREE.CircleGeometry(r * 0.86, 48);
  fillGeo.rotateX(-Math.PI / 2);
  const fillMat = new THREE.MeshBasicMaterial({
    color: 0x9b4dff,
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const fill = new THREE.Mesh(fillGeo, fillMat);
  fill.position.y = 0.02;
  group.add(fill);
  // Inner dashed pulse ring
  const innerGeo = new THREE.RingGeometry(r * 0.35, r * 0.42, 32);
  innerGeo.rotateX(-Math.PI / 2);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0xe0a0ff,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const inner = new THREE.Mesh(innerGeo, innerMat);
  inner.position.y = 0.05;
  group.add(inner);
  group.visible = false;
  group.userData.mat = mat;
  group.userData.fillMat = fillMat;
  group.userData.innerMat = innerMat;
  group.userData.baseR = r;
  return group;
}


function flankerDashLane() {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff, transparent: true, opacity: 0.72, depthWrite: false, side: THREE.DoubleSide,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  quad.rotation.x = -Math.PI / 2;
  quad.position.y = 0.08;
  g.add(quad);
  g.userData.quad = quad;
  g.userData.mat = mat;
  g.visible = false;
  return g;
}

/** Thin red aim line for sniper telegraph (danger red = imminent damage). */
function sniperAimLine() {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff2a4a, transparent: true, opacity: 0.72, depthWrite: false, side: THREE.DoubleSide,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  quad.rotation.x = -Math.PI / 2;
  quad.position.y = 0.09;
  g.add(quad);
  g.userData.quad = quad;
  g.userData.mat = mat;
  g.visible = false;
  return g;
}



/** Orange/red drop marks for commander summon telegraph. */
function commanderSummonRing() {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff4a1a, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.85, 28), mat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.07;
  const fillMat = new THREE.MeshBasicMaterial({
    color: 0xff6a1a, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide,
  });
  const fill = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), fillMat);
  fill.rotation.x = -Math.PI / 2;
  fill.position.y = 0.05;
  g.add(ring, fill);
  g.userData.mat = mat;
  g.userData.fillMat = fillMat;
  g.visible = false;
  return g;
}

/** Orange blast circle/ring for artillery telegraph (orange = AoE blast radius). */
function artilleryBlastRing() {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff6a1a, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide,
  });
  // Outer ring (blast radius outline)
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.82, 1.0, 48), mat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.07;
  // Soft fill disc
  const fillMat = new THREE.MeshBasicMaterial({
    color: 0xff8a20, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide,
  });
  const fill = new THREE.Mesh(new THREE.CircleGeometry(1, 40), fillMat);
  fill.rotation.x = -Math.PI / 2;
  fill.position.y = 0.05;
  g.add(ring, fill);
  g.userData.ring = ring;
  g.userData.fill = fill;
  g.userData.mat = mat;
  g.userData.fillMat = fillMat;
  g.visible = false;
  return g;
}


/** Cyan/acid safe-zone edge ring (PHASE6-ZONE-PRESSURE-001; ≠ red danger pulse / bomber). */
function zonePressureRing() {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: 0x3dffc8, transparent: true, opacity: 0.72, depthWrite: false, side: THREE.DoubleSide,
  });
  // Unit ring — scaled to safeR at sync time
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.97, 1.02, 96), mat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.08;
  // Mild outer pollution wash (inner = safe edge, outer grows with scale vs ARENA)
  const washMat = new THREE.MeshBasicMaterial({
    color: 0x1a8060, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide,
  });
  const wash = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.35, 64), washMat);
  wash.rotation.x = -Math.PI / 2;
  wash.position.y = 0.045;
  g.add(wash, ring);
  g.userData.ring = ring;
  g.userData.wash = wash;
  g.userData.mat = mat;
  g.userData.washMat = washMat;
  g.visible = false;
  return g;
}

/** Red ground blast circle/ring for bomber telegraph (danger red = must-dodge self-AoE; ≠ artillery orange). */
function bomberBlastRing() {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff1a3a, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.82, 1.0, 48), mat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.07;
  const fillMat = new THREE.MeshBasicMaterial({
    color: 0xff2a6a, transparent: true, opacity: 0.24, depthWrite: false, side: THREE.DoubleSide,
  });
  const fill = new THREE.Mesh(new THREE.CircleGeometry(1, 40), fillMat);
  fill.rotation.x = -Math.PI / 2;
  fill.position.y = 0.05;
  g.add(ring, fill);
  g.userData.ring = ring;
  g.userData.fill = fill;
  g.userData.mat = mat;
  g.userData.fillMat = fillMat;
  g.visible = false;
  return g;
}

/**
 * SWARM CORE boss: hexagonal dark plate core + acid-green seams + rotating drone pod ring.
 * No red hull (Roy rule).
 */
function bossMesh() {
  const acid = 0xb8ff3a;
  const g = new THREE.Group();
  const plate = new THREE.MeshStandardMaterial({
    color: 0x1a1e24, emissive: 0x0c1016, emissiveIntensity: 0.55, roughness: 0.45, metalness: 0.75,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x0e1218, emissive: 0x080a0e, emissiveIntensity: 0.4, roughness: 0.5, metalness: 0.8,
  });
  const seam = new THREE.MeshStandardMaterial({
    color: acid, emissive: acid, emissiveIntensity: 1.1, roughness: 0.25, metalness: 0.4,
  });
  const acidM = new THREE.MeshBasicMaterial({ color: acid, transparent: true, opacity: 0.9 });

  // Hex core (6-sided cylinder)
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.85, 6), plate);
  core.position.y = 1.15;
  core.rotation.y = Math.PI / 6;
  const coreTop = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.95, 0.28, 6), dark);
  coreTop.position.y = 1.7;
  coreTop.rotation.y = Math.PI / 6;
  const coreGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.12, 6), acidM);
  coreGlow.position.y = 1.88;
  coreGlow.rotation.y = Math.PI / 6;
  g.add(core, coreTop, coreGlow);

  // Acid seams along hex edges (thin vertical bars)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const sx = Math.cos(a) * 0.92;
    const sz = Math.sin(a) * 0.92;
    const bar = box(0.06, 0.7, 0.08, seam, sx, 1.15, sz, 0.02);
    g.add(bar);
  }

  // Slow-rotating ring of small drone pods
  const podRing = new THREE.Group();
  podRing.position.y = 0.95;
  const pods = [];
  const podN = 8;
  for (let i = 0; i < podN; i++) {
    const pod = new THREE.Group();
    const a = (i / podN) * Math.PI * 2;
    pod.position.set(Math.cos(a) * 1.55, 0, Math.sin(a) * 1.55);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), dark);
    const eye = box(0.12, 0.06, 0.04, seam, 0, 0.02, 0.14, 0.05);
    const fin = box(0.04, 0.08, 0.16, plate, 0, 0.08, -0.06, 0.05);
    pod.add(body, eye, fin);
    pod.userData.podIndex = i;
    podRing.add(pod);
    pods.push(pod);
  }
  g.add(podRing);

  // Ground ring
  g.add(unitRing(acid, 1.35, 0.4));
  const orbitRing = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.03, 6, 40), acidM);
  orbitRing.rotation.x = -Math.PI / 2;
  orbitRing.position.y = 0.12;
  g.add(orbitRing);

  g.userData.type = 'swarm_core';
  g.userData.boss = true;
  g.userData.podRing = podRing;
  g.userData.pods = pods;
  g.userData.coreGlow = coreGlow;
  g.userData.baseY = 0.15;
  g.userData.flyer = true;
  return g;
}

function enemyMeshFor(type) {
  // Phase 3 lab slice: distinct procedural silhouettes (not recolor-only PNGs).
  if (type === 'staffer' || type === 'guard') {
    const def = ENEMIES[type] || {};
    return humanMesh(type, def.color || 0xff3b6e, def.coat);
  }
  if (type === 'sniper') return sniperMesh();
  if (type === 'shield') return shieldMesh();
  if (type === 'artillery') return artilleryMesh();
  if (type === 'bomber') return bomberMesh();
  if (type === 'flanker') return flankerMesh();
  if (type === 'medic') return medicMesh();
  if (type === 'jammer') return jammerMesh();
  if (type === 'drone') {
    const def = ENEMIES[type] || {};
    return supportMesh('drone', def.color || 0x00e5ff);
  }
  if (type === 'sentinel') return eliteMesh();
  if (type === 'hunter') return hunterMesh();
  if (type === 'commander') return commanderMesh();
  if (type === 'swarm_core') return bossMesh();
  // Remaining types keep approved colour-coded PNG billboards.
  return buildEnemySprite(type);
}
// ---------------------------------------------------------------------------
// Projectiles: MG = cyan line/dot; specials = small ammo PNGs (deep-gray + cyan).
// ---------------------------------------------------------------------------
const SHOT_CACHE = Object.create(null);
const AMMO_TEX = Object.create(null);
const ammoLoader = new THREE.TextureLoader();

function loadAmmoTex(key) {
  if (!key) return null;
  if (AMMO_TEX[key]) return AMMO_TEX[key];
  const path = AMMO_PATHS[key];
  if (!path) return null;
  const tex = ammoLoader.load(path);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.premultiplyAlpha = false;
  AMMO_TEX[key] = tex;
  return tex;
}

function shotGeo(shot) {
  if (SHOT_CACHE[shot]) return SHOT_CACHE[shot];
  let g;
  if (shot === 'line') g = new THREE.CapsuleGeometry(0.022, 0.42, 3, 6);
  else if (shot === 'laser') g = new THREE.PlaneGeometry(0.85, 0.16);
  else if (shot === 'splash') g = new THREE.PlaneGeometry(0.32, 0.32);
  else if (shot === 'rocket' || shot === 'grenade' || shot === 'plasma') g = new THREE.PlaneGeometry(0.42, 0.42);
  else if (shot === 'lance') g = new THREE.CapsuleGeometry(0.045, 0.5, 4, 8);
  else if (shot === 'spike') g = new THREE.ConeGeometry(0.07, 0.36, 5);
  else if (shot === 'blade') g = new THREE.TorusGeometry(0.13, 0.035, 6, 14, Math.PI * 1.3);
  else if (shot === 'star') g = new THREE.OctahedronGeometry(0.13, 0);
  else if (shot === 'wave') g = new THREE.TorusGeometry(0.1, 0.03, 4, 10, Math.PI * 0.9);
  else if (shot === 'bolt') { g = new THREE.OctahedronGeometry(0.1, 0); g.scale(0.7, 1.5, 0.7); }
  else g = new THREE.SphereGeometry(0.11, 10, 8);
  SHOT_CACHE[shot] = g;
  return g;
}

const BULLET_POOLS = Object.create(null);

// Align elongated shots with travel so streaks read as fired, not dropping out of the mech.
const _shotFwd = new THREE.Vector3();
const _shotY = new THREE.Vector3(0, 1, 0);
const _shotX = new THREE.Vector3();
const _shotZ = new THREE.Vector3();
const _shotBasis = new THREE.Matrix4();
const _shotRight = new THREE.Vector3();
const _shotCamF = new THREE.Vector3();
const _shotCamR = new THREE.Vector3();
const _shotCamU = new THREE.Vector3();

function orientProjectile(m, b, cam) {
  const shot = m.userData.shot;
  _shotFwd.set(b.vx, b.vy || 0, b.vz);
  if (_shotFwd.lengthSq() < 1e-10) _shotFwd.set(0, 0, 1);
  else _shotFwd.normalize();

  // Capsule / cone / octa long axis = local +Y → match velocity (incl. grenade arc).
  if (shot === 'line' || shot === 'lance' || shot === 'bolt' || shot === 'spike') {
    // Avoid setFromUnitVectors singularity when velocity is nearly -Y (grenade apex).
    if (_shotFwd.y < -0.98 && (_shotFwd.x * _shotFwd.x + _shotFwd.z * _shotFwd.z) < 0.04) {
      m.quaternion.set(1, 0, 0, 0); // 180° about X: +Y → -Y
    } else {
      m.quaternion.setFromUnitVectors(_shotY, _shotFwd);
    }
    return;
  }

  // Laser beam: PlaneGeometry long on +X, laid on the floor along horizontal aim.
  if (shot === 'laser') {
    const len = Math.hypot(b.vx, b.vz) || 1;
    _shotX.set(b.vx / len, 0, b.vz / len);
    _shotZ.set(0, 1, 0);
    _shotRight.crossVectors(_shotZ, _shotX).normalize();
    // X = forward, Y = width, Z = up
    _shotBasis.makeBasis(_shotX, _shotRight, _shotZ);
    m.quaternion.setFromRotationMatrix(_shotBasis);
    return;
  }

  // Round / splash sprites: face camera, nose rotated toward travel on screen.
  m.quaternion.copy(cam.quaternion);
  cam.getWorldDirection(_shotCamF);
  _shotCamU.set(0, 1, 0);
  _shotCamR.crossVectors(_shotCamU, _shotCamF).normalize();
  if (_shotCamR.lengthSq() < 1e-8) _shotCamR.set(1, 0, 0);
  _shotCamU.crossVectors(_shotCamF, _shotCamR).normalize();
  // Project world velocity onto camera right/up plane
  const pr = b.vx * _shotCamR.x + b.vz * _shotCamR.z;
  const pu = b.vx * _shotCamU.x + (b.vy || 0) * _shotCamU.y + b.vz * _shotCamU.z;
  m.rotateZ(-Math.atan2(pr, pu));
}

function bulletMesh(weapon, tier) {
  const spec = WEAPON_SHOT[weapon] || WEAPON_SHOT.mg;
  const key = weapon + ':' + tier;
  if (!BULLET_POOLS[key]) BULLET_POOLS[key] = [];
  const m = BULLET_POOLS[key].pop();
  if (m) { m.visible = true; return m; }
  const color = new THREE.Color(spec.tiers[tier] || spec.tiers[0]);
  const shot = spec.shot;
  const spriteKey = spec.sprite;
  let mesh;
  if (spriteKey) {
    const tex = loadAmmoTex(spriteKey);
    mesh = new THREE.Mesh(
      shotGeo(shot),
      new THREE.MeshBasicMaterial({
        map: tex, color: 0xffffff, transparent: true, alphaTest: 0.45,
        depthWrite: true, fog: false, side: THREE.DoubleSide,
      })
    );
  } else if (shot === 'line') {
    // Short cyan streak — no detailed sprite
    mesh = new THREE.Mesh(shotGeo('line'), new THREE.MeshBasicMaterial({ color, fog: false }));
    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })
    );
    tip.position.y = 0.18;
    mesh.add(tip);
  } else {
    mesh = new THREE.Mesh(shotGeo(shot), new THREE.MeshBasicMaterial({ color, fog: false }));
  }
  if (shot === 'blade' || shot === 'wave') mesh.rotation.z = Math.PI / 2;
  mesh.userData.shot = shot;
  mesh.userData.spriteKey = spriteKey || null;
  return mesh;
}

function recycleBullets(parent) {
  for (let i = parent.children.length - 1; i >= 0; i--) {
    const m = parent.children[i];
    parent.remove(m);
    m.visible = false;
    const key = m.userData.key || 'mg:0';
    if (!BULLET_POOLS[key]) BULLET_POOLS[key] = [];
    BULLET_POOLS[key].push(m);
  }
}

/** Flying mech fragments for 粉身碎骨 kills. */
const FRAG_POOL = [];
function spawnFragments(parent, x, z, colorHex, n = 8) {
  const tex = loadAmmoTex('fragment');
  for (let i = 0; i < n; i++) {
    let m = FRAG_POOL.pop();
    if (!m) {
      m = new THREE.Mesh(
        new THREE.PlaneGeometry(0.28, 0.28),
        new THREE.MeshBasicMaterial({
          map: tex, transparent: true, alphaTest: 0.45, depthWrite: true, fog: false, side: THREE.DoubleSide,
        })
      );
    }
    m.visible = true;
    m.position.set(x, 0.6 + Math.random() * 0.4, z);
    const ang = Math.random() * Math.PI * 2;
    const sp = 3 + Math.random() * 5;
    m.userData.vx = Math.cos(ang) * sp;
    m.userData.vz = Math.sin(ang) * sp;
    m.userData.vy = 4 + Math.random() * 5;
    m.userData.life = 0.55 + Math.random() * 0.35;
    m.userData.spin = (Math.random() - 0.5) * 12;
    if (m.material && !m.material.map) m.material.color.setHex(colorHex || 0x8a93a8);
    parent.add(m);
  }
}

// Drops (v0.9.30): distinct silhouettes — XP shards / heal pack / magnet disc / weapon board.
// Cheap canvas textures + simple planes/discs; billboard via userData.cube/face.
// ---------------------------------------------------------------------------
const DROP_TEX = Object.create(null);

function dropLabel(kind, weapon) {
  if (kind === 'xp') return 'XP';
  if (kind === 'heal') return 'HP';
  if (kind === 'magnet') return 'MAG';
  if (kind === 'shield') return 'SH';
  if (kind === 'weapon') return WEAPON_DROP_LABEL[weapon] || (weapon ? String(weapon).toUpperCase().slice(0, 5) : 'GUN');
  return (DROP[kind] && DROP[kind].letter) || '?';
}

function hexOf(color) {
  return '#' + (color >>> 0).toString(16).padStart(6, '0');
}

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

function finishDropTex(c) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

/** Small green crystal shards — not a letter-board cube. */
function makeXpShardTexture() {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, s, s);
  const shards = [
    { x: 118, y: 70, w: 38, h: 92, rot: -0.22, fill: '#3bff8a', edge: '#b8ffe0' },
    { x: 78, y: 110, w: 30, h: 70, rot: 0.35, fill: '#1fd96a', edge: '#7cffb0' },
    { x: 155, y: 120, w: 26, h: 58, rot: -0.55, fill: '#7cff9a', edge: '#e0ffe8' },
  ];
  for (const sh of shards) {
    ctx.save();
    ctx.translate(sh.x, sh.y);
    ctx.rotate(sh.rot);
    ctx.shadowColor = '#3bff8a';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(0, -sh.h / 2);
    ctx.lineTo(sh.w / 2, -sh.h * 0.1);
    ctx.lineTo(sh.w * 0.2, sh.h / 2);
    ctx.lineTo(-sh.w * 0.35, sh.h * 0.35);
    ctx.lineTo(-sh.w / 2, -sh.h * 0.05);
    ctx.closePath();
    ctx.fillStyle = sh.fill;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = sh.edge;
    ctx.lineWidth = 3;
    ctx.stroke();
    // highlight facet
    ctx.beginPath();
    ctx.moveTo(0, -sh.h / 2);
    ctx.lineTo(sh.w * 0.15, -sh.h * 0.05);
    ctx.lineTo(-sh.w * 0.1, sh.h * 0.1);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(180,255,210,0.7)';
  ctx.font = '700 22px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('XP', s / 2, s - 28);
  return finishDropTex(c);
}

/** White + green medical cross pack. */
function makeHealPackTexture() {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, s, s);
  // pack body
  ctx.shadowColor = '#7cff9a';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#f2fff6';
  roundRect(ctx, 48, 58, 160, 140, 22);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#3bff8a';
  roundRect(ctx, 48, 58, 160, 140, 22);
  ctx.stroke();
  // green cross
  ctx.fillStyle = '#1aa84f';
  ctx.fillRect(112, 88, 32, 88);
  ctx.fillRect(84, 116, 88, 32);
  // white bevel on cross
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(118, 92, 10, 78);
  ctx.fillRect(90, 122, 76, 10);
  // strap
  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(48, 78, 160, 12);
  ctx.fillStyle = 'rgba(30,80,50,0.75)';
  ctx.font = '800 20px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('REPAIR', s / 2, s - 28);
  return finishDropTex(c);
}

/** Blue magnet pulse disc. */
function makeMagnetDiscTexture() {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, s, s);
  const cx = s / 2, cy = s / 2 - 6;
  // outer glow disc
  const grd = ctx.createRadialGradient(cx, cy, 20, cx, cy, 110);
  grd.addColorStop(0, 'rgba(160,220,255,0.95)');
  grd.addColorStop(0.45, 'rgba(74,168,255,0.85)');
  grd.addColorStop(1, 'rgba(20,60,120,0.05)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, 108, 0, Math.PI * 2);
  ctx.fill();
  // pulse rings
  ctx.strokeStyle = 'rgba(180,230,255,0.85)';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(cx, cy, 78, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(100,180,255,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, 98, 0, Math.PI * 2); ctx.stroke();
  // horseshoe / magnet glyph
  ctx.strokeStyle = '#e8f6ff';
  ctx.lineWidth = 18;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.arc(cx, cy + 8, 42, Math.PI * 0.15, Math.PI * 0.85, true);
  ctx.stroke();
  ctx.fillStyle = '#ff5a5a';
  ctx.fillRect(cx - 50, cy + 4, 16, 28);
  ctx.fillStyle = '#c0d0e0';
  ctx.fillRect(cx + 34, cy + 4, 16, 28);
  ctx.fillStyle = 'rgba(180,220,255,0.85)';
  ctx.font = '800 20px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MAGNET', s / 2, s - 22);
  return finishDropTex(c);
}

/** Gold-framed weapon board (v0.9.29 style — keep landmark readable). */
function makeWeaponBoardTexture(kind, weapon) {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  const color = (DROP[kind] && DROP[kind].color) || 0xffc21a;
  const hex = hexOf(color);
  ctx.clearRect(0, 0, s, s);
  ctx.fillStyle = 'rgba(10, 14, 20, 0.92)';
  roundRect(ctx, 10, 10, s - 20, s - 20, 18);
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = hex;
  roundRect(ctx, 18, 18, s - 36, s - 36, 14);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(200, 240, 255, 0.55)';
  roundRect(ctx, 28, 28, s - 56, s - 56, 10);
  ctx.stroke();
  ctx.strokeStyle = hex;
  ctx.lineWidth = 4;
  const t = 22;
  for (const [x, y, dx, dy] of [
    [34, 34, t, 0], [34, 34, 0, t],
    [s - 34, 34, -t, 0], [s - 34, 34, 0, t],
    [34, s - 34, t, 0], [34, s - 34, 0, -t],
    [s - 34, s - 34, -t, 0], [s - 34, s - 34, 0, -t],
  ]) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke();
  }
  const label = dropLabel(kind, weapon);
  ctx.fillStyle = hex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const len = label.length;
  const px = len <= 2 ? 118 : len <= 3 ? 92 : len <= 4 ? 72 : 58;
  ctx.font = '900 ' + px + 'px "Segoe UI", "Arial Black", Orbitron, sans-serif';
  ctx.shadowColor = hex;
  ctx.shadowBlur = 26;
  ctx.fillText(label, s / 2, s / 2 + 4);
  ctx.shadowBlur = 0;
  ctx.font = '700 18px "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(180, 220, 240, 0.75)';
  const cap = kind === 'weapon' ? 'WEAPON' : String(kind).toUpperCase();
  ctx.fillText(cap, s / 2, s - 42);
  return finishDropTex(c);
}

function makeDropTexture(kind, weapon) {
  if (kind === 'xp') return makeXpShardTexture();
  if (kind === 'heal') return makeHealPackTexture();
  if (kind === 'magnet') return makeMagnetDiscTexture();
  // weapon / shield / fallback → framed board
  return makeWeaponBoardTexture(kind, weapon);
}

function dropTexture(kind, weapon) {
  const key = kind + ':' + (weapon || '') + ':v4';
  if (!DROP_TEX[key]) DROP_TEX[key] = makeDropTexture(kind, weapon);
  return DROP_TEX[key];
}

/** Kind-specific silhouette mesh; billboard face in userData.cube/face. */
function dropMesh(d) {
  const g = new THREE.Group();
  const meta = DROP[d.kind] || DROP.xp;
  const color = meta.color || 0x00e5ff;
  const faceSize = meta.scale || 1.0;
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(faceSize, faceSize),
    new THREE.MeshBasicMaterial({
      map: dropTexture(d.kind, d.weapon),
      transparent: true,
      alphaTest: 0.08,
      depthWrite: false,
      fog: false,
      side: THREE.DoubleSide,
    })
  );
  // Hover height: shards sit lower; weapon crate taller landmark
  const hoverY = d.kind === 'xp' ? 0.55 : d.kind === 'heal' ? 0.7 : d.kind === 'magnet' ? 0.45 : 0.85;
  board.position.y = hoverY;
  board.name = 'face';
  const glowR = meta.glowR != null ? meta.glowR : 0.5;
  const glowOp = meta.glowOp != null ? meta.glowOp : 0.4;
  const rimInner = meta.rimInner != null ? meta.rimInner : 0.42;
  const rimOuter = meta.rimOuter != null ? meta.rimOuter : 0.55;
  const rimOp = meta.rimOp != null ? meta.rimOp : 0.6;
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(glowR, 24),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: glowOp, depthWrite: false, fog: false })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.03;
  const rim = new THREE.Mesh(
    new THREE.RingGeometry(rimInner, rimOuter, 28),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: rimOp, side: THREE.DoubleSide, depthWrite: false, fog: false })
  );
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.04;
  g.add(board, glow, rim);
  g.userData.cube = board;
  g.userData.face = board;
  g.userData.bill = board;
  g.userData.dropKind = d.kind;
  g.userData.hoverY = hoverY;
  return g;
}
// ---------------------------------------------------------------------------
// Map props: low, readable, no tall buildings (never block the view).
// Phase 6: lab teal / assembly amber / reactor violet-cyan / blockade steel-olive / rooftop night-blue.
// Same arena size/floor; only edge décor + trim color temperature change.
// ---------------------------------------------------------------------------
const EDGE_SPOTS = [[-14, -12], [16, -14], [12, 14], [-18, 14], [0, -20], [22, 2], [-22, -2], [0, 20]];

function buildLabEdgeDecor() {
  const group = new THREE.Group();
  group.name = 'edgeDecor';
  // Phase 3 lab framing: cooler cyan-teal edge accents; keep décor dim vs playable floor.
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x101820, emissive: 0x0c141c, emissiveIntensity: 0.14, roughness: 0.72, metalness: 0.28 });
  const edgeMat = mat(0x1a6a78, 0.22); // cooler lab teal
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x0c141c, emissive: 0x0e1a22, emissiveIntensity: 0.12, roughness: 0.74, metalness: 0.22 });
  const debrisMat = new THREE.MeshStandardMaterial({ color: 0x121a24, emissive: 0x101c28, emissiveIntensity: 0.12, roughness: 0.68, metalness: 0.3 });
  const pipeMat = hullMat(0x163040, 0.12);
  const panelMat = mat(0x148a9a, 0.28);

  let i = 0;
  for (const [zx, zz] of EDGE_SPOTS) {
    const kind = i % 4;
    if (kind === 0) {
      for (let k = 0; k < 3; k++) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), crateMat);
        c.position.set(zx + k * 0.9, 0.3, zz + (k % 2) * 0.2);
        c.rotation.y = k * 0.3;
        const top = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.05, 0.84), edgeMat);
        top.position.set(c.position.x, 0.62, c.position.z);
        top.rotation.y = c.rotation.y;
        group.add(c, top);
      }
    } else if (kind === 1) {
      for (let k = 0; k < 3; k++) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), pipeMat);
        p.position.set(zx + k * 0.7 - 0.7, 0.22, zz);
        group.add(p);
      }
      const rail = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.06), edgeMat);
      rail.position.set(zx, 0.4, zz);
      group.add(rail);
    } else if (kind === 2) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 1.0), wallMat);
      box.position.set(zx, 0.45, zz);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.06, 1.02), edgeMat);
      stripe.position.set(zx, 0.86, zz);
      group.add(box, stripe);
    } else {
      for (let k = 0; k < 4; k++) {
        const d = new THREE.Mesh(new THREE.BoxGeometry(0.3 + (k % 2) * 0.2, 0.18, 0.28), debrisMat);
        d.position.set(zx + (k - 1.5) * 0.4, 0.1, zz + (k % 2) * 0.3);
        d.rotation.y = k * 0.8;
        group.add(d);
      }
    }
    i++;
  }

  for (let k = 0; k < 5; k++) {
    const x = -24 + k * 12;
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), pipeMat);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(x, 0.16, -26 + (k % 2) * 52);
    group.add(pipe);
  }
  for (let k = 0; k < 6; k++) {
    const ang = (k / 6) * Math.PI * 2;
    const r = ARENA.soft - 1.2;
    const px = Math.cos(ang) * r;
    const pz = Math.sin(ang) * r;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.35), panelMat);
    panel.position.set(px, 0.12, pz);
    panel.rotation.y = -ang + Math.PI / 2;
    group.add(panel);
  }
  return group;
}

/**
 * Assembly bay edge décor — distinct shapes (not a teal→amber recolor of lab crates):
 * incomplete mech frames, gantry/crane silhouettes, part pallets, hazard stripes.
 * Trim: warm amber/industrial orange at low emissive (danger telegraph colors stay free).
 * Hull steel stays graphite — never red mech hulls.
 */
function buildAssemblyEdgeDecor() {
  const group = new THREE.Group();
  group.name = 'edgeDecor';
  const steel = new THREE.MeshStandardMaterial({ color: 0x242830, emissive: 0x1a1e26, emissiveIntensity: 0.16, roughness: 0.55, metalness: 0.55 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x181c22, emissive: 0x12161c, emissiveIntensity: 0.12, roughness: 0.7, metalness: 0.4 });
  const amber = mat(0xc47828, 0.28); // warm industrial trim (not danger red / acid)
  const stripeA = mat(0xd48820, 0.24);
  const stripeB = new THREE.MeshStandardMaterial({ color: 0x141820, emissive: 0x0a0c10, emissiveIntensity: 0.06, roughness: 0.8, metalness: 0.2 });

  let i = 0;
  for (const [zx, zz] of EDGE_SPOTS) {
    const kind = i % 4;
    if (kind === 0) {
      // Incomplete mech frame: pelvis + torso + one missing-limb stub (graphite, not red)
      const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.55), steel);
      pelvis.position.set(zx, 0.28, zz);
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.45), dark);
      torso.position.set(zx, 0.85, zz);
      const stub = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.22), steel);
      stub.position.set(zx + 0.55, 0.7, zz);
      stub.rotation.z = 0.4;
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.05, 0.48), amber);
      trim.position.set(zx, 1.28, zz);
      // empty socket plate (missing limb)
      const socket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.08), amber);
      socket.position.set(zx - 0.42, 0.75, zz);
      group.add(pelvis, torso, stub, trim, socket);
    } else if (kind === 1) {
      // Gantry / crane silhouette: two uprights + boom
      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), steel);
      postL.position.set(zx - 0.9, 0.8, zz);
      const postR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), steel);
      postR.position.set(zx + 0.9, 0.8, zz);
      const boom = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.14), dark);
      boom.position.set(zx, 1.55, zz);
      const hook = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), amber);
      hook.position.set(zx + 0.3, 1.25, zz);
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.5), dark);
      base.position.set(zx, 0.06, zz);
      group.add(postL, postR, boom, hook, base);
    } else if (kind === 2) {
      // Part pallet + stacked parts
      const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.1), dark);
      pallet.position.set(zx, 0.08, zz);
      for (let k = 0; k < 3; k++) {
        const part = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28 + (k % 2) * 0.15, 0.35), steel);
        part.position.set(zx - 0.5 + k * 0.5, 0.3 + (k % 2) * 0.05, zz + (k % 2) * 0.15);
        part.rotation.y = k * 0.4;
        group.add(part);
      }
      // Hazard stripe bar on pallet edge (amber/dark alternating — décor, not telegraph)
      for (let k = 0; k < 5; k++) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.12), k % 2 ? stripeA : stripeB);
        s.position.set(zx - 0.7 + k * 0.35, 0.16, zz + 0.55);
        group.add(s);
      }
      group.add(pallet);
    } else {
      // Floor hazard chevron strip + low rack
      for (let k = 0; k < 4; k++) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.03, 0.22), k % 2 ? stripeA : stripeB);
        s.position.set(zx + (k - 1.5) * 0.5, 0.03, zz);
        s.rotation.y = 0.35;
        group.add(s);
      }
      const rack = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.35), steel);
      rack.position.set(zx, 0.4, zz - 0.4);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.05, 0.08), amber);
      rail.position.set(zx, 0.78, zz - 0.4);
      group.add(rack, rail);
    }
    i++;
  }

  // Perimeter amber panel strips (warmer trim vs lab teal)
  for (let k = 0; k < 6; k++) {
    const ang = (k / 6) * Math.PI * 2;
    const r = ARENA.soft - 1.2;
    const px = Math.cos(ang) * r;
    const pz = Math.sin(ang) * r;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.35), amber);
    panel.position.set(px, 0.12, pz);
    panel.rotation.y = -ang + Math.PI / 2;
    group.add(panel);
  }
  return group;
}


/**
 * Reactor edge décor — distinct shapes (not a recolor of lab/assembly):
 * cooling towers, plasma pipes, energy pillars, hazard rails, radiation stripes.
 * Trim: cool violet / electric-cyan (contrast assembly amber + lab teal).
 * Hull stays graphite — never red mech hulls. Danger telegraph colors stay free.
 */
function buildReactorEdgeDecor() {
  const group = new THREE.Group();
  group.name = 'edgeDecor';
  const steel = new THREE.MeshStandardMaterial({ color: 0x1e2430, emissive: 0x141820, emissiveIntensity: 0.14, roughness: 0.58, metalness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x12161e, emissive: 0x0c1018, emissiveIntensity: 0.1, roughness: 0.72, metalness: 0.38 });
  const violet = mat(0x7a3cff, 0.3);       // cool violet trim
  const cyan = mat(0x28e8ff, 0.32);        // electric-cyan energy
  const stripeA = mat(0x6a38e0, 0.22);
  const stripeB = new THREE.MeshStandardMaterial({ color: 0x10141c, emissive: 0x080a10, emissiveIntensity: 0.06, roughness: 0.82, metalness: 0.2 });

  let i = 0;
  for (const [zx, zz] of EDGE_SPOTS) {
    const kind = i % 4;
    if (kind === 0) {
      // Cooling tower: tapered cylinder + rim ring + cyan vent glow
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.85, 1.35, 10), dark);
      tower.position.set(zx, 0.68, zz);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 10), steel);
      rim.position.set(zx, 1.38, zz);
      const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 8), cyan);
      vent.position.set(zx, 1.44, zz);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.1, 10), steel);
      base.position.set(zx, 0.05, zz);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.06), violet);
      trim.position.set(zx + 0.7, 0.55, zz);
      group.add(tower, rim, vent, base, trim);
    } else if (kind === 1) {
      // Plasma pipes: bent conduit runs with cyan joints
      for (let k = 0; k < 3; k++) {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.1, 8), steel);
        pipe.rotation.z = Math.PI / 2;
        pipe.position.set(zx + (k - 1) * 0.05, 0.35 + k * 0.28, zz + k * 0.15);
        group.add(pipe);
        const joint = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), cyan);
        joint.position.set(zx + 0.55, 0.35 + k * 0.28, zz + k * 0.15);
        group.add(joint);
      }
      const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8), dark);
      riser.position.set(zx - 0.55, 0.5, zz);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.22), violet);
      cap.position.set(zx - 0.55, 0.96, zz);
      group.add(riser, cap);
    } else if (kind === 2) {
      // Energy pillar: tall thin column + violet tip + cyan rings
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.7, 8), steel);
      pillar.position.set(zx, 0.85, zz);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.35, 8), violet);
      tip.position.set(zx, 1.85, zz);
      for (let k = 0; k < 3; k++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 12), cyan);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(zx, 0.4 + k * 0.4, zz);
        group.add(ring);
      }
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.55), dark);
      plinth.position.set(zx, 0.06, zz);
      group.add(pillar, tip, plinth);
    } else {
      // Hazard rail + radiation stripe chevrons (violet/dark — décor, not danger telegraph)
      const railPostL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.08), steel);
      railPostL.position.set(zx - 0.85, 0.28, zz);
      const railPostR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.08), steel);
      railPostR.position.set(zx + 0.85, 0.28, zz);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.06), violet);
      rail.position.set(zx, 0.55, zz);
      group.add(railPostL, railPostR, rail);
      for (let k = 0; k < 5; k++) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.18), k % 2 ? stripeA : stripeB);
        s.position.set(zx - 0.7 + k * 0.35, 0.03, zz + 0.35);
        s.rotation.y = 0.4;
        group.add(s);
      }
      // low containment block
      const block = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.4), dark);
      block.position.set(zx, 0.22, zz - 0.35);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.04, 0.42), cyan);
      strip.position.set(zx, 0.44, zz - 0.35);
      group.add(block, strip);
    }
    i++;
  }

  // Perimeter violet-cyan panel strips
  for (let k = 0; k < 6; k++) {
    const ang = (k / 6) * Math.PI * 2;
    const r = ARENA.soft - 1.2;
    const px = Math.cos(ang) * r;
    const pz = Math.sin(ang) * r;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.35), k % 2 ? violet : cyan);
    panel.position.set(px, 0.12, pz);
    panel.rotation.y = -ang + Math.PI / 2;
    group.add(panel);
  }
  return group;
}


/**
 * Blockade edge décor — distinct military shapes (not a recolor of prior zones):
 * barricades, sandbags, wire, wrecked APC silhouettes, watch posts.
 * Trim: steel-gray / olive-drab (contrast reactor violet-cyan, assembly amber, lab teal).
 * Hull stays graphite — never red mech hulls. Danger telegraph colors stay free.
 */
function buildBlockadeEdgeDecor() {
  const group = new THREE.Group();
  group.name = 'edgeDecor';
  const steel = new THREE.MeshStandardMaterial({ color: 0x3a4248, emissive: 0x1c2228, emissiveIntensity: 0.14, roughness: 0.55, metalness: 0.55 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1e22, emissive: 0x101418, emissiveIntensity: 0.1, roughness: 0.72, metalness: 0.35 });
  const olive = mat(0x5a6a38, 0.22);      // olive-drab trim
  const steelTrim = mat(0x8a9aaa, 0.2);   // steel-gray trim
  const sand = new THREE.MeshStandardMaterial({ color: 0x6a5a38, emissive: 0x2a2418, emissiveIntensity: 0.1, roughness: 0.9, metalness: 0.05 });
  const wireMat = new THREE.MeshStandardMaterial({ color: 0x4a5058, emissive: 0x202428, emissiveIntensity: 0.08, roughness: 0.45, metalness: 0.7 });

  let i = 0;
  for (const [zx, zz] of EDGE_SPOTS) {
    const kind = i % 4;
    if (kind === 0) {
      // Concrete barricade / jersey barrier + olive stripe
      const wall = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 0.45), dark);
      wall.position.set(zx, 0.35, zz);
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.08, 0.5), steel);
      top.position.set(zx, 0.74, zz);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.06, 0.48), olive);
      stripe.position.set(zx, 0.5, zz);
      group.add(wall, top, stripe);
    } else if (kind === 1) {
      // Sandbag stack + low wire coil
      for (let k = 0; k < 3; k++) {
        for (let r = 0; r < 2 - (k === 2 ? 1 : 0); r++) {
          const bag = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.35), sand);
          bag.position.set(zx - 0.3 + r * 0.55 + (k % 2) * 0.1, 0.12 + k * 0.22, zz);
          bag.rotation.y = (k + r) * 0.15;
          group.add(bag);
        }
      }
      // Wire posts + strand
      const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), wireMat);
      postL.position.set(zx - 0.9, 0.35, zz + 0.45);
      const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), wireMat);
      postR.position.set(zx + 0.9, 0.35, zz + 0.45);
      const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.8, 6), wireMat);
      strand.rotation.z = Math.PI / 2;
      strand.position.set(zx, 0.55, zz + 0.45);
      group.add(postL, postR, strand);
    } else if (kind === 2) {
      // Wrecked APC silhouette: hull + turret stub + broken track (graphite, not red)
      const hull = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 0.95), steel);
      hull.position.set(zx, 0.35, zz);
      hull.rotation.y = 0.25;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.75), dark);
      cabin.position.set(zx - 0.35, 0.75, zz);
      cabin.rotation.y = 0.25;
      const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.25, 8), steel);
      turret.position.set(zx + 0.25, 0.78, zz + 0.05);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 6), dark);
      barrel.rotation.z = Math.PI / 2;
      barrel.position.set(zx + 0.55, 0.78, zz + 0.05);
      const trackL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 0.18), dark);
      trackL.position.set(zx, 0.1, zz + 0.5);
      trackL.rotation.y = 0.25;
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.8), olive);
      trim.position.set(zx - 0.35, 0.96, zz);
      trim.rotation.y = 0.25;
      group.add(hull, cabin, turret, barrel, trackL, trim);
    } else {
      // Watch post: upright + platform + olive rail
      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.5, 0.14), steel);
      pole.position.set(zx, 0.75, zz);
      const platform = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.9), dark);
      platform.position.set(zx, 1.5, zz);
      const railF = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.06), olive);
      railF.position.set(zx, 1.7, zz + 0.4);
      const railB = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.06), olive);
      railB.position.set(zx, 1.7, zz - 0.4);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), steelTrim);
      lamp.position.set(zx, 1.85, zz);
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), dark);
      base.position.set(zx, 0.05, zz);
      group.add(pole, platform, railF, railB, lamp, base);
    }
    i++;
  }

  // Perimeter steel/olive panel strips
  for (let k = 0; k < 6; k++) {
    const ang = (k / 6) * Math.PI * 2;
    const r = ARENA.soft - 1.2;
    const px = Math.cos(ang) * r;
    const pz = Math.sin(ang) * r;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.35), k % 2 ? olive : steelTrim);
    panel.position.set(px, 0.12, pz);
    panel.rotation.y = -ang + Math.PI / 2;
    group.add(panel);
  }
  return group;
}


/**
 * Rooftop edge décor — distinct night-escape shapes (not a recolor of prior zones):
 * antennas, vents, helipad silhouette, low rails, distant city light dots.
 * Trim: night-blue / cold-white (contrast blockade olive, reactor violet, assembly amber, lab teal).
 * Keep props low — never block the top-down view. No red mech hulls.
 */
function buildRooftopEdgeDecor() {
  const group = new THREE.Group();
  group.name = 'edgeDecor';
  const asphalt = new THREE.MeshStandardMaterial({ color: 0x1a1e28, emissive: 0x0c1018, emissiveIntensity: 0.1, roughness: 0.88, metalness: 0.15 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x2a3240, emissive: 0x141820, emissiveIntensity: 0.12, roughness: 0.55, metalness: 0.5 });
  const nightBlue = mat(0x3a6ad8, 0.26);   // night-blue trim
  const coldWhite = mat(0xc8d8f0, 0.28);   // cold-white accent
  const cityDot = mat(0xa8c0ff, 0.4);

  let i = 0;
  for (const [zx, zz] of EDGE_SPOTS) {
    const kind = i % 4;
    if (kind === 0) {
      // Antenna mast (low): base + thin mast + dish stub — keep under ~1.4 tall
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 0.18, 8), asphalt);
      base.position.set(zx, 0.09, zz);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.15, 6), steel);
      mast.position.set(zx, 0.7, zz);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), coldWhite);
      tip.position.set(zx, 1.3, zz);
      const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 10), nightBlue);
      dish.rotation.x = Math.PI / 2.4;
      dish.position.set(zx + 0.12, 0.95, zz);
      group.add(base, mast, tip, dish);
    } else if (kind === 1) {
      // HVAC vents: low box + grille + blue trim strip
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45, 0.8), asphalt);
      box.position.set(zx, 0.25, zz);
      const grille = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.7), steel);
      grille.position.set(zx, 0.5, zz);
      for (let k = 0; k < 3; k++) {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.02, 0.08), nightBlue);
        slot.position.set(zx, 0.52, zz - 0.2 + k * 0.2);
        group.add(slot);
      }
      const trim = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.04, 0.82), coldWhite);
      trim.position.set(zx, 0.48, zz);
      group.add(box, grille, trim);
    } else if (kind === 2) {
      // Helipad corner / H-mark fragment (flat, asphalt-gray pad + cold-white H)
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.06, 16), asphalt);
      pad.position.set(zx, 0.03, zz);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.035, 6, 24), nightBlue);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(zx, 0.07, zz);
      // H bars
      const hL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.7), coldWhite);
      hL.position.set(zx - 0.22, 0.07, zz);
      const hR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.7), coldWhite);
      hR.position.set(zx + 0.22, 0.07, zz);
      const hMid = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.03, 0.12), coldWhite);
      hMid.position.set(zx, 0.07, zz);
      group.add(pad, ring, hL, hR, hMid);
    } else {
      // Low perimeter rail + distant city light dots along edge
      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), steel);
      postL.position.set(zx - 0.85, 0.2, zz);
      const postR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), steel);
      postR.position.set(zx + 0.85, 0.2, zz);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 0.05), nightBlue);
      rail.position.set(zx, 0.4, zz);
      group.add(postL, postR, rail);
      for (let k = 0; k < 5; k++) {
        const dot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), k % 2 ? coldWhite : cityDot);
        dot.position.set(zx - 0.7 + k * 0.35, 0.08, zz + 0.45);
        group.add(dot);
      }
      const curb = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.25), asphalt);
      curb.position.set(zx, 0.05, zz - 0.35);
      group.add(curb);
    }
    i++;
  }

  // Perimeter night-blue / cold-white panel strips + sparse city dots farther out
  for (let k = 0; k < 6; k++) {
    const ang = (k / 6) * Math.PI * 2;
    const r = ARENA.soft - 1.2;
    const px = Math.cos(ang) * r;
    const pz = Math.sin(ang) * r;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.35), k % 2 ? nightBlue : coldWhite);
    panel.position.set(px, 0.12, pz);
    panel.rotation.y = -ang + Math.PI / 2;
    group.add(panel);
  }
  for (let k = 0; k < 10; k++) {
    const ang = (k / 10) * Math.PI * 2 + 0.2;
    const r = ARENA.soft + 0.6;
    const px = Math.cos(ang) * r;
    const pz = Math.sin(ang) * r;
    const dot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), k % 3 ? cityDot : coldWhite);
    dot.position.set(px, 0.2 + (k % 3) * 0.08, pz);
    group.add(dot);
  }
  return group;
}

function buildEdgeDecor(zone) {
  if (zone === 'rooftop') return buildRooftopEdgeDecor();
  if (zone === 'blockade') return buildBlockadeEdgeDecor();
  if (zone === 'reactor') return buildReactorEdgeDecor();
  if (zone === 'assembly') return buildAssemblyEdgeDecor();
  return buildLabEdgeDecor();
}

export class View {
  constructor(stage) {
    this.stage = stage;
    this.group = new THREE.Group();
    stage.scene.add(this.group);

    // ---- arena floor (top-down background_arena)
    const floorSize = ARENA.half * 2 + 4;
    const floorTex = makeFloorTexture();
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(floorSize, floorSize),
      new THREE.MeshStandardMaterial({
        // Phase 2 floor readability: darker playable ground so silhouettes /
        // bullets / pickups / danger telegraphs out-compete grid & dust.
        map: floorTex, color: 0x303842, emissive: 0x010406, emissiveIntensity: 0.06,
        roughness: 0.94, metalness: 0.05,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = ARENA.floorY;
    this.group.add(floor);

    // Soft playable ring + outer hard edge (five-zone trim: teal/amber/violet/olive/night-blue)
    this.softRing = new THREE.Mesh(
      new THREE.RingGeometry(ARENA.soft - 0.18, ARENA.soft + 0.08, 96),
      new THREE.MeshBasicMaterial({ color: 0x1a6a78, transparent: true, opacity: 0.04, side: THREE.DoubleSide })
    );
    this.softRing.rotation.x = -Math.PI / 2;
    this.softRing.position.y = 0.04;
    this.group.add(this.softRing);
    this.hardRing = new THREE.Mesh(
      new THREE.RingGeometry(ARENA.half - 0.12, ARENA.half + 0.06, 96),
      new THREE.MeshBasicMaterial({ color: 0x3a6068, transparent: true, opacity: 0.05, side: THREE.DoubleSide })
    );
    this.hardRing.rotation.x = -Math.PI / 2;
    this.hardRing.position.y = 0.05;
    this.group.add(this.hardRing);
    // Center pad ring — reads as lab arena spawn (kept quiet vs pickups)
    this.padRing = new THREE.Mesh(
      new THREE.RingGeometry(2.4, 2.55, 64),
      new THREE.MeshBasicMaterial({ color: 0x1a6a78, transparent: true, opacity: 0.032, side: THREE.DoubleSide })
    );
    this.padRing.rotation.x = -Math.PI / 2;
    this.padRing.position.y = 0.035;
    this.group.add(this.padRing);
    this.mapZone = 'lab';
    this.edgeDecor = buildEdgeDecor('lab');
    this.group.add(this.edgeDecor);

    this.player = null;
    this.playerMechId = null;
    preloadAllSprites();
    for (const k of Object.keys(AMMO_PATHS)) loadAmmoTex(k);
    this.setMech('horn');

    // Scientist doctor — visible map prop near start (shop/NPC hook later).
    this.doctor = buildDoctorNpc();
    this.doctor.position.set(3.6, 0, -2.4);
    this.group.add(this.doctor);

    this.novaRing = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.35, 32),
      new THREE.MeshBasicMaterial({ color: 0xffe600, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    this.novaRing.rotation.x = -Math.PI / 2;
    this.novaRing.visible = false;
    this.group.add(this.novaRing);

    // Phase 3: elite charge telegraph lane(s) — hunter uses twin lanes (dual blades)
    this.warnLane = warningLane();
    this.group.add(this.warnLane);
    this.warnLane2 = warningLane();
    if (this.warnLane2.userData.mat) this.warnLane2.userData.mat.color.setHex(0xff8a1a);
    this.group.add(this.warnLane2);
    // Phase 3 sniper: up to 4 concurrent red aim lines
    this.sniperAimLines = [];
    for (let i = 0; i < 4; i++) {
      const line = sniperAimLine();
      this.group.add(line);
      this.sniperAimLines.push(line);
    }
    // Phase 3 shield: up to 4 concurrent red bash wedges
    this.shieldBashLanes = [];
    for (let i = 0; i < 4; i++) {
      const lane = shieldBashLane();
      this.group.add(lane);
      this.shieldBashLanes.push(lane);
    }
    // Phase 3 artillery: up to 4 concurrent orange blast rings
    this.artilleryBlastRings = [];
    for (let i = 0; i < 4; i++) {
      const ring = artilleryBlastRing();
      this.group.add(ring);
      this.artilleryBlastRings.push(ring);
    }
    // Phase 3 bomber: up to 4 concurrent red self-blast rings
    this.bomberBlastRings = [];
    for (let i = 0; i < 4; i++) {
      const ring = bomberBlastRing();
      this.group.add(ring);
      this.bomberBlastRings.push(ring);
    }
    // Phase 3 flanker: up to 4 concurrent cyan dash wedges
    this.flankerDashLanes = [];
    for (let i = 0; i < 4; i++) {
      const lane = flankerDashLane();
      this.group.add(lane);
      this.flankerDashLanes.push(lane);
    }
    // Phase 3 medic: up to 3 concurrent lime heal auras
    this.medicHealAuras = [];
    for (let i = 0; i < 3; i++) {
      const aura = medicHealAura();
      this.group.add(aura);
      this.medicHealAuras.push(aura);
    }
    // Phase 3 jammer: up to 3 concurrent violet jam rings
    this.jammerJamAuras = [];
    for (let i = 0; i < 3; i++) {
      const aura = jammerJamAura();
      this.group.add(aura);
      this.jammerJamAuras.push(aura);
    }
    // Phase 6 danger pulse: up to 2 concurrent arena red rings (reuse bomber-style red helper)
    this.dangerPulseRings = [];
    for (let i = 0; i < 2; i++) {
      const ring = bomberBlastRing();
      this.group.add(ring);
      this.dangerPulseRings.push(ring);
    }
    // Phase 6 zone pressure: cyan/acid shrinking safe-edge ring
    this.zonePressureEdge = zonePressureRing();
    this.group.add(this.zonePressureEdge);
    // Phase 3 commander: up to 6 orange/red summon drop marks
    this.commanderSummonRings = [];
    for (let i = 0; i < 6; i++) {
      const ring = commanderSummonRing();
      this.group.add(ring);
      this.commanderSummonRings.push(ring);
    }
    // Boss volley lanes (up to 6) + orbit floor ring
    this.bossLanes = [];
    for (let i = 0; i < 6; i++) {
      const lane = warningLane();
      if (lane.userData.mat) lane.userData.mat.color.setHex(0xb8ff3a);
      this.group.add(lane);
      this.bossLanes.push(lane);
    }
    this.bossOrbitRing = new THREE.Mesh(
      new THREE.RingGeometry(1.6, 2.5, 40),
      new THREE.MeshBasicMaterial({
        color: 0xb8ff3a, transparent: true, opacity: 0.42, side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this.bossOrbitRing.rotation.x = -Math.PI / 2;
    this.bossOrbitRing.position.y = 0.05;
    this.bossOrbitRing.visible = false;
    this.group.add(this.bossOrbitRing);
    this._bossHazG = new THREE.Group();
    this.group.add(this._bossHazG);
    this._bossHazPool = [];
    this.novaAge = -1;

    this.enemyG = new THREE.Group();
    this.bulletG = new THREE.Group();
    this.zoneG = new THREE.Group();
    this.fragG = new THREE.Group();
    this.gemG = new THREE.Group();
    this.orbitG = new THREE.Group();
    this.group.add(this.enemyG, this.bulletG, this.zoneG, this.fragG, this.gemG, this.orbitG);

    this._ePool = [];
    this._bPool = [];
    this._billTex = Object.create(null); // shared letter/weapon textures (canvas per glyph only)
    this._gPool = Object.create(null); // keyed by drop visual
    this._dropLive = [];
    this._dropTrace = 0;
    this._oPool = [];
    this._zoom = 1;
  }

  /** Swap the player frame (home-screen picker + run start). */
  setMech(cfg) {
    const id = typeof cfg === 'string' ? cfg : cfg.id;
    const mech = typeof cfg === 'string' ? (MECH_CACHE[cfg] || MECH_CACHE.horn) : cfg;
    if (this.playerMechId === id && this.player) return;
    if (this.player) { this.group.remove(this.player); disposeTree(this.player); this.player = null; }
    this.player = buildPlayerSprite(mech);
    this.player.visible = this._playerVisible !== false;
    this.playerMechId = id;
    this.playerBody = { material: this.player.userData.hullMats[0] };
    this.playerCore = { material: this.player.userData.coreMats[0] };
    this._facing = Math.PI;
    this.group.add(this.player);
  }

  setVisible(on) { this.group.visible = !!on; }

  /** Menu showcase on/off: hide the in-run mech while the home screen shows its own turntable. */
  setPlayerVisible(on) {
    this._playerVisible = !!on;
    if (this.player) this.player.visible = this._playerVisible;
  }
  setZoom(z) { this._zoom = z; }


  /** Hide gameplay clutter while the select-screen turntable is up. */
  _setMenuPlayfieldHidden(hidden) {
    const on = !hidden;
    if (this.doctor) this.doctor.visible = on;
    if (this.enemyG) this.enemyG.visible = on;
    if (this.bulletG) this.bulletG.visible = on;
    if (this.zoneG) this.zoneG.visible = on;
    if (this.fragG) this.fragG.visible = on;
    if (this.gemG) this.gemG.visible = on;
    if (this.orbitG) this.orbitG.visible = on;
    if (this.novaRing) this.novaRing.visible = on && this.novaAge >= 0;
    // Soft arena chrome stays as stage floor; in-game player is toggled separately.
  }

  _ensureMenuLights(cfg) {
    if (this._menuLights) return;
    const accent = (cfg && cfg.trim) || 0x00e5ff;
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(2.4, 4.2, 3.2);
    key.name = 'menuKey';
    const fill = new THREE.DirectionalLight(0x7ec8ff, 0.45);
    fill.position.set(-2.8, 2.2, -1.4);
    fill.name = 'menuFill';
    const rim = new THREE.DirectionalLight(accent, 0.55);
    rim.position.set(-1.2, 2.8, -3.4);
    rim.name = 'menuRim';
    const amb = new THREE.AmbientLight(0x1a2238, 0.35);
    amb.name = 'menuAmb';
    // Attach to scene group (not spinning wrap) so key/fill/rim stay world-stable.
    this.group.add(key, fill, rim, amb);
    this._menuLights = [key, fill, rim, amb];
  }

  _clearMenuLights() {
    if (!this._menuLights) return;
    for (const L of this._menuLights) {
      this.group.remove(L);
      if (L.dispose) L.dispose();
    }
    this._menuLights = null;
  }

  /**
   * Home-screen showcase: LIVE 3D from buildPlayerMech (same visual identity as bake source).
   * In-game prefers baked sheets from the same buildPlayerMech when present; PNG fallback otherwise.
   */
  setMenuMech(id) {
    this.hideMenuMech();
    const cfg = MECH_CACHE[id] || MECH_CACHE.horn;
    const wrap = new THREE.Group();
    wrap.name = 'menuMechWrap';

    // Pedestal + contact shadow (dark stage, restrained glow)
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.05, 0.12, 48),
      new THREE.MeshStandardMaterial({
        color: 0x0a0e18, emissive: 0x101828, emissiveIntensity: 0.35,
        roughness: 0.55, metalness: 0.45,
      })
    );
    pedestal.position.y = 0.06;
    const pedRing = new THREE.Mesh(
      new THREE.RingGeometry(0.98, 1.12, 48),
      new THREE.MeshBasicMaterial({ color: cfg.trim, transparent: true, opacity: 0.42, side: THREE.DoubleSide })
    );
    pedRing.rotation.x = -Math.PI / 2;
    pedRing.position.y = 0.125;
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.7, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.128;

    const mech = buildPlayerMech(cfg);
    mech.position.set(0, 0.12, 0);
    mech.scale.setScalar((cfg.model || cfg.id) === 'heavy' ? 1.05 : 1.0);
    // Drop the built-in halo — pedestal ring replaces it for select
    if (mech.userData.halo) mech.userData.halo.visible = false;

    wrap.add(pedestal, pedRing, shadow, mech);

    this.menuMechRing = pedRing;
    this.menuMech = wrap;
    this.menuMechModel = mech;
    this._menuYaw = this._menuYaw != null ? this._menuYaw : 0.35;
    this._menuAutoSpin = this._menuAutoSpin !== false;
    this._menuDragUntil = this._menuDragUntil || 0;
    wrap.rotation.y = this._menuYaw;
    this._ensureMenuLights(cfg);
    this._setMenuPlayfieldHidden(true);
    this.group.add(wrap);
    this.group.visible = true;
    // Responsive framing: desktop right-column vs mobile centered safe band.
    const vw = (typeof window !== 'undefined' && window.innerWidth) || (this.stage && this.stage.width) || 1280;
    const vh = (typeof window !== 'undefined' && window.innerHeight) || (this.stage && this.stage.height) || 800;
    this.updateMenuLayout(vw, vh);
    return wrap;
  }

  /**
   * Menu showcase framing for current viewport.
   * Wide desktop: keep right-column turntable (x≈1.15).
   * ≤760px: center mech in the visible band between title and mech cards;
   * also adjusts Y / scale / camera look so head/feet stay on-screen and cards do not cover the body.
   * Call from setMenuMech and on every resize / orientation change.
   */
  updateMenuLayout(viewportWidth, viewportHeight) {
    const wrap = this.menuMech;
    if (!wrap) return;
    const w = viewportWidth > 0 ? viewportWidth
      : ((typeof window !== 'undefined' && window.innerWidth) || (this.stage && this.stage.width) || 1280);
    const h = viewportHeight > 0 ? viewportHeight
      : ((typeof window !== 'undefined' && window.innerHeight) || (this.stage && this.stage.height) || 800);
    // ≤760px width OR short height (phone landscape flipped to wide): mobile framing.
    // Must not keep desktop x=1.15 on a phone held sideways (e.g. 844×390).
    const mobile = w <= 760 || h <= 500;
    const landscape = w > h;

    if (!mobile) {
      // Desktop / tablet landscape wide: open right half beside left-column UI.
      wrap.position.set(1.15, -0.08, 0.45);
      wrap.scale.setScalar(1);
      this._menuCam = { pos: [0.15, 3.15, 5.4], lookAt: [0, 1.15, 0] };
      return;
    }

    // Mobile / narrow: center in safe band between title and mech cards.
    let x = 0.0;
    let y = -0.12;
    let z = 0.55;
    let scale = 0.92;
    let camPos = [0.0, 3.35, 5.55];
    let camLook = [0.0, 1.0, 0.0];

    if (landscape) {
      // Short landscape: shrink so full model fits; keep centered (not desktop x).
      scale = Math.min(0.62, 0.42 + h / 1100);
      y = -0.22;
      z = 0.15;
      camPos = [0.0, 2.7, 4.6];
      camLook = [0.0, 0.8, 0.0];
    } else if (h >= 780) {
      // Tall phone portrait (e.g. 390×844): sit in the void between title/tagline and cards.
      // Raise + slight shrink so torso/legs clear the card stack.
      scale = 0.52;
      y = 1.7;
      z = 0.3;
      camPos = [0.0, 4.2, 5.9];
      camLook = [0.0, 1.95, 0.0];
    } else {
      // Shorter portrait
      scale = 0.48;
      y = 1.4;
      z = 0.25;
      camPos = [0.0, 3.9, 5.6];
      camLook = [0.0, 1.7, 0.0];
    }

    wrap.position.set(x, y, z);
    wrap.scale.setScalar(scale);
    this._menuCam = { pos: camPos, lookAt: camLook };
  }

  /** Apply horizontal yaw from user drag (radians delta). Pauses auto-spin. */
  nudgeMenuYaw(dyaw) {
    this._menuYaw = (this._menuYaw || 0) + dyaw;
    this._menuAutoSpin = false;
    this._menuDragUntil = performance.now() * 0.001 + 2.5;
    if (this.menuMech) this.menuMech.rotation.y = this._menuYaw;
  }

  /** Per-frame menu motion: yaw auto-spin + idle breathe + light rampage seam pulse (horn). */
  updateMenu(t) {
    const wrap = this.menuMech;
    if (!wrap) return;
    if (this._menuDragUntil && t >= this._menuDragUntil) {
      this._menuAutoSpin = true;
      this._menuDragUntil = 0;
    }
    if (this._menuAutoSpin !== false && this._menuLastT != null) {
      const dt = Math.min(0.05, Math.max(0, t - this._menuLastT));
      this._menuYaw = (this._menuYaw || 0) + 0.35 * dt;
    }
    this._menuLastT = t;
    wrap.rotation.y = this._menuYaw || 0;

    const m = this.menuMechModel || wrap;
    const ud = m.userData || {};
    if (ud.body) ud.body.position.y = Math.sin(t * 1.6) * 0.02;
    if (ud.glowL && ud.glowR) {
      const pulse = 1 + Math.sin(t * 2.4) * 0.06;
      ud.glowL.scale.setScalar(pulse);
      ud.glowR.scale.setScalar(pulse);
    }
    // Small menu emissive hook: awaken seams breathe cyan → magenta (full in-game rampage later)
    if (ud.mechId === 'horn' && ud.seamMats) {
      const u = 0.5 + 0.5 * Math.sin(t * 1.2);
      const c = new THREE.Color(0x00e5ff).lerp(new THREE.Color(ud.rampageColor || 0xff2bd6), u * 0.55);
      for (const mat of ud.seamMats) {
        if (mat.color) mat.color.copy(c);
        if (mat.emissive) mat.emissive.copy(c);
      }
    }
    if (this.menuMechRing) this.menuMechRing.material.opacity = 0.32 + Math.sin(t * 1.8) * 0.1;
  }

  hideMenuMech() {
    if (!this.menuMech) {
      this._setMenuPlayfieldHidden(false);
      return;
    }
    this.group.remove(this.menuMech);
    disposeTree(this.menuMech);
    this.menuMech = null;
    this.menuMechModel = null;
    this.menuMechRing = null;
    this._clearMenuLights();
    this._setMenuPlayfieldHidden(false);
  }

  _take(pool, parent, make) {
    let m = pool.pop();
    if (!m) m = make();
    if (m.parent !== parent) parent.add(m);
    m.visible = true;
    return m;
  }
  _recycle(pool, parent) {
    while (parent.children.length) {
      const c = parent.children[parent.children.length - 1];
      parent.remove(c);
      c.visible = false;
      pool.push(c);
    }
  }

  burstGore(x, z, colorHex = 0x8a93a8) {
    spawnFragments(this.fragG, x, z, colorHex, 10);
  }

  pulseNova(r) {
    this.novaRing.scale.setScalar(1);
    this.novaRing.material.opacity = 0.85;
    this.novaRing.visible = true;
    this.novaAge = 0;
    this._novaR = r;
  }

  _setEmissive(mats, flash) { for (const m of mats) m.emissiveIntensity = flash; }

  /**
   * Swap edge décor when mapZone changes across five escape zones.
   * Floor / arena size unchanged; only edge props + quiet ring tint.
   */
  setMapZone(zone) {
    const z = zone === 'rooftop' ? 'rooftop'
      : zone === 'blockade' ? 'blockade'
        : zone === 'reactor' ? 'reactor'
          : zone === 'assembly' ? 'assembly'
            : 'lab';
    if (this.mapZone === z && this.edgeDecor) return;
    this.mapZone = z;
    if (this.edgeDecor) {
      this.group.remove(this.edgeDecor);
      disposeTree(this.edgeDecor);
      this.edgeDecor = null;
    }
    this.edgeDecor = buildEdgeDecor(z);
    this.group.add(this.edgeDecor);
    // Quiet ring tint: teal / amber / violet / olive / night-blue. Low opacity — no danger steal.
    const soft = z === 'rooftop' ? 0x3a6ad8
      : z === 'blockade' ? 0x5a6a40
        : z === 'reactor' ? 0x6a38c8
          : z === 'assembly' ? 0xb86a28
            : 0x1a6a78;
    const hard = z === 'rooftop' ? 0x4a5a78
      : z === 'blockade' ? 0x4a5558
        : z === 'reactor' ? 0x3a5080
          : z === 'assembly' ? 0x8a6040
            : 0x3a6068;
    if (this.softRing && this.softRing.material) this.softRing.material.color.setHex(soft);
    if (this.hardRing && this.hardRing.material) this.hardRing.material.color.setHex(hard);
    if (this.padRing && this.padRing.material) this.padRing.material.color.setHex(soft);
  }

  sync(game, dt = 0.016) {
    if (game && game.mapZone && game.mapZone !== this.mapZone) this.setMapZone(game.mapZone);
    this.setMech(game.mech || 'horn');
    this.player.position.set(game.px, 0, game.pz);

    let tx = game.vx, tz = game.vz;
    if (Math.hypot(tx, tz) < 0.08 && game.enemies.length) {
      const e = game.enemies.reduce((best, cur) => {
        const d = Math.hypot(cur.x - game.px, cur.z - game.pz);
        return !best || d < best.d ? { d, e: cur } : best;
      }, null);
      if (e) { tx = e.e.x - game.px; tz = e.e.z - game.pz; }
    }
    if (Math.hypot(tx, tz) > 0.08) {
      const want = Math.atan2(tx, tz) + Math.PI;
      let d = want - this._facing;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this._facing += d * 0.22;
    }
    const move = Math.hypot(game.vx, game.vz);
    const blink = game.invuln > 0 && (game.invuln * 20) % 2 < 1;
    const hit = game.hitFlash > 0;
    const fireKick = Math.max(0, game.muzzle || 0);
    const ud = this.player.userData;

    if (ud.isSprite) {
      this.player.rotation.set(0, 0, 0);
      const aiming = (game.aimHold || 0) > 0 || fireKick > 0.02;
      const locomotion = move > 0.12 ? 'move' : 'idle';
      const weapon = aiming ? (fireKick > 0.02 ? 'fire' : 'aim') : 'idle';
      // Primary visual aim only (mg/laser) — secondaries must not flip body.
      const vax = game.visualAimX != null ? game.visualAimX : game.aimX;
      const vaz = game.visualAimZ != null ? game.visualAimZ : game.aimZ;
      if (aiming && (Math.abs(vax || 0) + Math.abs(vaz || 0)) > 0.05) {
        const want = Math.atan2(vax, vaz) + Math.PI;
        let dd = want - this._facing;
        while (dd > Math.PI) dd -= Math.PI * 2;
        while (dd < -Math.PI) dd += Math.PI * 2;
        this._facing += dd * 0.32;
      }
      ud.locomotion = locomotion;
      ud.weaponState = weapon;

      if (ud.baked) {
        // Layered bake from buildPlayerMech: legs=move, gun=visualAim, hurt=tint only, no bob.
        syncBakedPlayerSprite(this.player, {
          moveX: game.vx,
          moveZ: game.vz,
          moving: move > 0.08,
          aimX: vax,
          aimZ: vaz,
          aiming,
          hit,
          blink,
          alive: !!game.alive,
          dt,
          camera: this.stage.camera,
        });
      } else {
        // Legacy whole-body PNG fallback
        let pose = 'idle';
        if (!game.alive) pose = 'hit';
        else if (locomotion === 'move') pose = 'move';
        else if (weapon === 'aim' || weapon === 'fire') pose = 'attack';
        if (ud.playerMaps) {
          let map = ud.playerMaps[pose] || ud.playerMaps.idle;
          if (pose === 'move' && ud.walkFrames && ud.walkFrames.length >= 2) {
            const fi = (Math.floor((ud.animPhase || 0) / Math.PI) & 1);
            map = ud.walkFrames[fi];
            ud.walkFrame = fi;
          }
          if (map && (ud.playerState !== pose || ud.walkFrame !== (ud._lastWalkFrame) || ud.spriteMat.map !== map)) {
            ud.spriteMat.map = map;
            ud.spriteMat.needsUpdate = true;
            ud.playerState = pose;
            ud._lastWalkFrame = ud.walkFrame;
          }
        }
        const dtp = Math.max(0.001, Math.min(0.05, dt));
        if (move > 0.08) ud.animPhase = (ud.animPhase || 0) + Math.max(0.35, move) * 8.2 * dtp;
        else if (aiming) ud.animPhase = (ud.animPhase || 0) + 0.55 * dtp;
        else ud.animPhase = (ud.animPhase || 0) * 0.9 + (game.t || 0) * 0.02;
        applySpriteMotion(this.player, {
          moving: move > 0.08,
          velX: game.vx,
          aimX: vax,
          flipFromAim: aiming,
          phase: ud.animPhase || 0,
          phaseOffset: 0,
          strength: (aiming && move <= 0.08) ? 0.35 : 0.5,
          camera: this.stage.camera,
          facingYaw: this._facing,
          style: move > 0.08 ? 'ground' : 'idle',
        });
        applySpriteFlash(this.player, { blink, hit, move });
      }
    } else {
      this.player.rotation.y = this._facing;
      const bank = THREE.MathUtils.clamp(-game.vx * 0.25, -0.2, 0.2);
      this.player.rotation.z += (bank - this.player.rotation.z) * 0.15;
      this.player.rotation.x = move > 0.1 ? -0.05 : 0;
      const hullE = blink ? 0.1 : (hit ? 1.6 : 0.85);
      const coreE = blink ? 0.2 : (hit ? 2.2 : 1.25);
      const thrE = blink ? 0.2 : (hit ? 2 : (1.1 + move * 0.4));
      this._setEmissive(ud.hullMats, hullE);
      this._setEmissive(ud.coreMats, coreE);
      this._setEmissive(ud.thrusterMats, thrE);
      if (this.playerBody) this.playerBody.material.emissiveIntensity = hullE;
      if (this.playerCore) this.playerCore.material.emissiveIntensity = coreE;
      const halo = ud.halo;
      if (halo) halo.material.opacity = 0.24 + move * 0.1;
      ud.idlePhase = (game.t || 0) * 2.4;
      if (move > 0.08) ud.animPhase = (ud.animPhase || 0) + Math.max(0.35, move) * 5.5 * Math.max(0.001, Math.min(0.05, dt));
      else ud.animPhase = (ud.animPhase || 0) * 0.92;
      const walk = ud.animPhase || 0;
      const swing = Math.sin(walk) * Math.min(1, move * 1.4);
      const swingOpp = Math.sin(walk + Math.PI) * Math.min(1, move * 1.4);
      if (ud.legs && ud.legs.length === 2) { ud.legs[0].rotation.x = swing * 0.55; ud.legs[1].rotation.x = swingOpp * 0.55; }
      if (ud.shins && ud.shins.length === 2) { ud.shins[0].rotation.x = Math.max(0, -swing) * 0.35; ud.shins[1].rotation.x = Math.max(0, -swingOpp) * 0.35; }
      if (ud.foots && ud.foots.length === 2) { ud.foots[0].rotation.x = swing * 0.25; ud.foots[1].rotation.x = swingOpp * 0.25; }
      const hurtKick = Math.max(0, game.hitFlash || 0);
      if (ud.arms && ud.arms.length === 2) {
        ud.arms[0].rotation.x = swingOpp * 0.4 - fireKick * 1.1 - hurtKick * 0.5;
        ud.arms[1].rotation.x = swing * 0.4 - fireKick * 0.85 - hurtKick * 0.35;
      }
      if (ud.fists) for (const f of ud.fists) f.scale.setScalar(1 + fireKick * 0.35);
      if (ud.head) {
        ud.head.rotation.x = -fireKick * 0.12 + Math.sin(ud.idlePhase) * 0.03;
        ud.head.position.y = 1.24 + Math.sin(ud.idlePhase * 0.5) * 0.015;
      }
      if (ud.body) {
        const bob = move > 0.08 ? Math.abs(Math.sin(walk)) * 0.06 : Math.sin(ud.idlePhase) * 0.025;
        ud.body.position.y = bob;
        ud.body.rotation.x = move > 0.08 ? -0.04 : Math.sin(ud.idlePhase * 0.7) * 0.02;
      }
      if (ud.glowL && ud.glowR) {
        const pulse = 1 + move * 0.35 + fireKick * 1.2 + Math.sin(ud.idlePhase * 2) * 0.08;
        ud.glowL.scale.setScalar(pulse);
        ud.glowR.scale.setScalar(pulse);
      }
    }

    if (this.novaAge >= 0) {
      this.novaAge += 0.05;
      const k = Math.min(1, this.novaAge);
      this.novaRing.position.set(game.px, 0.08, game.pz);
      this.novaRing.scale.setScalar(1 + k * (this._novaR || 2) * 4);
      this.novaRing.material.opacity = 0.85 * (1 - k);
      if (k >= 1) { this.novaAge = -1; this.novaRing.visible = false; }
    }

    // ---- enemies (Phase 3 lab = procedural meshes; others = PNG billboards)
    this._recycle(this._ePool, this.enemyG);
    for (const e of game.enemies) {
      const m = this._take(this._ePool, this.enemyG, () => enemyMeshFor(e.type));
      const wantProc = (e.type === 'staffer' || e.type === 'guard' || e.type === 'sniper' || e.type === 'shield' || e.type === 'artillery' || e.type === 'bomber' || e.type === 'flanker' || e.type === 'medic' || e.type === 'jammer' || e.type === 'drone' || e.type === 'sentinel' || e.type === 'hunter' || e.type === 'commander' || e.type === 'swarm_core');
      const haveProc = !m.userData.isSprite;
      if (m.userData.type !== e.type || wantProc !== haveProc) {
        // Never retarget a PNG sprite into a procedural lab type (or the reverse) —
        // that left staffer/guard sharing enemy_lime silhouettes.
        while (m.children.length) m.remove(m.children[0]);
        const fresh = enemyMeshFor(e.type);
        while (fresh.children.length) m.add(fresh.children[0]);
        // Preserve Group identity for pooling; copy mesh userData from fresh build.
        const ud = { ...fresh.userData, type: e.type };
        m.userData = ud;
        // Sprite flag must match the fresh mesh family
        if (fresh.userData.isSprite) m.userData.isSprite = true;
        else delete m.userData.isSprite;
      }
      const faceYaw = (e.faceDx != null && e.faceDz != null && (e.shieldGuard || e.type === 'shield' || e.artillery || e.type === 'artillery' || e.bomber || e.type === 'bomber' || e.flanker || e.type === 'flanker' || e.medic || e.type === 'medic' || e.jammer || e.type === 'jammer'))
        ? Math.atan2(e.faceDx, e.faceDz)
        : ((e.sniperPhase === 'aim' && (e.aimDx != null))
          ? Math.atan2(e.aimDx, e.aimDz)
          : Math.atan2(game.px - e.x, game.pz - e.z));
      const spd = Math.hypot(e.vx || 0, e.vz || 0);
      const moving = spd > 0.12;
      const isFlyer = !!(m.userData.flyer || m.userData.bob || e.type === 'drone');
      let y = m.userData.baseY || 0;
      if (isFlyer) y = 0.55 + Math.sin(game.t * 4.2 + e.wob) * 0.1;
      m.position.set(e.x, y, e.z);
      if (m.userData.isSprite) {
        m.rotation.set(0, 0, 0);
        applySpriteMotion(m, {
          moving,
          velX: e.vx || 0,
          phase: e.animPhase || 0,
          phaseOffset: e.wob || 0,
          strength: isFlyer ? 0.55 : 0.7,
          camera: this.stage.camera,
          facingYaw: faceYaw,
          style: isFlyer ? 'fly' : (moving ? 'ground' : 'idle'),
        });
        applySpriteFlash(m, { hit: e.hit > 0, blink: false, move: spd });
        if (e.slow > 0 && m.userData.spriteMat) m.userData.spriteMat.color.setRGB(0.65, 0.85, 1.2);
        // Foot-plant dust (ground) / jet exhaust (flyers)
        if (moving) this._enemyMotionFx(e, m, isFlyer, game);
      } else {
        m.rotation.y = faceYaw;
        const glow = e.hit > 0 ? 1.5 : (e.slow > 0 ? 0.45 : 0.7);
        const legSwing = Math.sin((e.animPhase || game.t) * 2.4 + e.wob) * 0.5;
        const legs = m.userData.legs || [];
        if (legs.length) { legs[0].rotation.x = legSwing; if (legs[1]) legs[1].rotation.x = -legSwing; }
        m.traverse((ch) => {
          if (ch.isMesh && ch.material && ch.material.emissive) ch.material.emissiveIntensity = glow;
        });
        // Elite ring collapse during telegraph
        if (m.userData.eliteRing) {
          const ring = m.userData.eliteRing;
          if (e.phase === 'telegraph') {
            const u = Math.max(0, Math.min(1, 1 - (e.phaseT || 0) / Math.max(0.01, e.telegraphDur || 1.2)));
            ring.scale.setScalar(1 - u * 0.45);
            if (ring.material) ring.material.opacity = 0.55 + u * 0.4;
          } else if (e.phase === 'charge') {
            ring.scale.setScalar(1.25);
            if (ring.material) ring.material.opacity = 1;
          } else {
            ring.scale.setScalar(1);
            if (ring.material) ring.material.opacity = 0.85;
          }
        }
        // Boss: rotate pod ring; detach pods as HP drops
        if (m.userData.boss && m.userData.podRing) {
          m.userData.podRing.rotation.y = e.ringAng || game.t * 0.55;
          const pods = m.userData.pods || [];
          const alive = e.podsAlive != null ? e.podsAlive : pods.length;
          for (let pi = 0; pi < pods.length; pi++) {
            pods[pi].visible = pi < alive;
          }
          if (m.userData.coreGlow && m.userData.coreGlow.material) {
            const pulse = e.bossSub === 'telegraph' ? 1.0 : 0.7;
            m.userData.coreGlow.material.opacity = pulse;
          }
          // Hover bob
          m.position.y = (m.userData.baseY || 0.15) + 0.2 + Math.sin(game.t * 2.2 + e.wob) * 0.08;
        }
      }
    }

    // Phase 3 telegraph lane: one elite max
    this._syncWarnLane(game);
    this._syncSniperAim(game);
    this._syncShieldBash(game);
    this._syncArtilleryBlast(game);
    this._syncBomberBlast(game);
    this._syncFlankerDash(game);
    this._syncMedicHeal(game);
    this._syncJammerJam(game);
    this._syncDangerPulses(game);
    this._syncZonePressure(game);
    this._syncCommanderSummon(game);
    this._syncBossHazards(game);

    // Doctor NPC prop: face camera, idle sway
    if (this.doctor && this.doctor.userData.isSprite) {
      const d = this.doctor;
      d.userData.idlePhase = (d.userData.idlePhase || 0) + 0.045;
      applySpriteMotion(d, {
        moving: false,
        velX: 0,
        phase: d.userData.idlePhase,
        phaseOffset: 0.35,
        strength: 0.7,
        camera: this.stage.camera,
        facingYaw: Math.atan2(game.px - d.position.x, game.pz - d.position.z),
        style: 'idle',
      });
    }
    this._tickMotionFx(game);

    // ---- bullets (velocity-aligned — streaks fly toward aim, not out of the torso)
    recycleBullets(this.bulletG);
    for (const b of game.bullets) {
      const weapon = b.weapon || 'mg';
      const tier = b.tier || 0;
      const m = bulletMesh(weapon, tier);
      m.userData.key = weapon + ':' + tier;
      if (m.parent !== this.bulletG) this.bulletG.add(m);
      const spec = WEAPON_SHOT[weapon] || WEAPON_SHOT.mg;
      const size = (spec.size || 1) * (tier >= 2 ? 1.25 : tier >= 1 ? 1.12 : 1);
      const by = b.y != null ? b.y : 0.95;
      m.position.set(b.x, by, b.z);
      orientProjectile(m, b, this.stage.camera);
      if (m.userData.shot === 'line') m.scale.set(size * 0.7, size * 1.55, size * 0.7);
      else if (m.userData.shot === 'laser') m.scale.set(size * 1.4, size * 0.85, size);
      else m.scale.setScalar(size);
    }

    // ---- plasma puddles
    while (this.zoneG.children.length) this.zoneG.remove(this.zoneG.children[0]);
    for (const z of (game.zones || [])) {
      const ring = new THREE.Mesh(
        new THREE.CircleGeometry(z.r, 20),
        new THREE.MeshBasicMaterial({
          color: z.kind === 'plasma' ? 0xb8ff3a : 0x00e5ff,
          transparent: true, opacity: 0.22 + 0.15 * Math.min(1, z.life), depthWrite: false, fog: false,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(z.x, 0.04, z.z);
      this.zoneG.add(ring);
    }

    // ---- flying fragments
    for (let i = this.fragG.children.length - 1; i >= 0; i--) {
      const f = this.fragG.children[i];
      const udf = f.userData;
      udf.life -= 0.016;
      udf.vy -= 18 * 0.016;
      f.position.x += udf.vx * 0.016;
      f.position.y += udf.vy * 0.016;
      f.position.z += udf.vz * 0.016;
      f.rotation.z += udf.spin * 0.016;
      f.quaternion.copy(this.stage.camera.quaternion);
      if (f.position.y < 0.05) { f.position.y = 0.05; udf.vy *= -0.3; udf.vx *= 0.7; udf.vz *= 0.7; }
      if (udf.life <= 0) {
        this.fragG.remove(f);
        f.visible = false;
        FRAG_POOL.push(f);
      }
    }

    // ---- drops: one solid cube with an icon face per pickup (X / H / weapon emblem)
    for (const g of game.gems) {
      const key = (g.kind || 'xp') + ':' + (g.kind === 'weapon' ? (g.weapon || 'dmg') : '');
      const make = () => dropMesh(g);
      if (!this._gPool[key]) this._gPool[key] = [];
      const bucket = this._gPool[key];
      let slot = bucket.length ? bucket.pop() : null;
      if (!slot || !slot.userData || !slot.userData.cube) slot = make();
      slot.userData.poolKey = key;
      if (slot.parent !== this.gemG) this.gemG.add(slot);
      slot.visible = true;
      const tex = dropTexture(g.kind, g.weapon);
      const face = slot.userData.face;
      if (face && face.material.map !== tex) {
        face.material.map = tex;
        face.material.needsUpdate = true;
      }
      const pop = g.pop > 0 ? 1 + g.pop * 0.9 : 1;
      slot.position.set(g.x, 0.02, g.z);
      // Geometry already encodes size hierarchy; keep mild pop only
      slot.scale.setScalar(pop * 1.05 * 0.7);
      const board = slot.userData.cube;
      if (board) {
        const baseY = slot.userData.hoverY != null ? slot.userData.hoverY : 0.85;
        const bob = g.kind === 'magnet' ? 0.04 : 0.06;
        board.position.y = baseY + Math.sin(game.t * 2.4 + g.x) * bob;
        board.quaternion.copy(this.stage.camera.quaternion);
      }
      if (face && face !== board) face.quaternion.copy(this.stage.camera.quaternion);
    }
    // sweep: unclaimed slots from LAST frame go back to the pool (never sweep live ones)
    for (const c of this._dropLive) {
      this.gemG.remove(c);
      c.visible = false;
      const key = c.userData.poolKey || 'xp:';
      if (!this._gPool[key]) this._gPool[key] = [];
      this._gPool[key].push(c);
    }
    this._dropLive.length = 0;
    for (const c of this.gemG.children) this._dropLive.push(c);

    // ---- orbit blades
    this._recycle(this._oPool, this.orbitG);
    if (game.orbits > 0) {
      const R = 1.4;
      for (let o = 0; o < game.orbits; o++) {
        const ang = game.t * 3.2 + (o / game.orbits) * Math.PI * 2;
        const m = this._take(this._oPool, this.orbitG, () => new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.5), mat(0xffe600, 1.2)));
        m.position.set(game.px + Math.cos(ang) * R, 0.7, game.pz + Math.sin(ang) * R);
        m.rotation.y = -ang;
      }
    }
  }


  /** Foot-plant dust / jet thrust markers for enemy motion feel. */
  _enemyMotionFx(e, m, isFlyer, game) {
    if (!this._fxDust) this._fxDust = [];
    if (isFlyer) {
      // Jet exhaust puff behind flyer
      if ((e._jetT || 0) <= 0) {
        e._jetT = 0.05;
        const spd = Math.hypot(e.vx || 0, e.vz || 0) || 1;
        const bx = e.x - (e.vx || 0) / spd * 0.35;
        const bz = e.z - (e.vz || 0) / spd * 0.35;
        this._fxDust.push({
          x: bx, z: bz, y: (m.position.y || 0.6) - 0.05,
          life: 0.28, max: 0.28, r: 0.12, kind: 'jet',
          color: 0xff8a1a,
        });
      } else e._jetT -= 0.016;
    } else if (m.userData.footPlant && !e._planted) {
      e._planted = true;
      // v0.8.4: subtler foot dust (was large every plant → read as sparks)
      if (Math.random() < 0.35) {
        this._fxDust.push({
          x: e.x, z: e.z, y: 0.04, life: 0.14, max: 0.14, r: 0.14, kind: 'dust', color: 0x3a4552,
        });
      }
    } else if (!m.userData.footPlant) {
      e._planted = false;
    }
  }

  _tickMotionFx(game) {
    if (!this._fxDust) return;
    if (!this._dustG) {
      this._dustG = new THREE.Group();
      this.group.add(this._dustG);
    }
    while (this._dustG.children.length) this._dustG.remove(this._dustG.children[0]);
    for (let i = this._fxDust.length - 1; i >= 0; i--) {
      const d = this._fxDust[i];
      d.life -= 0.016;
      if (d.life <= 0) { this._fxDust.splice(i, 1); continue; }
      const k = d.life / d.max;
      if (d.kind === 'jet') {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(d.r * (1.2 - k * 0.5), 6, 6),
          new THREE.MeshBasicMaterial({
            color: d.color, transparent: true, opacity: 0.55 * k, depthWrite: false, fog: false,
          })
        );
        m.position.set(d.x, d.y + (1 - k) * 0.15, d.z);
        this._dustG.add(m);
      } else {
        const m = new THREE.Mesh(
          new THREE.CircleGeometry(d.r * (1.4 - k * 0.4), 12),
          new THREE.MeshBasicMaterial({
            color: d.color, transparent: true, opacity: 0.35 * k, depthWrite: false, fog: false, side: THREE.DoubleSide,
          })
        );
        m.rotation.x = -Math.PI / 2;
        m.position.set(d.x, 0.05, d.z);
        this._dustG.add(m);
      }
    }
  }

  /** Draw thin red aim lines for snipers in telegraph (danger red). */
  _syncSniperAim(game) {
    const lines = this.sniperAimLines || [];
    for (const ln of lines) ln.visible = false;
    let li = 0;
    for (const e of game.enemies) {
      if (!(e.sniper || e.kind === 'sniper' || e.type === 'sniper')) continue;
      if (e.sniperPhase !== 'aim') continue;
      if (li >= lines.length) break;
      const ln = lines[li++];
      const ax = e.aimDx != null ? e.aimDx : (game.px - e.x);
      const az = e.aimDz != null ? e.aimDz : (game.pz - e.z);
      const len = Math.hypot(ax, az) || 1;
      const ndx = ax / len, ndz = az / len;
      const dist = Math.min(16, Math.max(4, Math.hypot(game.px - e.x, game.pz - e.z) + 1.5));
      const u = Math.max(0, Math.min(1, 1 - (e.sniperPhaseT || 0) / Math.max(0.01, e.telegraphDur || 1)));
      const yaw = Math.atan2(ndx, ndz);
      const mx = e.x + ndx * dist * 0.5;
      const mz = e.z + ndz * dist * 0.5;
      ln.visible = true;
      ln.position.set(mx, 0, mz);
      ln.rotation.y = yaw;
      const quad = ln.userData.quad;
      const mat = ln.userData.mat;
      if (quad) quad.scale.set(0.12 + u * 0.1, dist, 1); // thin red beam
      if (mat) mat.opacity = 0.45 + u * 0.5;
    }
  }


  /** Short red bash wedges for shield guards in telegraph (contact red). */
  _syncShieldBash(game) {
    const lanes = this.shieldBashLanes || [];
    for (const ln of lanes) ln.visible = false;
    let li = 0;
    for (const e of game.enemies) {
      if (!(e.shieldGuard || e.kind === 'shield' || e.type === 'shield')) continue;
      if (e.shieldPhase !== 'telegraph') continue;
      if (li >= lanes.length) break;
      const ln = lanes[li++];
      const ax = e.aimDx != null ? e.aimDx : (e.faceDx != null ? e.faceDx : (game.px - e.x));
      const az = e.aimDz != null ? e.aimDz : (e.faceDz != null ? e.faceDz : (game.pz - e.z));
      const len = Math.hypot(ax, az) || 1;
      const ndx = ax / len, ndz = az / len;
      const dist = 1.8;
      const u = Math.max(0, Math.min(1, 1 - (e.shieldPhaseT || 0) / Math.max(0.01, e.telegraphDur || 0.65)));
      const yaw = Math.atan2(ndx, ndz);
      const mx = e.x + ndx * dist * 0.55;
      const mz = e.z + ndz * dist * 0.55;
      ln.visible = true;
      ln.position.set(mx, 0, mz);
      ln.rotation.y = yaw;
      const quad = ln.userData.quad;
      const mat = ln.userData.mat;
      if (quad) quad.scale.set(0.7 + u * 0.35, dist, 1);
      if (mat) mat.opacity = 0.4 + u * 0.5;
    }
  }


  /** Orange blast rings for artillery in telegraph (orange = AoE blast radius). */
  _syncArtilleryBlast(game) {
    const rings = this.artilleryBlastRings || [];
    for (const ln of rings) ln.visible = false;
    let li = 0;
    for (const e of game.enemies) {
      if (!(e.artillery || e.kind === 'artillery' || e.type === 'artillery')) continue;
      if (e.artilleryPhase !== 'telegraph') continue;
      if (li >= rings.length) break;
      const ln = rings[li++];
      const ax = e.aimX != null ? e.aimX : game.px;
      const az = e.aimZ != null ? e.aimZ : game.pz;
      const r = (e.blastRadius != null ? e.blastRadius : (ARTILLERY.blastRadius || 2.4));
      const u = Math.max(0, Math.min(1, 1 - (e.artilleryPhaseT || 0) / Math.max(0.01, e.telegraphDur || 1)));
      ln.visible = true;
      ln.position.set(ax, 0, az);
      ln.scale.setScalar(r);
      const mat = ln.userData.mat;
      const fillMat = ln.userData.fillMat;
      if (mat) mat.opacity = 0.35 + u * 0.45;
      if (fillMat) fillMat.opacity = 0.12 + u * 0.22;
    }
  }


  /** Red blast rings under bombers in telegraph (danger red = must-dodge self-AoE). */
  _syncBomberBlast(game) {
    const rings = this.bomberBlastRings || [];
    for (const ln of rings) ln.visible = false;
    let li = 0;
    for (const e of game.enemies) {
      if (!(e.bomber || e.kind === 'bomber' || e.type === 'bomber')) continue;
      if (e.bomberPhase !== 'telegraph') continue;
      if (li >= rings.length) break;
      const ln = rings[li++];
      const ax = e.x;
      const az = e.z;
      const r = (e.blastRadius != null ? e.blastRadius : (BOMBER.blastRadius || 2.2));
      const u = Math.max(0, Math.min(1, 1 - (e.bomberPhaseT || 0) / Math.max(0.01, e.telegraphDur || 1)));
      ln.visible = true;
      ln.position.set(ax, 0, az);
      ln.scale.setScalar(r);
      const mat = ln.userData.mat;
      const fillMat = ln.userData.fillMat;
      if (mat) mat.opacity = 0.4 + u * 0.5;
      if (fillMat) fillMat.opacity = 0.14 + u * 0.28;
      // Pulse blinker feel on charge pack via subtle scale breath
      const pulse = 1 + Math.sin((game.t || 0) * 18) * 0.03 * u;
      ln.scale.setScalar(r * pulse);
    }
  }



  /** Cyan dash wedges for flankers in telegraph (cyan = dash lane toward player). */
  _syncFlankerDash(game) {
    const lanes = this.flankerDashLanes || [];
    for (const ln of lanes) ln.visible = false;
    let li = 0;
    for (const e of game.enemies) {
      if (!(e.flanker || e.kind === 'flanker' || e.type === 'flanker')) continue;
      if (e.flankerPhase !== 'telegraph') continue;
      if (li >= lanes.length) break;
      const ln = lanes[li++];
      const ax = e.aimDx != null ? e.aimDx : (game.px - e.x);
      const az = e.aimDz != null ? e.aimDz : (game.pz - e.z);
      const len = Math.hypot(ax, az) || 1;
      const ndx = ax / len, ndz = az / len;
      const dist = Math.min(8.5, Math.max(3.5, Math.hypot(game.px - e.x, game.pz - e.z) + 0.8));
      const u = Math.max(0, Math.min(1, 1 - (e.flankerPhaseT || 0) / Math.max(0.01, e.telegraphDur || 0.9)));
      const yaw = Math.atan2(ndx, ndz);
      const mx = e.x + ndx * dist * 0.5;
      const mz = e.z + ndz * dist * 0.5;
      ln.visible = true;
      ln.position.set(mx, 0, mz);
      ln.rotation.y = yaw;
      const quad = ln.userData.quad;
      const mat = ln.userData.mat;
      if (quad) quad.scale.set(0.55 + u * 0.45, dist, 1);
      if (mat) mat.opacity = 0.4 + u * 0.5;
    }
  }

  /** Arena periodic danger-pulse red rings (PHASE6-PERIODIC-DANGER-001; ≠ bomber enemy fuse). */
  _syncDangerPulses(game) {
    const rings = this.dangerPulseRings || [];
    for (const ln of rings) ln.visible = false;
    const pulses = game.dangerPulses || [];
    let li = 0;
    for (const p of pulses) {
      if (!p || p.phase !== 'telegraph') continue;
      if (li >= rings.length) break;
      const ln = rings[li++];
      const r = (p.radius != null ? p.radius : (DANGER_PULSE.radius || 2.4));
      const u = Math.max(0, Math.min(1, 1 - (p.phaseT || 0) / Math.max(0.01, p.telegraphDur || 1)));
      ln.visible = true;
      ln.position.set(p.x, 0, p.z);
      // Slightly slower pulse than bomber so arena strike reads as map hazard
      const pulse = 1 + Math.sin((game.t || 0) * 12) * 0.04 * u;
      ln.scale.setScalar(r * pulse);
      const mat = ln.userData.mat;
      const fillMat = ln.userData.fillMat;
      if (mat) mat.opacity = 0.42 + u * 0.48;
      if (fillMat) fillMat.opacity = 0.15 + u * 0.26;
    }
  }

  /** Lime heal auras for medics in telegraph (lime = heal pulse radius). */
  _syncMedicHeal(game) {
    const auras = this.medicHealAuras || [];
    for (const a of auras) a.visible = false;
    let ai = 0;
    for (const e of game.enemies) {
      if (!(e.medic || e.kind === 'medic' || e.type === 'medic')) continue;
      if (e.medicPhase !== 'telegraph' && e.medicPhase !== 'heal') continue;
      if (ai >= auras.length) break;
      const aura = auras[ai++];
      const r = (typeof MEDIC !== 'undefined' && MEDIC.healRadius) ? MEDIC.healRadius : (e.healRadius || 4.2);
      const u = Math.max(0, Math.min(1, 1 - (e.medicPhaseT || 0) / Math.max(0.01, e.telegraphDur || 0.75)));
      aura.visible = true;
      aura.position.set(e.x, 0, e.z);
      const pulse = 1 + Math.sin((game.t || 0) * 14) * 0.05 * (0.4 + u * 0.6);
      const baseR = aura.userData.baseR || r;
      aura.scale.setScalar((r / baseR) * pulse);
      const mat = aura.userData.mat;
      const fillMat = aura.userData.fillMat;
      if (mat) mat.opacity = 0.35 + u * 0.45;
      if (fillMat) fillMat.opacity = 0.12 + u * 0.22;
    }
  }

  /** Violet jam rings for jammers in telegraph (violet = fire-rate jam). */
  _syncJammerJam(game) {
    const auras = this.jammerJamAuras || [];
    for (const a of auras) a.visible = false;
    let ai = 0;
    for (const e of game.enemies) {
      if (!(e.jammer || e.kind === 'jammer' || e.type === 'jammer')) continue;
      if (e.jammerPhase !== 'telegraph' && e.jammerPhase !== 'pulse') continue;
      if (ai >= auras.length) break;
      const aura = auras[ai++];
      const u = Math.max(0, Math.min(1, 1 - (e.jammerPhaseT || 0) / Math.max(0.01, e.telegraphDur || 0.9)));
      aura.visible = true;
      aura.position.set(e.x, 0, e.z);
      const pulse = 1 + Math.sin((game.t || 0) * 16) * 0.06 * (0.35 + u * 0.65);
      aura.scale.setScalar(pulse);
      const mat = aura.userData.mat;
      const fillMat = aura.userData.fillMat;
      const innerMat = aura.userData.innerMat;
      if (mat) mat.opacity = 0.38 + u * 0.45;
      if (fillMat) fillMat.opacity = 0.1 + u * 0.2;
      if (innerMat) innerMat.opacity = 0.35 + u * 0.4;
    }
  }


  /** Cyan/acid shrinking safe-edge (PHASE6-ZONE-PRESSURE-001; persistent boundary ≠ red pulse). */
  _syncZonePressure(game) {
    const edge = this.zonePressureEdge;
    if (!edge) return;
    const active = !!(game && game.zonePressureActive);
    if (!active) {
      edge.visible = false;
      return;
    }
    const r = Math.max(1, game.safeR != null ? game.safeR : (ZONE_PRESSURE.startR || 30));
    edge.visible = true;
    edge.position.set(0, 0, 0);
    edge.scale.setScalar(r);
    // Mild breath so edge stays readable without bloom wash
    const pulse = 1 + Math.sin((game.t || 0) * 2.4) * 0.008;
    edge.scale.setScalar(r * pulse);
    const mat = edge.userData.mat;
    const washMat = edge.userData.washMat;
    const outside = Math.hypot(game.px || 0, game.pz || 0) > r;
    if (mat) mat.opacity = outside ? 0.88 : 0.62;
    if (washMat) washMat.opacity = outside ? 0.12 : 0.055;
  }

  /** Orange/red drop marks while commander is in summon telegraph. */
  _syncCommanderSummon(game) {
    const rings = this.commanderSummonRings || [];
    for (const ln of rings) ln.visible = false;
    let li = 0;
    for (const e of game.enemies) {
      if (e.type !== 'commander' || e.phase !== 'telegraph_summon') continue;
      const marks = e.summonMarks || [];
      const u = Math.max(0, Math.min(1, 1 - (e.phaseT || 0) / Math.max(0.01, e.telegraphDur || 1)));
      for (const m of marks) {
        if (li >= rings.length) break;
        const ln = rings[li++];
        ln.visible = true;
        ln.position.set(m.x, 0, m.z);
        const pulse = 0.85 + u * 0.35 + Math.sin((game.t || 0) * 10 + li) * 0.05;
        ln.scale.setScalar(pulse);
        const mat = ln.userData.mat;
        const fillMat = ln.userData.fillMat;
        if (mat) mat.opacity = 0.4 + u * 0.45;
        if (fillMat) fillMat.opacity = 0.12 + u * 0.25;
      }
    }
  }

  /** Draw ground warning strip from elite → locked charge aim while telegraphing. */
  _syncWarnLane(game) {
    const lane = this.warnLane;
    const lane2 = this.warnLane2;
    if (!lane) return;
    let elite = null;
    for (const e of game.enemies) {
      if (e.elite && (e.phase === 'telegraph' || e.phase === 'telegraph_attack')) { elite = e; break; }
    }
    if (!elite) {
      lane.visible = false;
      if (lane2) lane2.visible = false;
      return;
    }
    const dx = elite.chargeDx != null ? elite.chargeDx : (game.px - elite.x);
    const dz = elite.chargeDz != null ? elite.chargeDz : (game.pz - elite.z);
    const len = Math.hypot(dx, dz) || 1;
    const ndx = dx / len, ndz = dz / len;
    // Perpendicular for twin-lane offset (hunter dual blades)
    const pdx = -ndz, pdz = ndx;
    const dist = Math.min(14, Math.max(3.5, Math.hypot(game.px - elite.x, game.pz - elite.z)));
    const u = Math.max(0, Math.min(1, 1 - (elite.phaseT || 0) / Math.max(0.01, elite.telegraphDur || 1.2)));
    const yaw = Math.atan2(ndx, ndz);
    const place = (ln, ox, oz, width) => {
      if (!ln) return;
      const mx = elite.x + ndx * dist * 0.5 + ox;
      const mz = elite.z + ndz * dist * 0.5 + oz;
      ln.visible = true;
      ln.position.set(mx, 0, mz);
      ln.rotation.y = yaw;
      const quad = ln.userData.quad;
      const mat = ln.userData.mat;
      if (quad) quad.scale.set(width, dist, 1);
      if (mat) mat.opacity = 0.42 + u * 0.50; // v0.9.22 stronger telegraph
    };
    if (elite.dualLane || elite.type === 'hunter') {
      const off = 0.55;
      place(lane, pdx * off, pdz * off, 0.85);
      place(lane2, -pdx * off, -pdz * off, 0.85);
    } else {
      place(lane, 0, 0, 1.1);
      if (lane2) lane2.visible = false;
    }
  }

  /** Boss orbit floor ring + volley telegraph lanes + acid volley bullets. */
  _syncBossHazards(game) {
    const hazards = game.bossHazards || [];
    // Orbit floor ring
    let ringH = null;
    for (const h of hazards) {
      if (h.kind === 'orbitRing') { ringH = h; break; }
    }
    if (this.bossOrbitRing) {
      if (ringH) {
        this.bossOrbitRing.visible = true;
        this.bossOrbitRing.position.set(ringH.x, 0.05, ringH.z);
        const u = 1 - Math.max(0, ringH.life) / Math.max(0.01, ringH.maxLife || 1);
        this.bossOrbitRing.material.opacity = 0.28 + u * 0.52;
        const sc = 0.85 + u * 0.25;
        this.bossOrbitRing.scale.set(sc, sc, sc);
      } else {
        this.bossOrbitRing.visible = false;
      }
    }
    // Volley lanes (telegraph only)
    const lanes = hazards.filter((h) => h.kind === 'volleyLane');
    const pool = this.bossLanes || [];
    for (let i = 0; i < pool.length; i++) {
      const lane = pool[i];
      const h = lanes[i];
      if (!h) { lane.visible = false; continue; }
      const dist = 12;
      const mx = h.x + h.dx * dist * 0.5;
      const mz = h.z + h.dz * dist * 0.5;
      lane.visible = true;
      lane.position.set(mx, 0, mz);
      lane.rotation.y = Math.atan2(h.dx, h.dz);
      const quad = lane.userData.quad;
      const mat = lane.userData.mat;
      if (quad) quad.scale.set(0.85, dist, 1);
      if (mat) {
        const u = 1 - Math.max(0, h.life) / Math.max(0.01, h.maxLife || 1);
        mat.opacity = 0.38 + u * 0.55; // v0.9.22 acid lanes punchier
      }
    }
    // Volley bullets (acid dots)
    this._recycle(this._bossHazPool, this._bossHazG);
    for (const h of hazards) {
      if (h.kind !== 'volleyBullet') continue;
      const m = this._take(this._bossHazPool, this._bossHazG, () => {
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 8, 6),
          new THREE.MeshBasicMaterial({ color: 0xb8ff3a, transparent: true, opacity: 0.95 })
        );
        mesh.userData.isBossHaz = true;
        return mesh;
      });
      m.position.set(h.x, 0.45, h.z);
      m.visible = true;
    }
  }

  frameCamera(cam, game, dt) {
    const z = this._zoom || 1;
    const k = Math.min(1, Math.max(0, dt) * 7);
    let px = game.px, pz = game.pz;
    if (!Number.isFinite(px) || !Number.isFinite(pz)) { px = 0; pz = 0; }
    let cx = cam.position.x, cy = cam.position.y, cz = cam.position.z;
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(cz)) {
      cx = px; cy = 14 * z; cz = pz + 12 * z;
    }
    cam.position.x = cx + (px - cx) * k;
    cam.position.y = cy + (14 * z - cy) * k;
    cam.position.z = cz + (pz + 12 * z - cz) * k;
    cam.rotation.z = 0; // clear residual trauma roll from fx.shake
    cam.lookAt(px, 0.85, pz);
  }
}

const MECH_CACHE = MECH_BY_ID;
function disposeTree(obj) {
  obj.traverse((ch) => {
    if (ch.geometry) ch.geometry.dispose();
    if (ch.material) {
      for (const m of Array.isArray(ch.material) ? ch.material : [ch.material]) {
        if (m && m.dispose) m.dispose();
      }
    }
  });
}

/** Arena floor: top-down background_arena PNG (calm cyan grid), canvas fallback. */
function makeFloorTexture() {
  const apply = (tex) => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  };
  /** Crush bright cyan grid spikes so lines never read as MG tracers / XP. */
  function dimFloorImage(img) {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const id = ctx.getImageData(0, 0, c.width, c.height);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      let nr = r, ng = g, nb = b;
      if (lum > 36) {
        const k = 36 / lum;
        nr = r * k * 0.85; ng = g * k * 0.9; nb = b * k * 0.95;
      }
      d[i] = (nr * 0.72) | 0;
      d[i + 1] = (ng * 0.72) | 0;
      d[i + 2] = (nb * 0.72) | 0;
    }
    ctx.putImageData(id, 0, 0);
    return c;
  }
  try {
    const holder = apply(new THREE.Texture());
    new THREE.TextureLoader().load('./assets/floor/background_arena.png', (tex) => {
      try {
        const canvas = dimFloorImage(tex.image);
        holder.image = canvas;
        holder.needsUpdate = true;
        apply(holder);
      } catch (_) {
        holder.image = tex.image;
        holder.needsUpdate = true;
        apply(holder);
      }
    });
    return holder;
  } catch (_) { /* fall through */ }
  const s = 512;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0a0c10';
  ctx.fillRect(0, 0, s, s);
  const tile = 64;
  for (let y = 0; y < s; y += tile) {
    for (let x = 0; x < s; x += tile) {
      const shade = 10 + ((x / tile + y / tile) % 2) * 2;
      ctx.fillStyle = `rgb(${shade},${shade + 1},${shade + 2})`;
      ctx.fillRect(x + 1, y + 1, tile - 2, tile - 2);
    }
  }
  // Quiet grid — must not read as cyan MG tracers or XP shards.
  ctx.strokeStyle = 'rgba(0,100,120,0.055)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= s; i += tile) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(0,110,130,0.07)';
  ctx.beginPath(); ctx.arc(s / 2, s / 2, 90, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,90,110,0.08)';
  ctx.strokeRect(3, 3, s - 6, s - 6);
  return apply(new THREE.CanvasTexture(c));
}

// Module-level load hook: ship the sprite builders on the kit global so a headless art pass
// can render every silhouette on a neutral stage without going through gameplay.
if (typeof window !== 'undefined') {
  window.__MECHS = MECH_BY_ID ? Object.values(MECH_BY_ID) : [];
  window.__rampageArt = {
    buildPlayerMech,
    buildPlayerSprite,
    buildEnemySprite,
    buildDoctorNpc,
    humanMesh,
    sniperMesh,
    shieldMesh,
    artilleryMesh,
    artilleryBlastRing,
    bomberMesh,
    bomberBlastRing,
    flankerMesh,
    flankerDashLane,
    medicMesh,
    medicHealAura,
    jammerMesh,
    jammerJamAura,
    zonePressureRing,
    supportMesh,
    eliteMesh,
    hunterMesh,
    commanderMesh,
    commanderSummonRing,
    bossMesh,
    warningLane,
    enemyMeshFor,
    THREE,
  };
}
