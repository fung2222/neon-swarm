import * as THREE from 'three';
import { ARENA, ENEMIES, DROP, MECH_BY_ID, WEAPON_SHOT } from './config.js';
import {
  preloadAllSprites,
  buildPlayerSprite,
  buildEnemySprite,
  retargetEnemySprite,
  buildDoctorNpc,
  billboardToCamera,
  applySpriteFlash,
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

/**
 * Stylised Japanese-anime mecha frame (gundam-ish language: V-fin, pauldrons, skirt armour,
 * backpack thrusters, separate head/visor). Fan-style silhouette only — no specific design.
 *   cfg.id: horn | heavy | prototype   cfg colours: plate / accent / trim / hot / visor
 */
function buildPlayerMech(cfg) {
  const root = new THREE.Group();
  const plateM = new THREE.MeshStandardMaterial({ color: cfg.plate, emissive: cfg.plate, emissiveIntensity: 0.28, roughness: 0.42, metalness: 0.55 });
  const accentM = new THREE.MeshStandardMaterial({ color: cfg.accent, emissive: cfg.accent, emissiveIntensity: 0.4, roughness: 0.38, metalness: 0.6 });
  const trimM = new THREE.MeshStandardMaterial({ color: cfg.trim, emissive: cfg.trim, emissiveIntensity: 0.95, roughness: 0.3, metalness: 0.3 });
  const hotM = new THREE.MeshStandardMaterial({ color: cfg.hot, emissive: cfg.hot, emissiveIntensity: 1.3, roughness: 0.2, metalness: 0.2 });
  const visorM = new THREE.MeshStandardMaterial({ color: cfg.visor, emissive: cfg.visor, emissiveIntensity: 1.6, roughness: 0.2 });
  const darkM = new THREE.MeshStandardMaterial({ color: 0x0d0f18, emissive: 0x141826, emissiveIntensity: 0.25, roughness: 0.6, metalness: 0.7 });

  const body = new THREE.Group();
  body.name = 'body';
  root.add(body);
  const id = cfg.id;
  const heavy = id === 'heavy';
  const proto = id === 'prototype';
  const horn = id === 'horn';

  const thighs = [];
  const shins = [];
  const foots = [];
  const arms = [];
  const fists = [];
  const pads = [];

  // ---- legs: thigh + knee guard + shin slab + angular foot
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.18, 0.66, 0);
    const thigh = box(0.17, 0.3, 0.19, plateM, 0, -0.15, 0);
    const knee = slab(0.2, 0.24, 0.12, 0.2, accentM);
    knee.position.set(0, -0.33, 0.05);
    const shin = slab(heavy ? 0.24 : 0.2, 0.15, 0.36, 0.19, plateM);
    shin.position.set(0, -0.53, 0.01);
    const shinTrim = box(0.045, 0.26, 0.02, trimM, side * 0.08, -0.53, 0.11);
    const ankle = box(0.1, 0.06, 0.1, darkM, 0, -0.73, 0.02);
    const foot = slab(0.16, 0.24, 0.1, heavy ? 0.4 : 0.36, accentM);
    foot.position.set(0, -0.78, -0.04);
    const toe = box(0.13, 0.05, 0.1, trimM, 0, -0.79, heavy ? -0.2 : -0.18);
    leg.add(thigh, knee, shin, shinTrim, ankle, foot, toe);
    body.add(leg);
    thighs.push(leg);
    shins.push(shin);
    foots.push(foot);
  }

  // ---- waist + skirt armour
  const waist = box(0.32, 0.16, 0.22, darkM, 0, 0.72, 0);
  const belt = box(0.4, 0.06, 0.26, trimM, 0, 0.76, 0.02);
  body.add(waist, belt);
  for (const side of [-1, 1]) {
    const skirt = slab(0.2, 0.14, 0.24, 0.14, accentM);
    skirt.position.set(side * 0.19, 0.64, 0.04);
    skirt.rotation.z = side * 0.12;
    body.add(skirt);
  }
  const frontSkirt = slab(0.26, 0.3, 0.18, 0.1, plateM);
  frontSkirt.position.set(0, 0.64, 0.13);
  body.add(frontSkirt);

  // ---- chest: broad slab with a raised collar and reactor
  const chest = slab(heavy ? 0.54 : 0.44, heavy ? 0.48 : 0.4, heavy ? 0.4 : 0.42, 0.3, accentM);
  chest.position.set(0, 1.02, 0);
  const chestPlate = slab(heavy ? 0.4 : 0.32, heavy ? 0.34 : 0.28, 0.3, 0.12, plateM);
  chestPlate.position.set(0, 1.02, 0.17);
  const reactor = box(0.16, 0.16, 0.07, hotM, 0, 1.03, 0.23);
  const collar = box(heavy ? 0.42 : 0.36, 0.07, 0.24, plateM, 0, 1.24, -0.01);
  body.add(chest, chestPlate, reactor, collar);
  for (const side of [-1, 1]) {
    const vent = box(0.03, 0.15, 0.02, trimM, side * 0.09, 1.03, 0.245);
    body.add(vent);
  }

  // ---- shoulders: tapered pauldrons with rim and (heavy) cannon mount
  for (const side of [-1, 1]) {
    const pad = new THREE.Group();
    pad.position.set(side * (heavy ? 0.3 : 0.26), 1.15, 0);
    const cap = slab(heavy ? 0.18 : 0.15, heavy ? 0.24 : 0.2, heavy ? 0.2 : 0.17, heavy ? 0.3 : 0.26, accentM);
    const rim = box(heavy ? 0.26 : 0.22, 0.04, heavy ? 0.32 : 0.28, trimM, 0, 0.1, 0);
    pad.add(cap, rim);
    pad.rotation.z = side * -0.14;
    if (heavy) {
      const mount = box(0.14, 0.12, 0.26, plateM, side * 0.06, 0.1, -0.06);
      const gun = cyl(0.05, 0.06, 0.34, darkM, 10);
      gun.rotation.x = Math.PI / 2;
      gun.position.set(side * 0.06, 0.1, -0.3);
      const muzzle = cyl(0.035, 0.035, 0.06, hotM, 10);
      muzzle.rotation.x = Math.PI / 2;
      muzzle.position.set(side * 0.06, 0.1, -0.46);
      pad.add(mount, gun, muzzle);
    }
    body.add(pad);
    pads.push(pad);
  }

  // ---- arms: upper / elbow joint / forearm (armoured) / fist
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * (heavy ? 0.33 : 0.28), 1.05, 0);
    const upper = box(0.12, 0.26, 0.14, darkM, 0, -0.15, 0);
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), trimM);
    elbow.position.set(0, -0.3, 0);
    const fore = slab(0.17, 0.13, 0.28, 0.16, plateM);
    fore.position.set(side * 0.02, -0.46, 0.02);
    const fist = box(0.13, 0.12, 0.13, accentM, side * 0.02, -0.63, 0.04);
    arm.add(upper, elbow, fore, fist);
    if (heavy || proto) {
      const barrel = cyl(0.045, 0.05, 0.22, darkM, 10);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(side * 0.02, -0.47, 0.19);
      const tip = cyl(0.03, 0.03, 0.05, hotM, 10);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(side * 0.02, -0.47, 0.32);
      arm.add(barrel, tip);
    }
    body.add(arm);
    arms.push(arm);
    fists.push(fist);
  }

  // ---- head: helmet, cheek guards, visor, V-fin / crest
  const head = new THREE.Group();
  head.position.set(0, 1.36, 0);
  const skull = box(0.24, 0.2, 0.24, accentM, 0, 0, 0);
  const jaw = box(0.16, 0.07, 0.2, plateM, 0, -0.12, 0.02);
  const visor = box(0.18, 0.06, 0.03, visorM, 0, 0.01, 0.13);
  head.add(skull, jaw, visor);
  for (const side of [-1, 1]) {
    const cheek = box(0.05, 0.14, 0.16, plateM, side * 0.13, -0.03, 0.03);
    head.add(cheek);
  }
  // twin V-fin antennae on the brow — the signature anime-mecha cue, kept small so it never
  // reads as a hat from the top-down game camera
  if (horn || proto) {
    for (const side of [-1, 1]) {
      const fin = box(horn ? 0.03 : 0.025, 0.2, 0.02, trimM, side * 0.08, 0.17, 0.08, 0.2);
      fin.rotation.z = side * 0.75;
      fin.rotation.x = -0.15;
      head.add(fin);
    }
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.035, 0), hotM);
    gem.position.set(0, 0.14, 0.1);
    head.add(gem);
  }
  if (horn) {
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.42, 4), plateM);
    crest.position.set(0, 0.28, -0.02);
    head.add(crest);
    const crestTip = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 4), hotM);
    crestTip.position.set(0, 0.5, -0.02);
    head.add(crestTip);
  } else if (heavy) {
    const brow = box(0.26, 0.05, 0.06, plateM, 0, 0.11, 0.11);
    head.add(brow);
    const bristle = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.16, 6), trimM);
    bristle.position.set(0, 0.16, -0.02);
    head.add(bristle);
  } else {
    const monocle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 6, 14), visorM);
    monocle.position.set(-0.08, 0.02, 0.13);
    head.add(monocle);
    const crest = box(0.05, 0.14, 0.3, trimM, 0, 0.15, -0.08);
    crest.rotation.x = 0.4;
    head.add(crest);
  }
  body.add(head);

  // ---- backpack + thrusters
  const pack = box(heavy ? 0.38 : 0.3, 0.32, 0.17, plateM, 0, 1.04, -0.22);
  const packCore = box(0.11, 0.22, 0.04, trimM, 0, 1.04, -0.31);
  body.add(pack, packCore);
  const glows = [];
  for (const side of [-1, 1]) {
    const nozzle = cyl(0.075, 0.1, 0.16, darkM, 10);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(side * 0.11, 0.94, -0.33);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 8), hotM);
    flame.rotation.x = -Math.PI / 2;
    flame.position.set(side * 0.11, 0.94, -0.49);
    body.add(nozzle, flame);
    glows.push(flame);
  }

  // ---- ground halo
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.62, 36),
    new THREE.MeshBasicMaterial({ color: cfg.trim, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.03;
  root.add(halo);

  root.userData.hullMats = [accentM, plateM];
  root.userData.coreMats = [visorM, hotM, trimM];
  root.userData.thrusterMats = [hotM];
  root.userData.halo = halo;
  root.userData.plate = plateM;
  root.userData.body = body;
  root.userData.legs = thighs;
  root.userData.shins = shins;
  root.userData.foots = foots;
  root.userData.arms = arms;
  root.userData.fists = fists;
  root.userData.head = head;
  root.userData.pads = pads;
  root.userData.glowL = glows[0];
  root.userData.glowR = glows[1];
  root.userData.animPhase = 0;
  root.userData.idlePhase = 0;
  root.scale.setScalar(heavy ? 1.2 : 1.12);
  return root;
}
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
  const scale = kind === 'chief' ? 2.15 : kind === 'officer' ? 2.0 : kind === 'soldier' ? 1.9 : 1.75;
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
  g.add(unitRing(color, kind === 'chief' ? 0.42 : 0.34, kind === 'chief' ? 0.5 : 0.34));

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
  return coat || 0x2b3350;
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
    g.add(unitRing(color, 0.3, 0.3));
    g.position.y = 0.5;
    g.userData.bob = true;
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
    g.add(unitRing(color, 0.44, 0.32));
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
    g.add(unitRing(color, 0.52, 0.34));
    g.userData.legs = legs;
  }
  g.userData.type = kind;
  return g;
}

