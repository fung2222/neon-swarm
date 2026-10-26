/**
 * Procedural player mech mesh — sole visual identity for select + sprite bake.
 * Imported by view.js (select/in-game 3D) and tools/bake-mech-sprites.mjs (via capture page).
 *
 * horn (v0.9.21 HORN-SILHOUETTE-DIRECTION): mecha silhouette redesign —
 * longer limbs vs torso, sharper angular plates, less cube-stack.
 * Identity cues kept: single horn antenna, cyan chest personality core,
 * asymmetric pauldrons, mid rifle, deep-gray / violet / cyan palette.
 * Interim for Roy 肉眼 approval — NOT device-final-art-locked / HANDOFF §9.
 * heavy / prototype stubs unchanged (do not inherit horn mesh).
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
  const id = cfg.model || cfg.id;
  const heavy = id === 'heavy';
  const proto = id === 'prototype';
  const horn = id === 'horn';

  // Materials: horn gets clearer plate / violet / cyan separation (no bloom wash).
  const plateM = new THREE.MeshStandardMaterial({
    color: cfg.plate,
    emissive: cfg.plate,
    emissiveIntensity: horn ? 0.1 : 0.28,
    roughness: horn ? 0.36 : 0.42,
    metalness: horn ? 0.78 : 0.55,
  });
  const plateHiM = new THREE.MeshStandardMaterial({
    color: horn ? 0x2a2e38 : cfg.plate,
    emissive: horn ? 0x1c2030 : cfg.plate,
    emissiveIntensity: horn ? 0.14 : 0.28,
    roughness: 0.32,
    metalness: 0.82,
  });
  const accentM = new THREE.MeshStandardMaterial({
    color: cfg.accent,
    emissive: horn ? 0x4a2a70 : cfg.accent,
    emissiveIntensity: horn ? 0.22 : 0.4,
    roughness: horn ? 0.4 : 0.38,
    metalness: horn ? 0.55 : 0.6,
  });
  const violetM = new THREE.MeshStandardMaterial({
    color: 0x8b3dff,
    emissive: 0x8b3dff,
    emissiveIntensity: horn ? 0.35 : 0.2,
    roughness: 0.35,
    metalness: 0.45,
  });
  const trimM = new THREE.MeshStandardMaterial({
    color: cfg.trim,
    emissive: cfg.trim,
    emissiveIntensity: horn ? 1.15 : 0.95,
    roughness: 0.28,
    metalness: 0.35,
  });
  const hotM = new THREE.MeshStandardMaterial({
    color: cfg.hot,
    emissive: cfg.hot,
    emissiveIntensity: horn ? 1.7 : 1.3,
    roughness: 0.18,
    metalness: 0.15,
  });
  const visorM = new THREE.MeshStandardMaterial({
    color: cfg.visor,
    emissive: cfg.visor,
    emissiveIntensity: horn ? 1.85 : 1.6,
    roughness: 0.18,
  });
  const darkM = new THREE.MeshStandardMaterial({
    color: 0x0a0c14,
    emissive: 0x10141f,
    emissiveIntensity: 0.18,
    roughness: 0.62,
    metalness: 0.75,
  });

  const body = new THREE.Group();
  body.name = 'body';
  root.add(body);

  const thighs = [];
  const shins = [];
  const foots = [];
  const arms = [];
  const fists = [];
  const pads = [];

  // ---- legs ----
  // horn: longer / thinner humanoid-mecha limbs (less cube-stack)
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    if (horn) {
      // Long mecha legs (~55% of figure): hip high, slender thigh/shin wedges
      leg.position.set(side * 0.14, 0.92, 0);
      const thigh = slab(0.1, 0.14, 0.46, 0.12, plateM);
      thigh.position.set(0, -0.24, 0.01);
      const thighRidge = box(0.035, 0.34, 0.028, violetM, side * 0.05, -0.22, 0.07, 0.2);
      const thighPlate = box(0.12, 0.2, 0.04, plateHiM, 0, -0.18, 0.08, 0.14);
      const knee = slab(0.12, 0.16, 0.09, 0.14, accentM);
      knee.position.set(0, -0.5, 0.035);
      const kneeCap = box(0.09, 0.055, 0.045, plateHiM, 0, -0.5, 0.1, 0.18);
      const shin = slab(0.13, 0.085, 0.52, 0.11, plateM);
      shin.position.set(0, -0.78, 0.01);
      const shinBlade = box(0.028, 0.38, 0.035, violetM, side * 0.055, -0.78, 0.08, 0.22);
      const shinFront = box(0.09, 0.34, 0.035, plateHiM, 0, -0.76, 0.07, 0.16);
      const calf = box(0.1, 0.26, 0.035, plateHiM, 0, -0.84, -0.07, 0.14);
      const ankle = box(0.07, 0.045, 0.07, darkM, 0, -1.06, 0.02);
      const foot = slab(0.1, 0.18, 0.07, 0.3, accentM);
      foot.position.set(0, -1.11, -0.02);
      const toe = box(0.09, 0.035, 0.09, trimM, 0, -1.12, -0.15, 0.22);
      const heelGlow = box(0.07, 0.022, 0.03, trimM, 0, -1.14, 0.11, 0.28);
      leg.add(thigh, thighRidge, thighPlate, knee, kneeCap, shin, shinBlade, shinFront, calf, ankle, foot, toe, heelGlow);
      body.add(leg);
      thighs.push(leg);
      shins.push(shin);
      foots.push(foot);
    } else {
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
  }

  // ---- waist + skirt armour ----
  if (horn) {
    // Narrow pelvis + long angular skirt flaps
    const waist = box(0.22, 0.1, 0.15, darkM, 0, 0.98, 0, 0.14);
    const belt = box(0.28, 0.035, 0.17, trimM, 0, 1.02, 0.015, 0.25);
    const pelvisPlate = slab(0.24, 0.2, 0.08, 0.13, plateHiM);
    pelvisPlate.position.set(0, 1.04, 0.02);
    body.add(waist, belt, pelvisPlate);
    for (const side of [-1, 1]) {
      const skirt = slab(0.12, 0.08, 0.32, 0.085, accentM);
      skirt.position.set(side * 0.14, 0.86, 0.025);
      skirt.rotation.z = side * 0.22;
      const skirtEdge = box(0.025, 0.26, 0.018, violetM, side * 0.2, 0.84, 0.06, 0.25);
      body.add(skirt, skirtEdge);
    }
    const frontSkirt = slab(0.14, 0.18, 0.22, 0.065, plateM);
    frontSkirt.position.set(0, 0.86, 0.1);
    const frontLip = box(0.13, 0.025, 0.02, trimM, 0, 0.95, 0.14, 0.28);
    body.add(frontSkirt, frontLip);
  } else {
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
  }

  // ---- chest ----
  // horn: taller / narrower wedge torso (not a cube stack)
  let reactor;
  if (horn) {
    // Tall narrow torso wedge + visible neck gap (anti cube-stack)
    const chest = slab(0.28, 0.22, 0.42, 0.18, accentM);
    chest.position.set(0, 1.28, 0);
    const chestPlate = slab(0.2, 0.16, 0.32, 0.085, plateM);
    chestPlate.position.set(0, 1.28, 0.12);
    reactor = box(0.12, 0.12, 0.055, hotM, 0, 1.26, 0.17, 0.14);
    const collar = box(0.22, 0.045, 0.14, plateM, 0, 1.5, -0.01, 0.14);
    const neck = cyl(0.045, 0.055, 0.08, darkM, 10);
    neck.position.set(0, 1.56, 0);
    const coreBay = box(0.16, 0.16, 0.035, darkM, 0, 1.26, 0.145, 0.12);
    const pecL = box(0.085, 0.16, 0.04, plateHiM, -0.1, 1.32, 0.15, 0.16);
    const pecR = box(0.085, 0.16, 0.04, plateHiM, 0.1, 1.32, 0.15, 0.16);
    const seamH = box(0.18, 0.015, 0.015, trimM, 0, 1.26, 0.19, 0.32);
    const seamV = box(0.015, 0.16, 0.015, trimM, 0, 1.26, 0.19, 0.32);
    const collarLip = box(0.2, 0.02, 0.04, violetM, 0, 1.52, 0.05, 0.25);
    const sidePlateL = box(0.035, 0.3, 0.12, plateHiM, -0.15, 1.28, 0, 0.14);
    const sidePlateR = box(0.035, 0.3, 0.12, plateHiM, 0.15, 1.28, 0, 0.14);
    const abPlate = slab(0.16, 0.18, 0.12, 0.065, plateHiM);
    abPlate.position.set(0, 1.08, 0.1);
    body.add(chest, chestPlate, reactor, collar, neck, coreBay, pecL, pecR, seamH, seamV, collarLip, sidePlateL, sidePlateR, abPlate);
    for (const side of [-1, 1]) {
      const vent = box(0.02, 0.1, 0.015, trimM, side * 0.055, 1.26, 0.185, 0.28);
      body.add(vent);
    }
  } else {
    const chest = slab(heavy ? 0.54 : 0.44, heavy ? 0.48 : 0.4, heavy ? 0.4 : 0.42, 0.3, accentM);
    chest.position.set(0, 1.02, 0);
    const chestPlate = slab(heavy ? 0.4 : 0.32, heavy ? 0.34 : 0.28, 0.3, 0.12, plateM);
    chestPlate.position.set(0, 1.02, 0.17);
    reactor = box(0.16, 0.16, 0.07, hotM, 0, 1.03, 0.23);
    const collar = box(heavy ? 0.42 : 0.36, 0.07, 0.24, plateM, 0, 1.24, -0.01);
    body.add(chest, chestPlate, reactor, collar);
    for (const side of [-1, 1]) {
      const vent = box(0.03, 0.15, 0.02, trimM, side * 0.09, 1.03, 0.245);
      body.add(vent);
    }
  }

  // ---- shoulders: tapered pauldrons; horn = asymmetric (Awaken Assault silhouette cue)
  for (const side of [-1, 1]) {
    const pad = new THREE.Group();
    if (horn) {
      // Sharper asymmetric pauldrons — left shield wing, right slim rail
      const asym = side < 0 ? 1.45 : 0.68;
      pad.position.set(side * 0.2 * (side > 0 ? 1.1 : 1), 1.42, side < 0 ? 0.03 : 0);
      const cap = slab(0.1 * asym, 0.16 * asym, 0.14 * (side < 0 ? 1.3 : 0.9), 0.2 * asym, accentM);
      const rim = box(0.16 * asym, 0.025, 0.22 * asym, trimM, 0, 0.08, 0, 0.22);
      const outer = slab(0.09 * asym, 0.13 * asym, 0.08 * (side < 0 ? 1.25 : 1), 0.14 * asym, plateHiM);
      outer.position.set(side * 0.02, 0.045, 0.02);
      const spike = box(0.03 * asym, side < 0 ? 0.18 : 0.06, 0.03, violetM, side * 0.035, 0.14, -0.02, 0.2);
      const glowStrip = box(0.02, 0.015, 0.14 * asym, trimM, 0, 0.11, 0.015, 0.32);
      const under = box(0.07 * asym, 0.05, 0.1 * asym, darkM, 0, -0.035, 0, 0.16);
      pad.add(cap, rim, outer, spike, glowStrip, under);
      pad.rotation.z = side * -0.22 * (side < 0 ? 1.4 : 1);
    } else {
      const asym = 1;
      pad.position.set(side * (heavy ? 0.3 : 0.26), 1.15, 0);
      const cap = slab(
        (heavy ? 0.18 : 0.15) * asym,
        (heavy ? 0.24 : 0.2) * asym,
        (heavy ? 0.2 : 0.17),
        (heavy ? 0.3 : 0.26) * asym,
        accentM
      );
      const rim = box((heavy ? 0.26 : 0.22) * asym, 0.04, (heavy ? 0.32 : 0.28) * asym, trimM, 0, 0.1, 0);
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
    }
    body.add(pad);
    pads.push(pad);
  }

  // ---- arms ----
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    if (horn) {
      // Long slender arms hanging lower — mecha reach
      arm.position.set(side * 0.22, 1.36, 0);
      const upper = slab(0.075, 0.095, 0.38, 0.085, darkM);
      upper.position.set(0, -0.22, 0);
      const armSeam = box(0.015, 0.24, 0.015, trimM, side * 0.045, -0.2, 0.045, 0.32);
      const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), trimM);
      elbow.position.set(0, -0.44, 0);
      const fore = slab(0.11, 0.075, 0.4, 0.1, plateM);
      fore.position.set(side * 0.012, -0.68, 0.015);
      const forePlate = box(0.085, 0.26, 0.035, plateHiM, side * 0.012, -0.68, 0.07, 0.16);
      const vambrace = box(0.035, 0.24, 0.025, violetM, side * 0.045, -0.68, 0.08, 0.22);
      const fist = box(0.085, 0.085, 0.085, accentM, side * 0.012, -0.92, 0.025, 0.14);
      arm.add(upper, armSeam, elbow, fore, forePlate, vambrace, fist);
      if (side > 0) {
        const rifle = new THREE.Group();
        rifle.name = 'rifle';
        const stock = box(0.045, 0.07, 0.12, darkM, 0, -0.78, -0.04);
        const receiver = box(0.07, 0.08, 0.2, plateHiM, 0, -0.76, 0.11);
        const mag = box(0.035, 0.1, 0.06, accentM, 0, -0.86, 0.07);
        const barrel = cyl(0.02, 0.028, 0.44, darkM, 10);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, -0.76, 0.38);
        const shroud = box(0.04, 0.04, 0.13, plateM, 0, -0.76, 0.28, 0.16);
        const rail = box(0.022, 0.018, 0.18, trimM, 0, -0.69, 0.13);
        const tip = cyl(0.016, 0.016, 0.05, hotM, 10);
        tip.rotation.x = Math.PI / 2;
        tip.position.set(0, -0.76, 0.58);
        tip.name = 'muzzle';
        const optic = box(0.022, 0.03, 0.06, violetM, 0, -0.66, 0.05, 0.22);
        rifle.add(stock, receiver, mag, barrel, shroud, rail, tip, optic);
        arm.add(rifle);
      }
      body.add(arm);
      arms.push(arm);
      fists.push(fist);
    } else {
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
  }

  // ---- head ----
  const head = new THREE.Group();
  if (horn) {
    // Distinct head above neck + single swept horn antenna
    head.position.set(0, 1.68, 0);
    const skull = box(0.17, 0.15, 0.17, accentM, 0, 0, 0, 0.14);
    const jaw = box(0.12, 0.05, 0.13, plateM, 0, -0.09, 0.015, 0.14);
    const visor = box(0.14, 0.04, 0.022, visorM, 0, 0.01, 0.095, 0.18);
    const helmPlate = box(0.15, 0.055, 0.13, plateHiM, 0, 0.06, 0.015, 0.14);
    const visorBar = box(0.145, 0.025, 0.03, visorM, 0, 0.015, 0.1, 0.2);
    head.add(skull, jaw, visor, helmPlate, visorBar);
    for (const side of [-1, 1]) {
      const cheek = box(0.035, 0.1, 0.11, plateM, side * 0.095, -0.025, 0.015, 0.14);
      head.add(cheek);
    }
    const hornBase = box(0.06, 0.04, 0.06, plateM, 0.02, 0.1, -0.015, 0.16);
    const hornAnt = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.58, 6), plateHiM);
    hornAnt.position.set(0.03, 0.34, -0.02);
    hornAnt.rotation.z = -0.24;
    hornAnt.rotation.x = -0.14;
    const hornTip = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.14, 6), trimM);
    hornTip.position.set(0.095, 0.62, -0.06);
    hornTip.rotation.z = -0.24;
    hornTip.rotation.x = -0.14;
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.035, 0), hotM);
    gem.position.set(0, 0.075, 0.095);
    gem.name = 'coreGem';
    const gemRing = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.009, 6, 12), trimM);
    gemRing.position.set(0, 0.075, 0.095);
    gemRing.rotation.x = Math.PI / 2;
    head.add(hornBase, hornAnt, hornTip, gem, gemRing);
  } else {
    head.position.set(0, 1.36, 0);
    const skull = box(0.24, 0.2, 0.24, accentM, 0, 0, 0);
    const jaw = box(0.16, 0.07, 0.2, plateM, 0, -0.12, 0.02);
    const visor = box(0.18, 0.06, 0.03, visorM, 0, 0.01, 0.13);
    head.add(skull, jaw, visor);
    for (const side of [-1, 1]) {
      const cheek = box(0.05, 0.14, 0.16, plateM, side * 0.13, -0.03, 0.03);
      head.add(cheek);
    }
    if (proto) {
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
  }
  body.add(head);

  // Cyan personality core
  if (horn) {
    reactor.scale.set(1.35, 1.35, 1.45);
    reactor.name = 'personalityCore';
    const coreGlow = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), hotM);
    coreGlow.position.set(0, 1.26, 0.21);
    coreGlow.name = 'personalityCoreGlow';
    const coreRing = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 16), trimM);
    coreRing.position.set(0, 1.26, 0.19);
    body.add(coreGlow, coreRing);
  }

  // ---- backpack + thrusters ----
  if (horn) {
    const pack = box(0.2, 0.34, 0.12, plateM, 0, 1.3, -0.15, 0.12);
    const packCore = box(0.075, 0.22, 0.03, trimM, 0, 1.3, -0.22, 0.22);
    const packFrame = box(0.24, 0.3, 0.04, plateHiM, 0, 1.3, -0.13, 0.12);
    const packVentL = box(0.03, 0.16, 0.022, violetM, -0.07, 1.3, -0.23, 0.24);
    const packVentR = box(0.03, 0.16, 0.022, violetM, 0.07, 1.3, -0.23, 0.24);
    body.add(pack, packCore, packFrame, packVentL, packVentR);
  } else {
    const pack = box(heavy ? 0.38 : 0.3, 0.32, 0.17, plateM, 0, 1.04, -0.22);
    const packCore = box(0.11, 0.22, 0.04, trimM, 0, 1.04, -0.31);
    body.add(pack, packCore);
  }
  const glows = [];
  for (const side of [-1, 1]) {
    if (horn) {
      const nozzle = cyl(0.05, 0.075, 0.12, darkM, 10);
      nozzle.rotation.x = Math.PI / 2;
      nozzle.position.set(side * 0.075, 1.18, -0.24);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.18, 8), hotM);
      flame.rotation.x = -Math.PI / 2;
      flame.position.set(side * 0.075, 1.18, -0.36);
      const nozzleRing = cyl(0.06, 0.06, 0.022, trimM, 10);
      nozzleRing.rotation.x = Math.PI / 2;
      nozzleRing.position.set(side * 0.075, 1.18, -0.29);
      body.add(nozzle, flame, nozzleRing);
      glows.push(flame);
    } else {
      const nozzle = cyl(0.075, 0.1, 0.16, darkM, 10);
      nozzle.rotation.x = Math.PI / 2;
      nozzle.position.set(side * 0.11, 0.94, -0.33);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 8), hotM);
      flame.rotation.x = -Math.PI / 2;
      flame.position.set(side * 0.11, 0.94, -0.49);
      body.add(nozzle, flame);
      glows.push(flame);
    }
  }

  // ---- ground halo ----
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(horn ? 0.3 : 0.34, horn ? 0.56 : 0.62, 36),
    new THREE.MeshBasicMaterial({ color: cfg.trim, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.03;
  root.add(halo);

  root.userData.hullMats = [accentM, plateM, plateHiM, violetM];
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
  // horn slightly taller mecha read; keep overall scale near prior for camera framing
  root.scale.setScalar(heavy ? 1.2 : horn ? 0.98 : 1.12);
  return root;
}
