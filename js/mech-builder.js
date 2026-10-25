/**
 * Procedural player mech mesh — sole visual identity for select + sprite bake.
 * Imported by view.js (select/in-game 3D) and tools/bake-mech-sprites.mjs (via capture page).
 */
import * as THREE from 'three';

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
export function buildPlayerMech(cfg) {
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
  // Shared skeleton; per-mech parts keyed by model (not a recolor fork).
  const id = cfg.model || cfg.id;
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

  // ---- shoulders: tapered pauldrons; horn = asymmetric (Awaken Assault silhouette cue)
  for (const side of [-1, 1]) {
    const pad = new THREE.Group();
    const asym = horn ? (side < 0 ? 1.22 : 0.82) : 1;
    pad.position.set(side * (heavy ? 0.3 : 0.26) * (horn && side > 0 ? 1.05 : 1), 1.15, horn && side < 0 ? 0.04 : 0);
    const cap = slab(
      (heavy ? 0.18 : 0.15) * asym,
      (heavy ? 0.24 : 0.2) * asym,
      (heavy ? 0.2 : 0.17) * (horn && side < 0 ? 1.15 : 1),
      (heavy ? 0.3 : 0.26) * asym,
      accentM
    );
    const rim = box((heavy ? 0.26 : 0.22) * asym, 0.04, (heavy ? 0.32 : 0.28) * asym, trimM, 0, 0.1, 0);
    pad.add(cap, rim);
    pad.rotation.z = side * -0.14 * (horn && side < 0 ? 1.25 : 1);
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
    } else if (horn && side > 0) {
      // Mid rifle — Awaken Assault cue (visible from select orbit)
      const rifle = new THREE.Group();
      rifle.name = 'rifle';
      const stock = box(0.06, 0.08, 0.14, darkM, 0, -0.5, -0.02);
      const receiver = box(0.08, 0.09, 0.22, plateM, 0, -0.48, 0.14);
      const barrel = cyl(0.028, 0.034, 0.38, darkM, 10);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, -0.48, 0.38);
      const rail = box(0.03, 0.02, 0.2, trimM, 0, -0.42, 0.16);
      const tip = cyl(0.022, 0.022, 0.05, hotM, 10);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(0, -0.48, 0.58);
      tip.name = 'muzzle';
      rifle.add(stock, receiver, barrel, rail, tip);
      arm.add(rifle);
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
  // Awaken: single horn antenna + cyan brow gem. Proto stub: small twin fins. Heavy stub: brow.
  if (horn) {
    const hornAnt = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.48, 5), plateM);
    hornAnt.position.set(0.02, 0.32, -0.02);
    hornAnt.rotation.z = -0.18;
    hornAnt.rotation.x = -0.08;
    head.add(hornAnt);
    const hornTip = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.12, 5), trimM);
    hornTip.position.set(0.06, 0.54, -0.04);
    hornTip.rotation.z = -0.18;
    head.add(hornTip);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.04, 0), hotM);
    gem.position.set(0, 0.12, 0.12);
    gem.name = 'coreGem';
    head.add(gem);
  } else if (proto) {
    for (const side of [-1, 1]) {
      const fin = box(0.025, 0.2, 0.02, trimM, side * 0.08, 0.17, 0.08, 0.2);
      fin.rotation.z = side * 0.75;
      fin.rotation.x = -0.15;
      head.add(fin);
    }
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.035, 0), hotM);
    gem.position.set(0, 0.14, 0.1);
    head.add(gem);
  }
  if (heavy) {
    const brow = box(0.26, 0.05, 0.06, plateM, 0, 0.11, 0.11);
    head.add(brow);
    const bristle = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.16, 6), trimM);
    bristle.position.set(0, 0.16, -0.02);
    head.add(bristle);
  } else if (proto) {
    const monocle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 6, 14), visorM);
    monocle.position.set(-0.08, 0.02, 0.13);
    head.add(monocle);
    const crest = box(0.05, 0.14, 0.3, trimM, 0, 0.15, -0.08);
    crest.rotation.x = 0.4;
    head.add(crest);
  }
  body.add(head);

  // Cyan personality core — chest reactor already exists; mark + enlarge for awaken
  if (horn) {
    reactor.scale.set(1.25, 1.25, 1.35);
    reactor.name = 'personalityCore';
  }

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
  root.userData.seamMats = [trimM, hotM]; // rampage: cyan → magenta
  root.userData.rampageColor = cfg.rampage != null ? cfg.rampage : 0xff2bd6;
  root.userData.mechId = cfg.id;
  root.userData.model = id;
  root.userData.halo = halo;
  root.userData.plate = plateM;
  root.userData.body = body;
  root.userData.isSprite = false;
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