function enemyMeshFor(type) {
  // Approved colour-coded PNG billboards (magenta / lime / orange) — no shared cyan mesh.
  return buildEnemySprite(type);
}
// ---------------------------------------------------------------------------
// Projectiles: every weapon gets its own silhouette and a colour ramp by stack level.
//   bolt  raindrop shard     rate   slim spike (fast, dense)
//   blade crescent           spread four-point star (wide fan)
//   lance long bright lance  orb    glowing sphere with a ring
//   wave  flat shock chevron
// ---------------------------------------------------------------------------
const SHOT_CACHE = Object.create(null);
function shotGeo(shot) {
  if (SHOT_CACHE[shot]) return SHOT_CACHE[shot];
  let g;
  if (shot === 'lance') g = new THREE.CapsuleGeometry(0.045, 0.5, 4, 8);
  else if (shot === 'spike') g = new THREE.ConeGeometry(0.07, 0.36, 5);
  else if (shot === 'blade') g = new THREE.TorusGeometry(0.13, 0.035, 6, 14, Math.PI * 1.3);
  else if (shot === 'star') g = new THREE.OctahedronGeometry(0.13, 0);
  else if (shot === 'wave') g = new THREE.TorusGeometry(0.1, 0.03, 4, 10, Math.PI * 0.9);
  else if (shot === 'bolt') { g = new THREE.OctahedronGeometry(0.1, 0); g.scale(0.7, 1.5, 0.7); }
  else g = new THREE.SphereGeometry(0.11, 10, 8);
  SHOT_CACHE[shot] = g;
  return g;
}

