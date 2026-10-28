/**
 * Procedural player mech mesh — sole visual identity for select + sprite bake.
 * Imported by view.js (select/in-game 3D) and tools/bake-mech-sprites.mjs (via capture page).
 *
 * horn (v0.9.187 HORN-MECHA-DEEPEN): deepen mecha read on v0.9.21 silhouette —
 * sharper angular plates, stronger asymmetry, mil-tech panel lines, longer horn sweep.
 * Identity cues kept: single horn antenna, cyan chest personality core,
 * asymmetric pauldrons, mid rifle, deep-gray / violet / cyan palette.
 * Interim for Roy 肉眼 — NOT device-final-art-locked / HANDOFF §9.
 *
 * heavy (v0.9.189 MECH-HEAVY-SILHOUETTE): unique Precision Frame mesh —
 * compact wide stance, twin shoulder pods, sensor crown, white-pink bible palette.
 * NOT a horn recolor.
 *
 * prototype (v0.9.190 MECH-PROTOTYPE-SILHOUETTE): unique Morph Prototype mesh —
 * segmented morph seams, dual fins + monocle, reconfigurable pods, citrus accents.
 * NOT a horn recolor.
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

function makeMats(cfg, kind) {
  const horn = kind === 'horn';
  const heavy = kind === 'heavy';
  const plateM = new THREE.MeshStandardMaterial({
    color: cfg.plate,
    emissive: cfg.plate,
    emissiveIntensity: horn ? 0.08 : heavy ? 0.12 : 0.22,
    roughness: horn ? 0.34 : heavy ? 0.28 : 0.4,
    metalness: horn ? 0.82 : heavy ? 0.72 : 0.58,
  });
  const plateHiM = new THREE.MeshStandardMaterial({
    color: horn ? 0x2a2e38 : heavy ? 0xf8f2f6 : cfg.plate,
    emissive: horn ? 0x1c2030 : heavy ? 0xe8dce6 : cfg.plate,
    emissiveIntensity: horn ? 0.12 : heavy ? 0.1 : 0.24,
    roughness: 0.3,
    metalness: horn ? 0.85 : 0.7,
  });
  const accentM = new THREE.MeshStandardMaterial({
    color: cfg.accent,
    emissive: horn ? 0x4a2a70 : heavy ? 0xff9ec8 : cfg.accent,
    emissiveIntensity: horn ? 0.2 : heavy ? 0.18 : 0.35,
    roughness: horn ? 0.38 : 0.36,
    metalness: horn ? 0.58 : 0.55,
  });
  const violetM = new THREE.MeshStandardMaterial({
    color: horn ? 0x8b3dff : heavy ? 0xff7ab0 : 0x5cff8a,
    emissive: horn ? 0x8b3dff : heavy ? 0xff7ab0 : 0x3cff6a,
    emissiveIntensity: horn ? 0.38 : heavy ? 0.28 : 0.32,
    roughness: 0.34,
    metalness: 0.45,
  });
  const trimM = new THREE.MeshStandardMaterial({
    color: cfg.trim,
    emissive: cfg.trim,
    emissiveIntensity: horn ? 1.2 : heavy ? 0.95 : 1.05,
    roughness: 0.26,
    metalness: 0.35,
  });
  const hotM = new THREE.MeshStandardMaterial({
    color: cfg.hot,
    emissive: cfg.hot,
    emissiveIntensity: horn ? 1.85 : heavy ? 1.4 : 1.55,
    roughness: 0.16,
    metalness: 0.12,
  });
  const visorM = new THREE.MeshStandardMaterial({
    color: cfg.visor,
    emissive: cfg.visor,
    emissiveIntensity: horn ? 1.95 : heavy ? 1.5 : 1.7,
    roughness: 0.16,
  });
  const darkM = new THREE.MeshStandardMaterial({
    color: heavy ? 0x2a1e28 : 0x0a0c14,
    emissive: heavy ? 0x1a1018 : 0x10141f,
    emissiveIntensity: 0.16,
    roughness: 0.6,
    metalness: 0.75,
  });
  return { plateM, plateHiM, accentM, violetM, trimM, hotM, visorM, darkM };
}

function attachCommon(root, body, mats, cfg, id, parts) {
  const { plateM, plateHiM, accentM, violetM, trimM, hotM, visorM } = mats;
  root.userData.hullMats = [accentM, plateM, plateHiM, violetM];
  root.userData.coreMats = [visorM, hotM, trimM];
  root.userData.thrusterMats = [hotM];
  root.userData.seamMats = [trimM, hotM];
  root.userData.rampageColor = cfg.rampage != null ? cfg.rampage : 0xff2bd6;
  root.userData.mechId = cfg.id;
  root.userData.model = id;
  root.userData.halo = parts.halo;
  root.userData.plate = plateM;
  root.userData.body = body;
  root.userData.isSprite = false;
  root.userData.legs = parts.thighs;
  root.userData.shins = parts.shins;
  root.userData.foots = parts.foots;
  root.userData.arms = parts.arms;
  root.userData.fists = parts.fists;
  root.userData.head = parts.head;
  root.userData.pads = parts.pads;
  root.userData.glowL = parts.glows[0];
  root.userData.glowR = parts.glows[1];
  root.userData.animPhase = 0;
  root.userData.idlePhase = 0;
}

function buildHorn(cfg, root, body, mats) {
  const { plateM, plateHiM, accentM, violetM, trimM, hotM, visorM, darkM } = mats;
  const thighs = [];
  const shins = [];
  const foots = [];
  const arms = [];
  const fists = [];
  const pads = [];

  // ---- legs: longer mecha limbs + deepened panel ridges ----
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.14, 0.92, 0);
    const thigh = slab(0.095, 0.135, 0.48, 0.115, plateM);
    thigh.position.set(0, -0.25, 0.01);
    const thighRidge = box(0.032, 0.36, 0.026, violetM, side * 0.052, -0.23, 0.072, 0.2);
    const thighPlate = box(0.115, 0.22, 0.038, plateHiM, 0, -0.19, 0.082, 0.14);
    const thighVent = box(0.05, 0.06, 0.02, trimM, side * 0.02, -0.32, 0.1, 0.28);
    const knee = slab(0.115, 0.155, 0.085, 0.135, accentM);
    knee.position.set(0, -0.52, 0.035);
    const kneeCap = box(0.085, 0.05, 0.042, plateHiM, 0, -0.52, 0.105, 0.18);
    const kneePin = box(0.02, 0.04, 0.02, trimM, side * 0.06, -0.52, 0.12, 0.3);
    const shin = slab(0.125, 0.08, 0.54, 0.105, plateM);
    shin.position.set(0, -0.8, 0.01);
    const shinBlade = box(0.026, 0.4, 0.032, violetM, side * 0.055, -0.8, 0.082, 0.22);
    const shinFront = box(0.085, 0.36, 0.032, plateHiM, 0, -0.78, 0.072, 0.16);
    const shinPanel = box(0.06, 0.12, 0.02, trimM, 0, -0.7, 0.09, 0.28);
    const calf = box(0.095, 0.28, 0.032, plateHiM, 0, -0.86, -0.072, 0.14);
    const ankle = box(0.065, 0.042, 0.065, darkM, 0, -1.08, 0.02);
    const foot = slab(0.095, 0.175, 0.065, 0.3, accentM);
    foot.position.set(0, -1.13, -0.02);
    const toe = box(0.085, 0.032, 0.085, trimM, 0, -1.14, -0.155, 0.22);
    const heelGlow = box(0.065, 0.02, 0.028, trimM, 0, -1.16, 0.11, 0.28);
    leg.add(thigh, thighRidge, thighPlate, thighVent, knee, kneeCap, kneePin, shin, shinBlade, shinFront, shinPanel, calf, ankle, foot, toe, heelGlow);
    body.add(leg);
    thighs.push(leg);
    shins.push(shin);
    foots.push(foot);
  }

  // ---- waist + skirt ----
  const waist = box(0.21, 0.095, 0.14, darkM, 0, 0.98, 0, 0.14);
  const belt = box(0.27, 0.032, 0.16, trimM, 0, 1.02, 0.015, 0.25);
  const pelvisPlate = slab(0.23, 0.19, 0.075, 0.125, plateHiM);
  pelvisPlate.position.set(0, 1.04, 0.02);
  const beltBuckle = box(0.06, 0.04, 0.03, violetM, 0, 1.02, 0.09, 0.22);
  body.add(waist, belt, pelvisPlate, beltBuckle);
  for (const side of [-1, 1]) {
    const skirt = slab(0.115, 0.075, 0.34, 0.08, accentM);
    skirt.position.set(side * 0.14, 0.85, 0.025);
    skirt.rotation.z = side * 0.24;
    const skirtEdge = box(0.022, 0.28, 0.016, violetM, side * 0.205, 0.83, 0.06, 0.25);
    const skirtLip = box(0.08, 0.018, 0.015, trimM, side * 0.14, 0.7, 0.07, 0.3);
    body.add(skirt, skirtEdge, skirtLip);
  }
  const frontSkirt = slab(0.13, 0.17, 0.24, 0.06, plateM);
  frontSkirt.position.set(0, 0.85, 0.1);
  const frontLip = box(0.125, 0.022, 0.018, trimM, 0, 0.95, 0.14, 0.28);
  const frontChevron = box(0.08, 0.04, 0.02, violetM, 0, 0.88, 0.135, 0.22);
  body.add(frontSkirt, frontLip, frontChevron);

  // ---- chest: taller wedge + chevron plates ----
  const chest = slab(0.27, 0.21, 0.44, 0.175, accentM);
  chest.position.set(0, 1.28, 0);
  const chestPlate = slab(0.19, 0.15, 0.34, 0.08, plateM);
  chestPlate.position.set(0, 1.28, 0.12);
  const reactor = box(0.125, 0.125, 0.055, hotM, 0, 1.26, 0.175, 0.14);
  reactor.scale.set(1.4, 1.4, 1.5);
  reactor.name = 'personalityCore';
  const collar = box(0.21, 0.042, 0.135, plateM, 0, 1.51, -0.01, 0.14);
  const neck = cyl(0.042, 0.052, 0.085, darkM, 10);
  neck.position.set(0, 1.57, 0);
  const coreBay = box(0.155, 0.155, 0.032, darkM, 0, 1.26, 0.15, 0.12);
  const pecL = box(0.08, 0.17, 0.038, plateHiM, -0.1, 1.33, 0.155, 0.16);
  const pecR = box(0.08, 0.17, 0.038, plateHiM, 0.1, 1.33, 0.155, 0.16);
  const seamH = box(0.175, 0.014, 0.014, trimM, 0, 1.26, 0.195, 0.32);
  const seamV = box(0.014, 0.17, 0.014, trimM, 0, 1.26, 0.195, 0.32);
  const collarLip = box(0.19, 0.018, 0.038, violetM, 0, 1.53, 0.05, 0.25);
  const sidePlateL = box(0.032, 0.32, 0.115, plateHiM, -0.15, 1.28, 0, 0.14);
  const sidePlateR = box(0.032, 0.32, 0.115, plateHiM, 0.15, 1.28, 0, 0.14);
  const abPlate = slab(0.15, 0.17, 0.125, 0.06, plateHiM);
  abPlate.position.set(0, 1.07, 0.1);
  const chestChevron = box(0.14, 0.03, 0.02, violetM, 0, 1.42, 0.17, 0.22);
  const coreGlow = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), hotM);
  coreGlow.position.set(0, 1.26, 0.215);
  coreGlow.name = 'personalityCoreGlow';
  const coreRing = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.012, 6, 16), trimM);
  coreRing.position.set(0, 1.26, 0.195);
  body.add(chest, chestPlate, reactor, collar, neck, coreBay, pecL, pecR, seamH, seamV, collarLip, sidePlateL, sidePlateR, abPlate, chestChevron, coreGlow, coreRing);
  for (const side of [-1, 1]) {
    const vent = box(0.018, 0.11, 0.014, trimM, side * 0.055, 1.26, 0.19, 0.28);
    body.add(vent);
  }

  // ---- shoulders: stronger asymmetry ----
  for (const side of [-1, 1]) {
    const pad = new THREE.Group();
    const asym = side < 0 ? 1.55 : 0.62;
    pad.position.set(side * 0.2 * (side > 0 ? 1.12 : 1), 1.43, side < 0 ? 0.035 : 0);
    const cap = slab(0.095 * asym, 0.155 * asym, 0.145 * (side < 0 ? 1.35 : 0.85), 0.195 * asym, accentM);
    const rim = box(0.155 * asym, 0.022, 0.215 * asym, trimM, 0, 0.085, 0, 0.22);
    const outer = slab(0.085 * asym, 0.125 * asym, 0.075 * (side < 0 ? 1.3 : 1), 0.135 * asym, plateHiM);
    outer.position.set(side * 0.02, 0.045, 0.02);
    const spike = box(0.028 * asym, side < 0 ? 0.2 : 0.055, 0.028, violetM, side * 0.038, 0.15, -0.02, 0.2);
    const glowStrip = box(0.018, 0.014, 0.135 * asym, trimM, 0, 0.115, 0.015, 0.32);
    const under = box(0.065 * asym, 0.048, 0.095 * asym, darkM, 0, -0.035, 0, 0.16);
    const wingTip = side < 0
      ? box(0.04, 0.06, 0.12, plateHiM, -0.08, 0.1, -0.04, 0.18)
      : box(0.03, 0.04, 0.06, violetM, 0.04, 0.06, 0.02, 0.2);
    pad.add(cap, rim, outer, spike, glowStrip, under, wingTip);
    pad.rotation.z = side * -0.24 * (side < 0 ? 1.45 : 1);
    body.add(pad);
    pads.push(pad);
  }

  // ---- arms + mid rifle ----
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.22, 1.37, 0);
    const upper = slab(0.07, 0.09, 0.4, 0.08, darkM);
    upper.position.set(0, -0.23, 0);
    const armSeam = box(0.014, 0.26, 0.014, trimM, side * 0.045, -0.21, 0.045, 0.32);
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.046, 10, 8), trimM);
    elbow.position.set(0, -0.46, 0);
    const fore = slab(0.105, 0.07, 0.42, 0.095, plateM);
    fore.position.set(side * 0.012, -0.7, 0.015);
    const forePlate = box(0.08, 0.28, 0.032, plateHiM, side * 0.012, -0.7, 0.07, 0.16);
    const vambrace = box(0.032, 0.26, 0.022, violetM, side * 0.045, -0.7, 0.08, 0.22);
    const fist = box(0.08, 0.08, 0.08, accentM, side * 0.012, -0.95, 0.025, 0.14);
    arm.add(upper, armSeam, elbow, fore, forePlate, vambrace, fist);
    if (side > 0) {
      const rifle = new THREE.Group();
      rifle.name = 'rifle';
      const stock = box(0.042, 0.065, 0.115, darkM, 0, -0.8, -0.04);
      const receiver = box(0.068, 0.075, 0.21, plateHiM, 0, -0.78, 0.12);
      const mag = box(0.032, 0.105, 0.055, accentM, 0, -0.9, 0.07);
      const barrel = cyl(0.018, 0.026, 0.48, darkM, 10);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, -0.78, 0.4);
      const shroud = box(0.038, 0.038, 0.14, plateM, 0, -0.78, 0.3, 0.16);
      const rail = box(0.02, 0.016, 0.2, trimM, 0, -0.71, 0.14);
      const tip = cyl(0.014, 0.014, 0.055, hotM, 10);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(0, -0.78, 0.62);
      tip.name = 'muzzle';
      const optic = box(0.02, 0.028, 0.055, violetM, 0, -0.68, 0.05, 0.22);
      const underRail = box(0.018, 0.014, 0.16, violetM, 0, -0.84, 0.2, 0.25);
      rifle.add(stock, receiver, mag, barrel, shroud, rail, tip, optic, underRail);
      arm.add(rifle);
    }
    body.add(arm);
    arms.push(arm);
    fists.push(fist);
  }

  // ---- head + longer swept horn ----
  const head = new THREE.Group();
  head.position.set(0, 1.7, 0);
  const skull = box(0.165, 0.145, 0.165, accentM, 0, 0, 0, 0.14);
  const jaw = box(0.115, 0.048, 0.125, plateM, 0, -0.09, 0.015, 0.14);
  const visor = box(0.135, 0.038, 0.02, visorM, 0, 0.01, 0.095, 0.18);
  const helmPlate = box(0.145, 0.052, 0.125, plateHiM, 0, 0.06, 0.015, 0.14);
  const visorBar = box(0.14, 0.022, 0.028, visorM, 0, 0.015, 0.1, 0.2);
  head.add(skull, jaw, visor, helmPlate, visorBar);
  for (const side of [-1, 1]) {
    const cheek = box(0.032, 0.095, 0.105, plateM, side * 0.092, -0.025, 0.015, 0.14);
    head.add(cheek);
  }
  const hornBase = box(0.055, 0.038, 0.055, plateM, 0.02, 0.1, -0.015, 0.16);
  const hornAnt = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.64, 6), plateHiM);
  hornAnt.position.set(0.035, 0.38, -0.025);
  hornAnt.rotation.z = -0.26;
  hornAnt.rotation.x = -0.16;
  const hornRidge = box(0.018, 0.4, 0.02, violetM, 0.055, 0.32, -0.01, 0.25);
  hornRidge.rotation.z = -0.26;
  hornRidge.rotation.x = -0.16;
  const hornTip = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.16, 6), trimM);
  hornTip.position.set(0.11, 0.68, -0.07);
  hornTip.rotation.z = -0.26;
  hornTip.rotation.x = -0.16;
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.032, 0), hotM);
  gem.position.set(0, 0.075, 0.095);
  gem.name = 'coreGem';
  const gemRing = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.008, 6, 12), trimM);
  gemRing.position.set(0, 0.075, 0.095);
  gemRing.rotation.x = Math.PI / 2;
  head.add(hornBase, hornAnt, hornRidge, hornTip, gem, gemRing);
  body.add(head);

  // ---- backpack ----
  const pack = box(0.19, 0.36, 0.115, plateM, 0, 1.3, -0.15, 0.12);
  const packCore = box(0.07, 0.24, 0.028, trimM, 0, 1.3, -0.22, 0.22);
  const packFrame = box(0.23, 0.32, 0.038, plateHiM, 0, 1.3, -0.13, 0.12);
  const packVentL = box(0.028, 0.17, 0.02, violetM, -0.07, 1.3, -0.23, 0.24);
  const packVentR = box(0.028, 0.17, 0.02, violetM, 0.07, 1.3, -0.23, 0.24);
  const packFinL = box(0.02, 0.22, 0.08, plateHiM, -0.11, 1.35, -0.18, 0.18);
  const packFinR = box(0.02, 0.22, 0.08, plateHiM, 0.11, 1.35, -0.18, 0.18);
  body.add(pack, packCore, packFrame, packVentL, packVentR, packFinL, packFinR);
  const glows = [];
  for (const side of [-1, 1]) {
    const nozzle = cyl(0.048, 0.072, 0.115, darkM, 10);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(side * 0.075, 1.18, -0.245);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.19, 8), hotM);
    flame.rotation.x = -Math.PI / 2;
    flame.position.set(side * 0.075, 1.18, -0.37);
    const nozzleRing = cyl(0.058, 0.058, 0.02, trimM, 10);
    nozzleRing.rotation.x = Math.PI / 2;
    nozzleRing.position.set(side * 0.075, 1.18, -0.295);
    body.add(nozzle, flame, nozzleRing);
    glows.push(flame);
  }

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.54, 36),
    new THREE.MeshBasicMaterial({ color: cfg.trim, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.03;
  root.add(halo);
  root.scale.setScalar(0.98);
  attachCommon(root, body, mats, cfg, 'horn', { thighs, shins, foots, arms, fists, pads, head, glows, halo });
  return root;
}

function buildHeavy(cfg, root, body, mats) {
  const { plateM, plateHiM, accentM, violetM, trimM, hotM, visorM, darkM } = mats;
  const thighs = [];
  const shins = [];
  const foots = [];
  const arms = [];
  const fists = [];
  const pads = [];

  // Compact wide Precision stance — short powerful legs, NOT horn proportions
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.22, 0.58, 0);
    const thigh = slab(0.2, 0.26, 0.28, 0.22, plateM);
    thigh.position.set(0, -0.12, 0);
    const thighGuard = box(0.08, 0.18, 0.04, violetM, side * 0.1, -0.1, 0.12, 0.2);
    const knee = slab(0.26, 0.3, 0.12, 0.24, accentM);
    knee.position.set(0, -0.28, 0.04);
    const shin = slab(0.28, 0.18, 0.3, 0.22, plateM);
    shin.position.set(0, -0.46, 0.01);
    const shinPlate = box(0.2, 0.18, 0.04, plateHiM, 0, -0.44, 0.12, 0.14);
    const ankle = box(0.14, 0.07, 0.14, darkM, 0, -0.64, 0.02);
    const foot = slab(0.22, 0.32, 0.1, 0.42, accentM);
    foot.position.set(0, -0.7, -0.04);
    const toe = box(0.18, 0.05, 0.12, trimM, 0, -0.71, -0.22);
    const heelSpike = box(0.06, 0.08, 0.06, violetM, 0, -0.68, 0.16, 0.22);
    leg.add(thigh, thighGuard, knee, shin, shinPlate, ankle, foot, toe, heelSpike);
    body.add(leg);
    thighs.push(leg);
    shins.push(shin);
    foots.push(foot);
  }

  // Wide pelvis / hip thrusters (precision dash read)
  const waist = box(0.42, 0.14, 0.28, darkM, 0, 0.62, 0);
  const belt = box(0.5, 0.05, 0.3, trimM, 0, 0.66, 0.02);
  const hipCore = box(0.16, 0.1, 0.08, hotM, 0, 0.64, 0.14, 0.2);
  body.add(waist, belt, hipCore);
  for (const side of [-1, 1]) {
    const skirt = slab(0.24, 0.18, 0.2, 0.16, accentM);
    skirt.position.set(side * 0.24, 0.55, 0.04);
    skirt.rotation.z = side * 0.08;
    const hipThruster = cyl(0.06, 0.08, 0.14, darkM, 10);
    hipThruster.rotation.x = Math.PI / 2;
    hipThruster.position.set(side * 0.28, 0.58, -0.16);
    const hipFlame = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 8), hotM);
    hipFlame.rotation.x = -Math.PI / 2;
    hipFlame.position.set(side * 0.28, 0.58, -0.26);
    body.add(skirt, hipThruster, hipFlame);
  }
  const frontSkirt = slab(0.32, 0.36, 0.14, 0.12, plateM);
  frontSkirt.position.set(0, 0.54, 0.16);
  body.add(frontSkirt);

  // Broad armored chest — pink precision core (not cyan horn core)
  const chest = slab(0.56, 0.48, 0.4, 0.34, accentM);
  chest.position.set(0, 0.95, 0);
  const chestPlate = slab(0.42, 0.36, 0.32, 0.14, plateM);
  chestPlate.position.set(0, 0.95, 0.18);
  const reactor = box(0.14, 0.14, 0.06, hotM, 0, 0.96, 0.26, 0.16);
  reactor.name = 'personalityCore';
  const collar = box(0.44, 0.08, 0.26, plateM, 0, 1.16, -0.01);
  const browArmor = box(0.4, 0.06, 0.1, plateHiM, 0, 1.2, 0.12, 0.14);
  body.add(chest, chestPlate, reactor, collar, browArmor);
  for (const side of [-1, 1]) {
    const vent = box(0.04, 0.14, 0.025, trimM, side * 0.1, 0.96, 0.28);
    const sideArmor = box(0.05, 0.28, 0.2, plateHiM, side * 0.28, 0.95, 0, 0.12);
    body.add(vent, sideArmor);
  }

  // Twin shoulder weapon pods — Precision signature
  for (const side of [-1, 1]) {
    const pad = new THREE.Group();
    pad.position.set(side * 0.34, 1.08, 0);
    const cap = slab(0.2, 0.28, 0.22, 0.32, accentM);
    const rim = box(0.28, 0.04, 0.34, trimM, 0, 0.1, 0);
    const mount = box(0.16, 0.14, 0.28, plateM, side * 0.06, 0.1, -0.08);
    const gun = cyl(0.055, 0.065, 0.38, darkM, 10);
    gun.rotation.x = Math.PI / 2;
    gun.position.set(side * 0.06, 0.1, -0.34);
    const muzzle = cyl(0.038, 0.038, 0.07, hotM, 10);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(side * 0.06, 0.1, -0.52);
    muzzle.name = side > 0 ? 'muzzle' : 'muzzleL';
    const podGlow = box(0.04, 0.04, 0.2, violetM, side * 0.06, 0.18, -0.1, 0.25);
    pad.add(cap, rim, mount, gun, muzzle, podGlow);
    pad.rotation.z = side * -0.1;
    body.add(pad);
    pads.push(pad);
  }

  // Compact arms with wrist cannons
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.36, 0.98, 0);
    const upper = box(0.14, 0.22, 0.16, darkM, 0, -0.12, 0);
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), trimM);
    elbow.position.set(0, -0.26, 0);
    const fore = slab(0.18, 0.14, 0.24, 0.16, plateM);
    fore.position.set(side * 0.02, -0.42, 0.02);
    const fist = box(0.14, 0.12, 0.14, accentM, side * 0.02, -0.58, 0.04);
    const barrel = cyl(0.04, 0.048, 0.2, darkM, 10);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(side * 0.02, -0.42, 0.18);
    const tip = cyl(0.028, 0.028, 0.05, hotM, 10);
    tip.rotation.x = Math.PI / 2;
    tip.position.set(side * 0.02, -0.42, 0.3);
    if (side > 0) tip.name = 'muzzleArm';
    arm.add(upper, elbow, fore, fist, barrel, tip);
    body.add(arm);
    arms.push(arm);
    fists.push(fist);
  }

  // Sensor crown head — no horn; flat brow + pink bristle crest
  const head = new THREE.Group();
  head.position.set(0, 1.28, 0);
  const skull = box(0.26, 0.18, 0.26, accentM, 0, 0, 0);
  const jaw = box(0.18, 0.06, 0.2, plateM, 0, -0.11, 0.02);
  const visor = box(0.2, 0.05, 0.03, visorM, 0, 0.02, 0.14);
  const brow = box(0.28, 0.05, 0.08, plateM, 0, 0.1, 0.12);
  const sensorBar = box(0.22, 0.03, 0.04, trimM, 0, 0.08, 0.15, 0.25);
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 6), violetM);
  crest.position.set(0, 0.16, -0.02);
  const cheekL = box(0.05, 0.12, 0.14, plateHiM, -0.14, -0.02, 0.03);
  const cheekR = box(0.05, 0.12, 0.14, plateHiM, 0.14, -0.02, 0.03);
  head.add(skull, jaw, visor, brow, sensorBar, crest, cheekL, cheekR);
  body.add(head);

  // Wide backpack
  const pack = box(0.4, 0.28, 0.18, plateM, 0, 0.95, -0.24);
  const packCore = box(0.12, 0.18, 0.04, trimM, 0, 0.95, -0.34);
  const packWingL = box(0.08, 0.2, 0.12, plateHiM, -0.22, 0.95, -0.2, 0.14);
  const packWingR = box(0.08, 0.2, 0.12, plateHiM, 0.22, 0.95, -0.2, 0.14);
  body.add(pack, packCore, packWingL, packWingR);
  const glows = [];
  for (const side of [-1, 1]) {
    const nozzle = cyl(0.07, 0.1, 0.14, darkM, 10);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(side * 0.12, 0.88, -0.36);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.2, 8), hotM);
    flame.rotation.x = -Math.PI / 2;
    flame.position.set(side * 0.12, 0.88, -0.5);
    body.add(nozzle, flame);
    glows.push(flame);
  }

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.36, 0.66, 36),
    new THREE.MeshBasicMaterial({ color: cfg.trim, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.03;
  root.add(halo);
  root.scale.setScalar(1.15);
  attachCommon(root, body, mats, cfg, 'heavy', { thighs, shins, foots, arms, fists, pads, head, glows, halo });
  return root;
}

function buildPrototype(cfg, root, body, mats) {
  const { plateM, plateHiM, accentM, violetM, trimM, hotM, visorM, darkM } = mats;
  const thighs = [];
  const shins = [];
  const foots = [];
  const arms = [];
  const fists = [];
  const pads = [];

  // Segmented morph legs — visible joint rings
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.17, 0.7, 0);
    const thigh = slab(0.14, 0.18, 0.32, 0.16, plateM);
    thigh.position.set(0, -0.14, 0);
    const thighSeam = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.015, 6, 12), trimM);
    thighSeam.position.set(0, -0.28, 0);
    thighSeam.rotation.x = Math.PI / 2;
    const knee = slab(0.18, 0.22, 0.1, 0.18, accentM);
    knee.position.set(0, -0.34, 0.04);
    const shin = slab(0.18, 0.12, 0.34, 0.16, plateM);
    shin.position.set(0, -0.54, 0.01);
    const shinSeg = box(0.14, 0.08, 0.04, violetM, 0, -0.5, 0.1, 0.22);
    const shinSeam = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 12), trimM);
    shinSeam.position.set(0, -0.68, 0);
    shinSeam.rotation.x = Math.PI / 2;
    const ankle = box(0.09, 0.05, 0.09, darkM, 0, -0.74, 0.02);
    const foot = slab(0.14, 0.22, 0.08, 0.34, accentM);
    foot.position.set(0, -0.8, -0.03);
    const toe = box(0.12, 0.04, 0.1, trimM, 0, -0.81, -0.18);
    const morphPod = box(0.06, 0.1, 0.06, hotM, side * 0.08, -0.4, -0.08, 0.2);
    leg.add(thigh, thighSeam, knee, shin, shinSeg, shinSeam, ankle, foot, toe, morphPod);
    body.add(leg);
    thighs.push(leg);
    shins.push(shin);
    foots.push(foot);
  }

  // Morph waist with reconfigurable skirt panels
  const waist = box(0.3, 0.14, 0.2, darkM, 0, 0.74, 0);
  const belt = box(0.38, 0.05, 0.24, trimM, 0, 0.78, 0.02);
  const morphRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 6, 20), violetM);
  morphRing.position.set(0, 0.76, 0);
  morphRing.rotation.x = Math.PI / 2;
  body.add(waist, belt, morphRing);
  for (const side of [-1, 1]) {
    const skirt = slab(0.16, 0.12, 0.22, 0.12, accentM);
    skirt.position.set(side * 0.18, 0.64, 0.04);
    skirt.rotation.z = side * 0.18;
    const panel = box(0.08, 0.14, 0.03, plateHiM, side * 0.22, 0.66, 0.1, 0.16);
    body.add(skirt, panel);
  }
  const frontSkirt = slab(0.22, 0.26, 0.16, 0.09, plateM);
  frontSkirt.position.set(0, 0.64, 0.13);
  body.add(frontSkirt);

  // Segmented morph torso
  const chest = slab(0.4, 0.34, 0.38, 0.28, accentM);
  chest.position.set(0, 1.02, 0);
  const chestPlate = slab(0.28, 0.24, 0.28, 0.1, plateM);
  chestPlate.position.set(0, 1.02, 0.16);
  const reactor = box(0.12, 0.12, 0.06, hotM, 0, 1.03, 0.22);
  reactor.name = 'personalityCore';
  const collar = box(0.32, 0.06, 0.2, plateM, 0, 1.22, -0.01);
  const torsoSeam = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.015, 6, 16), trimM);
  torsoSeam.position.set(0, 1.02, 0.05);
  torsoSeam.rotation.x = Math.PI / 2;
  body.add(chest, chestPlate, reactor, collar, torsoSeam);
  for (const side of [-1, 1]) {
    const vent = box(0.025, 0.12, 0.02, trimM, side * 0.08, 1.03, 0.235);
    const morphLatch = box(0.04, 0.08, 0.04, violetM, side * 0.2, 1.05, 0.1, 0.22);
    body.add(vent, morphLatch);
  }

  // Reconfigurable shoulder pods
  for (const side of [-1, 1]) {
    const pad = new THREE.Group();
    pad.position.set(side * 0.28, 1.14, 0);
    const cap = slab(0.14, 0.18, 0.16, 0.22, accentM);
    const rim = box(0.2, 0.035, 0.26, trimM, 0, 0.08, 0);
    const pod = box(0.1, 0.12, 0.14, plateHiM, side * 0.04, 0.02, -0.08, 0.14);
    const podRing = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 6, 12), violetM);
    podRing.position.set(side * 0.04, 0.02, -0.08);
    podRing.rotation.y = Math.PI / 2;
    const spike = box(0.03, 0.12, 0.03, hotM, side * 0.06, 0.14, 0, 0.22);
    pad.add(cap, rim, pod, podRing, spike);
    pad.rotation.z = side * -0.16;
    body.add(pad);
    pads.push(pad);
  }

  // Morph arms with actuator seams
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.3, 1.05, 0);
    const upper = box(0.11, 0.24, 0.13, darkM, 0, -0.14, 0);
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), trimM);
    elbow.position.set(0, -0.28, 0);
    const elbowRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 12), violetM);
    elbowRing.position.set(0, -0.28, 0);
    elbowRing.rotation.z = Math.PI / 2;
    const fore = slab(0.15, 0.11, 0.26, 0.14, plateM);
    fore.position.set(side * 0.02, -0.44, 0.02);
    const fist = box(0.12, 0.11, 0.12, accentM, side * 0.02, -0.6, 0.04);
    const barrel = cyl(0.04, 0.045, 0.2, darkM, 10);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(side * 0.02, -0.45, 0.18);
    const tip = cyl(0.028, 0.028, 0.045, hotM, 10);
    tip.rotation.x = Math.PI / 2;
    tip.position.set(side * 0.02, -0.45, 0.3);
    if (side > 0) tip.name = 'muzzle';
    arm.add(upper, elbow, elbowRing, fore, fist, barrel, tip);
    body.add(arm);
    arms.push(arm);
    fists.push(fist);
  }

  // Dual fins + monocle + crest — Morph head
  const head = new THREE.Group();
  head.position.set(0, 1.36, 0);
  const skull = box(0.22, 0.18, 0.22, accentM, 0, 0, 0);
  const jaw = box(0.15, 0.06, 0.18, plateM, 0, -0.11, 0.02);
  const visor = box(0.16, 0.05, 0.025, visorM, 0, 0.01, 0.12);
  for (const side of [-1, 1]) {
    const fin = box(0.022, 0.22, 0.02, trimM, side * 0.08, 0.18, 0.06, 0.2);
    fin.rotation.z = side * 0.8;
    fin.rotation.x = -0.18;
    const cheek = box(0.045, 0.12, 0.14, plateM, side * 0.12, -0.02, 0.03);
    head.add(fin, cheek);
  }
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.032, 0), hotM);
  gem.position.set(0, 0.14, 0.1);
  const monocle = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.016, 6, 14), visorM);
  monocle.position.set(-0.07, 0.02, 0.12);
  const crest = box(0.045, 0.12, 0.28, violetM, 0, 0.14, -0.08);
  crest.rotation.x = 0.4;
  const crestTip = box(0.03, 0.04, 0.06, hotM, 0, 0.2, -0.2, 0.25);
  head.add(skull, jaw, visor, gem, monocle, crest, crestTip);
  body.add(head);

  // Fold-panel morph backpack
  const pack = box(0.28, 0.3, 0.15, plateM, 0, 1.04, -0.22);
  const packCore = box(0.1, 0.2, 0.035, trimM, 0, 1.04, -0.3);
  const foldL = box(0.1, 0.22, 0.04, plateHiM, -0.16, 1.04, -0.18, 0.14);
  foldL.rotation.y = 0.35;
  const foldR = box(0.1, 0.22, 0.04, plateHiM, 0.16, 1.04, -0.18, 0.14);
  foldR.rotation.y = -0.35;
  const foldRing = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.015, 6, 14), violetM);
  foldRing.position.set(0, 1.04, -0.28);
  body.add(pack, packCore, foldL, foldR, foldRing);
  const glows = [];
  for (const side of [-1, 1]) {
    const nozzle = cyl(0.065, 0.09, 0.14, darkM, 10);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(side * 0.1, 0.94, -0.34);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 8), hotM);
    flame.rotation.x = -Math.PI / 2;
    flame.position.set(side * 0.1, 0.94, -0.48);
    body.add(nozzle, flame);
    glows.push(flame);
  }

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.6, 36),
    new THREE.MeshBasicMaterial({ color: cfg.trim, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.03;
  root.add(halo);
  root.scale.setScalar(1.1);
  attachCommon(root, body, mats, cfg, 'prototype', { thighs, shins, foots, arms, fists, pads, head, glows, halo });
  return root;
}

/**
 * Stylised Japanese-anime mecha frame (gundam-ish language: V-fin, pauldrons, skirt armour,
 * backpack thrusters, separate head/visor). Fan-style silhouette only — no specific design.
 *   cfg.id: horn | heavy | prototype   cfg colours: plate / accent / trim / hot / visor
 */
export function buildPlayerMech(cfg) {
  const root = new THREE.Group();
  const id = cfg.model || cfg.id;
  const mats = makeMats(cfg, id);
  const body = new THREE.Group();
  body.name = 'body';
  root.add(body);

  if (id === 'horn') return buildHorn(cfg, root, body, mats);
  if (id === 'heavy') return buildHeavy(cfg, root, body, mats);
  if (id === 'prototype') return buildPrototype(cfg, root, body, mats);

  // Fallback: treat unknown as horn palette with generic stub (should not happen)
  return buildHorn(cfg, root, body, mats);
}
