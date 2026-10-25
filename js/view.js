import * as THREE from 'three';
import { ARENA, ENEMIES, DROP, MECH_BY_ID, WEAPON_SHOT, AMMO_PATHS, WEAPON_DROP_LABEL } from './config.js';
import {
  preloadAllSprites,
  buildPlayerSprite,
  buildEnemySprite,
  retargetEnemySprite,
  buildDoctorNpc,
  billboardToCamera,
  applySpriteFlash,
  applySpriteMotion,
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

function dropLabel(kind, weapon) {
  if (kind === 'xp') return 'XP';
  if (kind === 'heal') return 'HP';
  if (kind === 'shield') return 'SH';
  if (kind === 'weapon') return WEAPON_DROP_LABEL[weapon] || (weapon ? String(weapon).toUpperCase().slice(0, 5) : 'GUN');
  return (DROP[kind] && DROP[kind].letter) || '?';
}

function makeDropTexture(kind, weapon) {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  const color = (DROP[kind] && DROP[kind].color) || 0x00e5ff;
  const hex = '#' + color.toString(16).padStart(6, '0');
  // Deep-gray neon commercial frame
  ctx.clearRect(0, 0, s, s);
  // outer glow plate
  ctx.fillStyle = 'rgba(10, 14, 20, 0.92)';
  roundRect(ctx, 10, 10, s - 20, s - 20, 18);
  ctx.fill();
  // bordered glow box
  ctx.lineWidth = 10;
  ctx.strokeStyle = hex;
  roundRect(ctx, 18, 18, s - 36, s - 36, 14);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(200, 240, 255, 0.55)';
  roundRect(ctx, 28, 28, s - 56, s - 56, 10);
  ctx.stroke();
  // corner ticks
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
  // Size font so long labels (LASER/MULTI) still fill the box
  const len = label.length;
  const px = len <= 2 ? 118 : len <= 3 ? 92 : len <= 4 ? 72 : 58;
  ctx.font = '900 ' + px + 'px "Segoe UI", "Arial Black", Orbitron, sans-serif';
  ctx.shadowColor = hex;
  ctx.shadowBlur = 18;
  ctx.fillText(label, s / 2, s / 2 + 4);
  ctx.shadowBlur = 0;
  // tiny caption strip
  ctx.font = '700 18px "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(180, 220, 240, 0.75)';
  const cap = kind === 'weapon' ? 'WEAPON' : (kind === 'heal' ? 'REPAIR' : kind === 'xp' ? 'EXP' : String(kind).toUpperCase());
  ctx.fillText(cap, s / 2, s - 42);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
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

function dropTexture(kind, weapon) {
  const key = kind + ':' + (weapon || '') + ':v2';
  if (!DROP_TEX[key]) DROP_TEX[key] = makeDropTexture(kind, weapon);
  return DROP_TEX[key];
}

/** Large neon-framed letter board — always readable, faces camera in sync. */
function dropMesh(d) {
  const g = new THREE.Group();
  const color = (DROP[d.kind] && DROP[d.kind].color) || 0x00e5ff;
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 1.15),
    new THREE.MeshBasicMaterial({
      map: dropTexture(d.kind, d.weapon),
      transparent: true,
      alphaTest: 0.15,
      depthWrite: false,
      fog: false,
      side: THREE.DoubleSide,
    })
  );
  board.position.y = 0.85;
  board.name = 'face';
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 24),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, depthWrite: false, fog: false })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.03;
  // thin neon rim ring
  const rim = new THREE.Mesh(
    new THREE.RingGeometry(0.52, 0.58, 28),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false, fog: false })
  );
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.04;
  g.add(board, glow, rim);
  g.userData.cube = board; // keep sync API field name
  g.userData.face = board;
  g.userData.bill = board;
  return g;
}
// ---------------------------------------------------------------------------
// Map props:// ---------------------------------------------------------------------------
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

    // ---- arena floor (top-down background_arena)
    const floorSize = ARENA.half * 2 + 4;
    const floorTex = makeFloorTexture();
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(floorSize, floorSize),
      new THREE.MeshStandardMaterial({
        map: floorTex, color: 0xc8d0dc, emissive: 0x050a12, emissiveIntensity: 0.35,
        roughness: 0.88, metalness: 0.12,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = ARENA.floorY;
    this.group.add(floor);

    // Soft playable ring + outer hard edge (cyan arena, not magenta cage)
    const softRing = new THREE.Mesh(
      new THREE.RingGeometry(ARENA.soft - 0.18, ARENA.soft + 0.08, 96),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
    );
    softRing.rotation.x = -Math.PI / 2;
    softRing.position.y = 0.04;
    this.group.add(softRing);
    const hardRing = new THREE.Mesh(
      new THREE.RingGeometry(ARENA.half - 0.12, ARENA.half + 0.06, 96),
      new THREE.MeshBasicMaterial({ color: 0x5a9aaa, transparent: true, opacity: 0.14, side: THREE.DoubleSide })
    );
    hardRing.rotation.x = -Math.PI / 2;
    hardRing.position.y = 0.05;
    this.group.add(hardRing);
    // Center pad ring — reads as lab arena spawn
    const pad = new THREE.Mesh(
      new THREE.RingGeometry(2.4, 2.55, 64),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.1, side: THREE.DoubleSide })
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.035;
    this.group.add(pad);
    buildObstacles(this.group);

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
      // Billboards face the camera; VS-style bob + flip by velocity X.
      this.player.rotation.set(0, 0, 0);
      // Sustained aim/fire pose while auto-firing — no per-shot arm spasm.
      const aiming = (game.aimHold || 0) > 0 || fireKick > 0.02;
      // Pose priority: hit > attack(fire) > move > idle. defend/victory reserved when those states exist.
      let state = 'idle';
      if (hit) state = 'hit';
      else if (!game.alive) state = 'hit';
      else if (aiming) state = 'attack';
      else if (move > 0.12) state = 'move';
      if (ud.playerState !== state && ud.playerMaps) {
        const map = ud.playerMaps[state] || ud.playerMaps.idle;
        if (map) {
          ud.spriteMat.map = map;
          ud.spriteMat.needsUpdate = true;
          ud.playerState = state;
        }
      }
      // Keep torso/facing locked toward nearest foe while holding fire.
      if (aiming && game.enemies && game.enemies.length) {
        let best = null, bd = 1e9;
        for (const e of game.enemies) {
          const d = Math.hypot(e.x - game.px, e.z - game.pz);
          if (d < bd) { bd = d; best = e; }
        }
        if (best) {
          const want = Math.atan2(best.x - game.px, best.z - game.pz) + Math.PI;
          let dd = want - this._facing;
          while (dd > Math.PI) dd -= Math.PI * 2;
          while (dd < -Math.PI) dd += Math.PI * 2;
          this._facing += dd * 0.28;
        }
      }
      if (aiming) ud.animPhase = (ud.animPhase || 0) + 0.04;
      else if (move > 0.08) ud.animPhase = (ud.animPhase || 0) + move * 0.55;
      else ud.animPhase = (ud.animPhase || 0) * 0.9 + (game.t || 0) * 0.02;
      applySpriteMotion(this.player, {
        // While auto-firing hold ready pose — no run bob / arm spasm.
        moving: (!aiming) && move > 0.08,
        velX: aiming ? 0 : game.vx,
        phase: ud.animPhase || 0,
        phaseOffset: 0,
        strength: aiming ? 0.55 : 1.15,
        camera: this.stage.camera,
        facingYaw: this._facing,
        style: aiming ? 'idle' : (move > 0.08 ? 'ground' : 'idle'),
      });
      // Extra lean into move direction only when not locked in fire pose
      if (ud.plane && move > 0.08 && !aiming) {
        ud.plane.rotation.z += THREE.MathUtils.clamp(-game.vx * 0.12, -0.14, 0.14);
      }
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

    // ---- enemies (colour-coded PNG billboards + shared VS bob/flip)
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
          strength: isFlyer ? 0.85 : 1.55,
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
      }
    }

    // Doctor NPC prop: face camera, idle sway
    if (this.doctor && this.doctor.userData.isSprite) {
      const d = this.doctor;
      d.userData.idlePhase = (d.userData.idlePhase || 0) + 0.045;
      applySpriteMotion(d, {
        moving: false,
        velX: 0,
        phase: d.userData.idlePhase,
        phaseOffset: 0.35,
        strength: 1.55,
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
      slot.scale.setScalar(pop * 1.05);
      const board = slot.userData.cube;
      if (board) {
        board.position.y = 0.9 + Math.sin(game.t * 2.4 + g.x) * 0.06;
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
      this._fxDust.push({
        x: e.x, z: e.z, y: 0.04, life: 0.22, max: 0.22, r: 0.28, kind: 'dust', color: 0x8a9aaa,
      });
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
    return tex;
  };
  try {
    const tex = new THREE.TextureLoader().load('./assets/floor/background_arena.png');
    return apply(tex);
  } catch (_) { /* fall through */ }
  const s = 512;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#14181e';
  ctx.fillRect(0, 0, s, s);
  const tile = 64;
  for (let y = 0; y < s; y += tile) {
    for (let x = 0; x < s; x += tile) {
      const shade = 20 + ((x / tile + y / tile) % 2) * 3;
      ctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 4})`;
      ctx.fillRect(x + 1, y + 1, tile - 2, tile - 2);
    }
  }
  ctx.strokeStyle = 'rgba(0,180,210,0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= s; i += tile) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(0,200,220,0.18)';
  ctx.beginPath(); ctx.arc(s / 2, s / 2, 90, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,160,180,0.2)';
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
    supportMesh,
    enemyMeshFor,
    THREE,
  };
}