/** Bullet meshes are pooled per weapon+tier so a pooled shot never shows the wrong colour. */
const BULLET_POOLS = Object.create(null);
function bulletMesh(weapon, tier) {
  const spec = WEAPON_SHOT[weapon] || WEAPON_SHOT.dmg;
  const key = weapon + ':' + tier;
  if (!BULLET_POOLS[key]) BULLET_POOLS[key] = [];
  const m = BULLET_POOLS[key].pop();
  if (m) { m.visible = true; return m; }
  const color = new THREE.Color(spec.tiers[tier] || spec.tiers[0]);
  const shot = spec.shot;
  const mesh = new THREE.Mesh(shotGeo(shot), new THREE.MeshBasicMaterial({ color }));
  if (shot === 'blade' || shot === 'wave') mesh.rotation.z = Math.PI / 2;
  mesh.userData.shot = shot;
  if (tier >= 1) {
    // tier read without hiding the silhouette: a thin ring for tier 1, two rings for tier 2
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.19, 0.011, 4, 14),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false })
    );
    halo.name = 'halo';
    halo.rotation.x = Math.PI / 2;
    mesh.add(halo);
    if (tier >= 2) {
      const halo2 = new THREE.Mesh(
        new THREE.TorusGeometry(0.27, 0.007, 4, 16),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.38, depthWrite: false })
      );
      halo2.name = 'halo2';
      halo2.rotation.x = Math.PI / 2;
      mesh.add(halo2);
    }
  }
  return mesh;
}

function recycleBullets(parent) {
  for (let i = parent.children.length - 1; i >= 0; i--) {
    const m = parent.children[i];
    parent.remove(m);
    m.visible = false;
    const key = m.userData.key || 'dmg:0';
    if (!BULLET_POOLS[key]) BULLET_POOLS[key] = [];
    BULLET_POOLS[key].push(m);
  }
}

// ---------------------------------------------------------------------------
// Drops: a solid 3D cube with an icon face — one readable object per pickup.
//   XP  -> green cube, "X" glyph and a rocket chevron
//   heal-> cyan cube, "H" cross glyph
//   W   -> gold cube, weapon icon (gun / blade / orb drawn per weapon family)
// ---------------------------------------------------------------------------
const DROP_TEX = Object.create(null);

function iconGlyph(kind, weapon) {
  if (kind === 'xp') return 'X';
  if (kind === 'heal') return 'H';
  if (kind === 'weapon') return WEAPON_SHOT[weapon] ? weapon : 'dmg';
  return '?';
}

function makeDropTexture(kind, weapon) {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  const color = (DROP[kind] && DROP[kind].color) || 0x3bff8a;
  const hex = '#' + color.toString(16).padStart(6, '0');
  // dark inset panel + bright border = the "icon face" on the cube
  ctx.fillStyle = 'rgba(4,2,14,0.92)';
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = hex;
  ctx.lineWidth = 10;
  ctx.strokeRect(7, 7, s - 14, s - 14);
  ctx.fillStyle = hex;
  ctx.strokeStyle = hex;
  if (kind === 'heal') {
    ctx.lineWidth = 20;
    ctx.beginPath(); ctx.moveTo(64, 30); ctx.lineTo(64, 98); ctx.moveTo(30, 64); ctx.lineTo(98, 64); ctx.stroke();
  } else if (kind === 'weapon') {
    // simple gun / blade / orb emblems so the weapon family reads at a glance
    const shot = (WEAPON_SHOT[weapon] || WEAPON_SHOT.dmg).shot;
    if (shot === 'blade' || shot === 'wave') {
      ctx.lineWidth = 14;
      ctx.beginPath(); ctx.arc(64, 70, 34, Math.PI * 0.15, Math.PI * 0.85, true); ctx.stroke();
    } else if (shot === 'orb') {
      ctx.lineWidth = 12;
      ctx.beginPath(); ctx.arc(64, 64, 26, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(64, 64, 8, 0, Math.PI * 2); ctx.fill();
    } else if (shot === 'lance' || shot === 'spike') {
      ctx.lineWidth = 12;
      ctx.beginPath(); ctx.moveTo(28, 96); ctx.lineTo(96, 32); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(96, 32); ctx.lineTo(74, 34); ctx.lineTo(94, 54); ctx.closePath(); ctx.fill();
    } else if (shot === 'star') {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const r = i % 2 ? 16 : 40, a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const x = 64 + Math.cos(a) * r, y = 64 + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill();
    } else {
      // gun silhouette
      ctx.fillRect(34, 52, 58, 14);
      ctx.fillRect(40, 66, 14, 22);
      ctx.fillRect(84, 60, 10, 8);
    }
  } else {
    ctx.font = '900 88px Orbitron, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('X', 64, 68);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function dropTexture(kind, weapon) {
  const key = kind + ':' + (weapon || '');
  if (!DROP_TEX[key]) DROP_TEX[key] = makeDropTexture(kind, weapon);
  return DROP_TEX[key];
}

function dropMesh(d) {
  const g = new THREE.Group();
  const color = (DROP[d.kind] && DROP[d.kind].color) || 0x3bff8a;
  const cubeMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.45, roughness: 0.35, metalness: 0.5 });
  const cube = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), cubeMat);
  cube.rotation.y = Math.PI / 4;
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.3, 0.3),
    new THREE.MeshBasicMaterial({ map: dropTexture(d.kind, d.weapon), transparent: true })
  );
  face.position.z = 0.176;
  face.name = 'face';
  cube.add(face);
  cube.position.y = 0.24;
  // soft ground glow so the cube pops off the dark floor
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(0.34, 20),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, depthWrite: false })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.02;
  g.add(cube, glow);
  g.userData.cube = cube;
  g.userData.face = face;
  g.userData.bill = null;
  return g;
}
// ---------------------------------------------------------------------------
// Map props: low, readable, no tall buildings (never block the view).
// ---------------------------------------------------------------------------
function buildObstacles(parent) {
  const group = new THREE.Group();
  parent.add(group);
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x162033, emissive: 0x1b2a45, emissiveIntensity: 0.35, roughness: 0.6, metalness: 0.3 });
  const edgeMat = mat(0x3fa9ff, 0.5);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x121a2b, emissive: 0x182741, emissiveIntensity: 0.3, roughness: 0.65, metalness: 0.25 });
  const debrisMat = new THREE.MeshStandardMaterial({ color: 0x1b2440, emissive: 0x27355e, emissiveIntensity: 0.32, roughness: 0.55, metalness: 0.35 });
  const pipeMat = hullMat(0x24304c, 0.2);

  // three low "lab zones" scattered around the arena: crates + fence + containers
  const zones = [[-14, -12], [16, -14], [12, 14], [-18, 14], [0, -20], [22, 2], [-22, -2], [0, 20]];
  let i = 0;
  for (const [zx, zz] of zones) {
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
      // low fence barrier
      for (let k = 0; k < 3; k++) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), pipeMat);
        p.position.set(zx + k * 0.7 - 0.7, 0.22, zz);
        group.add(p);
      }
      const rail = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.06), edgeMat);
      rail.position.set(zx, 0.4, zz);
      group.add(rail);
    } else if (kind === 2) {
      // shipping container (low, wide)
      const box = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 1.0), wallMat);
      box.position.set(zx, 0.45, zz);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.06, 1.02), edgeMat);
      stripe.position.set(zx, 0.86, zz);
      group.add(box, stripe);
    } else {
      // debris scatter
      for (let k = 0; k < 4; k++) {
        const d = new THREE.Mesh(new THREE.BoxGeometry(0.3 + (k % 2) * 0.2, 0.18, 0.28), debrisMat);
        d.position.set(zx + (k - 1.5) * 0.4, 0.1, zz + (k % 2) * 0.3);
        d.rotation.y = k * 0.8;
        group.add(d);
      }
    }
    i++;
  }

  // a few pipe runs + hazard lights for texture
  for (let k = 0; k < 5; k++) {
    const x = -24 + k * 12;
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), pipeMat);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(x, 0.16, -26 + (k % 2) * 52);
    group.add(pipe);
  }
  return group;
}

export class View {
  constructor(stage) {
    this.stage = stage;
    this.group = new THREE.Group();
    stage.scene.add(this.group);

    // ---- floor: dark plating with a subtle radial gradient painted in
    const floorSize = ARENA.half * 2 + 4;
    const floorTex = makeFloorTexture();
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(floorSize, floorSize),
      new THREE.MeshStandardMaterial({
        map: floorTex, color: 0xbfc9e0, emissive: 0x0b1426, emissiveIntensity: 0.5,
        roughness: 0.86, metalness: 0.14,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = ARENA.floorY;
    this.group.add(floor);

    // glow seams across the floor (a calm grid, not a cage)
    const softRing = new THREE.Mesh(
      new THREE.RingGeometry(ARENA.soft - 0.15, ARENA.soft + 0.08, 96),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.16, side: THREE.DoubleSide })
    );
    softRing.rotation.x = -Math.PI / 2;
    softRing.position.y = 0.04;
    this.group.add(softRing);
    const hardRing = new THREE.Mesh(
      new THREE.RingGeometry(ARENA.half - 0.1, ARENA.half + 0.06, 96),
      new THREE.MeshBasicMaterial({ color: 0xff2bd6, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
    );
    hardRing.rotation.x = -Math.PI / 2;
    hardRing.position.y = 0.05;
    this.group.add(hardRing);
    const grid = new THREE.GridHelper(floorSize, Math.floor(floorSize / 3), 0x2f7dff, 0x16223f);
    grid.position.y = 0.025;
    if (Array.isArray(grid.material)) for (const m of grid.material) { m.opacity = 0.3; m.transparent = true; }
    else { grid.material.opacity = 0.3; grid.material.transparent = true; }
    this.group.add(grid);
    buildObstacles(this.group);

    this.player = null;
    this.playerMechId = null;
    preloadAllSprites();
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
    this.novaAge = -1;

    this.enemyG = new THREE.Group();
    this.bulletG = new THREE.Group();
    this.gemG = new THREE.Group();
    this.orbitG = new THREE.Group();
    this.group.add(this.enemyG, this.bulletG, this.gemG, this.orbitG);

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

  /** Home-screen showcase: the chosen frame stands on the arena floor, slowly turning. */
  setMenuMech(id) {
    this.hideMenuMech();
    const cfg = MECH_CACHE[id] || MECH_CACHE.horn;
    const mech = buildPlayerSprite(cfg);
    mech.position.set(0, 0, 0);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1.05, 40),
      new THREE.MeshBasicMaterial({ color: cfg.trim, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    mech.add(ring);
    this.menuMechRing = ring;
    this.menuMech = mech;
    this.group.add(mech);
    this.group.visible = true;
    return mech;
  }

  /** Per-frame menu motion (slow turntable + idle breathing). */
  updateMenu(t) {
    const m = this.menuMech;
    if (!m) return;
    const ud = m.userData;
    if (ud.isSprite) {
      // Slow yaw of the ring only; plane faces the camera so the PNG stays readable.
      m.rotation.y = 0;
      if (ud.plane) ud.plane.position.y = (ud.spriteH || 2.4) * 0.5 + Math.sin(t * 1.6) * 0.04;
      if (this.stage && this.stage.camera) billboardToCamera(m, this.stage.camera, t * 0.5);
      if (ud.halo) ud.halo.material.opacity = 0.35 + Math.sin(t * 1.8) * 0.12;
    } else {
      m.rotation.y = t * 0.5;
      if (ud.body) ud.body.position.y = Math.sin(t * 1.6) * 0.02;
      if (ud.glowL && ud.glowR) {
        const pulse = 1 + Math.sin(t * 2.4) * 0.06;
        ud.glowL.scale.setScalar(pulse);
        ud.glowR.scale.setScalar(pulse);
      }
    }
    if (this.menuMechRing) this.menuMechRing.material.opacity = 0.35 + Math.sin(t * 1.8) * 0.12;
  }

  hideMenuMech() {
    if (!this.menuMech) return;
    this.group.remove(this.menuMech);
    disposeTree(this.menuMech);
    this.menuMech = null;
    this.menuMechRing = null;
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

  pulseNova(r) {
    this.novaRing.scale.setScalar(1);
    this.novaRing.material.opacity = 0.85;
    this.novaRing.visible = true;
    this.novaAge = 0;
    this._novaR = r;
  }

  _setEmissive(mats, flash) { for (const m of mats) m.emissiveIntensity = flash; }

  sync(game) {
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
      // Billboards face the camera; yaw only drives left/right flip.
      this.player.rotation.set(0, 0, 0);
      let state = 'idle';
      if (fireKick > 0.02) state = 'fire';
      else if (move > 0.12) state = 'move';
      if (ud.playerState !== state && ud.playerMaps) {
        ud.spriteMat.map = ud.playerMaps[state];
        ud.spriteMat.needsUpdate = true;
        ud.playerState = state;
      }
      const bob = move > 0.08 ? Math.abs(Math.sin((ud.animPhase || 0))) * 0.05 : Math.sin((game.t || 0) * 2.4) * 0.025;
      if (ud.plane) ud.plane.position.y = (ud.spriteH || 2.55) * 0.5 * this.player.scale.y + bob;
      ud.animPhase = move > 0.08 ? (ud.animPhase || 0) + move * 0.55 : (ud.animPhase || 0) * 0.92;
      billboardToCamera(this.player, this.stage.camera, this._facing);
      applySpriteFlash(this.player, { blink, hit, move });
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
      if (move > 0.08) ud.animPhase = (ud.animPhase || 0) + move * 0.55;
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

    // ---- enemies (colour-coded PNG billboards)
    this._recycle(this._ePool, this.enemyG);
    for (const e of game.enemies) {
      const m = this._take(this._ePool, this.enemyG, () => enemyMeshFor(e.type));
      if (m.userData.type !== e.type) {
        if (m.userData.isSprite) retargetEnemySprite(m, e.type);
        else {
          while (m.children.length) m.remove(m.children[0]);
          const fresh = enemyMeshFor(e.type);
          while (fresh.children.length) m.add(fresh.children[0]);
          m.userData = { ...fresh.userData, type: e.type };
        }
      }
      const faceYaw = Math.atan2(game.px - e.x, game.pz - e.z);
      let y = m.userData.baseY || 0;
      if (m.userData.bob) y = 0.45 + Math.sin(game.t * 3 + e.wob) * 0.08;
      m.position.set(e.x, y, e.z);
      if (m.userData.isSprite) {
        m.rotation.set(0, 0, 0);
        billboardToCamera(m, this.stage.camera, faceYaw);
        applySpriteFlash(m, { hit: e.hit > 0, blink: false, move: e.speed || 0 });
        if (e.slow > 0 && m.userData.spriteMat) m.userData.spriteMat.color.setRGB(0.65, 0.85, 1.2);
      } else {
        m.rotation.y = faceYaw;
        const glow = e.hit > 0 ? 1.5 : (e.slow > 0 ? 0.45 : 0.7);
        const legSwing = Math.sin(game.t * (e.speed * 2.4) + e.wob) * 0.5;
        const legs = m.userData.legs || [];
        if (legs.length) { legs[0].rotation.x = legSwing; if (legs[1]) legs[1].rotation.x = -legSwing; }
        m.traverse((ch) => {
          if (ch.isMesh && ch.material && ch.material.emissive) ch.material.emissiveIntensity = glow;
        });
      }
    }

    // Doctor NPC prop: face camera, idle bob
    if (this.doctor && this.doctor.userData.isSprite) {
      const d = this.doctor;
      if (d.userData.plane) {
        d.userData.plane.position.y = (d.userData.spriteH || 2.1) * 0.5 + Math.sin(game.t * 1.5) * 0.03;
      }
      billboardToCamera(d, this.stage.camera, Math.atan2(game.px - d.position.x, game.pz - d.position.z));
    }

    // ---- bullets (one silhouette + colour per weapon and tier)
    recycleBullets(this.bulletG);
    for (const b of game.bullets) {
      const weapon = b.frost ? 'frost' : (b.weapon || 'dmg');
      const tier = b.frost ? 1 : (b.tier || 0);
      const m = bulletMesh(weapon, tier);
      m.userData.key = weapon + ':' + tier;
      if (m.parent !== this.bulletG) this.bulletG.add(m);
      const spec = WEAPON_SHOT[weapon] || WEAPON_SHOT.dmg;
      const size = (spec.size || 1) * (tier >= 2 ? 1.35 : tier >= 1 ? 1.18 : 1);
      m.scale.setScalar(size);
      m.position.set(b.x, 0.55, b.z);
      const ang = Math.atan2(b.vx, b.vz);
      if (m.userData.shot === 'orb') {
        m.rotation.y += 0.15;
        const halo = m.getObjectByName('halo');
        if (halo) halo.scale.setScalar(1 + Math.sin(game.t * 9) * 0.14);
      } else if (m.userData.shot === 'star') {
        m.rotation.set(Math.PI / 2, ang, game.t * 6);
      } else if (m.userData.shot === 'blade' || m.userData.shot === 'wave') {
        m.rotation.set(Math.PI / 2, 0, ang);
      } else {
        m.rotation.set(Math.PI / 2, ang, 0);
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
      const pop = g.pop > 0 ? 1 + g.pop * 1.5 : 1;
      slot.position.set(g.x, 0.02, g.z);
      slot.scale.setScalar(pop);
      const cube = slot.userData.cube;
      cube.rotation.y = Math.sin(game.t * 1.2 + g.z) * 0.25;   // gentle sway, icon stays readable
      cube.position.y = 0.26 + Math.sin(game.t * 3 + g.x) * 0.04;
      if (face) face.quaternion.copy(this.stage.camera.quaternion);
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

  frameCamera(cam, game, dt) {
    const z = this._zoom || 1;
    const k = Math.min(1, dt * 7);
    cam.position.x += (game.px - cam.position.x) * k;
    cam.position.y += (14 * z - cam.position.y) * k;
    cam.position.z += (game.pz + 12 * z - cam.position.z) * k;
    cam.lookAt(game.px, 0.85, game.pz);
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

/** Procedural floor texture: dark plating, faint panel lines, a few coolant stains. */
function makeFloorTexture() {
  const s = 512;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 40, s / 2, s / 2, s * 0.72);
  g.addColorStop(0, '#101b33');
  g.addColorStop(1, '#070c18');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  // panel seams
  ctx.strokeStyle = 'rgba(70,130,220,0.16)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 8; i++) {
    const p = (i / 8) * s;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(s, p); ctx.stroke();
  }
  // coolant stains
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * s, y = Math.random() * s, r = 8 + Math.random() * 40;
    ctx.fillStyle = `rgba(${40 + Math.random() * 40},${90 + Math.random() * 60},${160 + Math.random() * 60},0.05)`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
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
    supportMesh,
    enemyMeshFor,
    THREE,
  };
}
