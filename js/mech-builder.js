/**
 * Procedural player mech mesh — sole visual identity for select + sprite bake.
 * Imported by view.js (select/in-game 3D) and tools/bake-mech-sprites.mjs (via capture page).
 *
 * horn (v0.9.194 HORN-MESH-MATCH-001): rebuild to Roy-approved charcoal+cyan slender
 * swordsman silhouette (sword-mech-sideview-approved.jpg / roy-approved-ref.jpg).
 * Matte charcoal plates, cyan neon edge trim, slender athletic limbs, swept-back
 * crest/horn, cyan visor slit, sharp geometric plates, circular joint hinges.
 * Identity cues kept: single crest, cyan chest personality core, mid rifle.
 * NO purple/violet block read. Interim for Roy 肉眼 — NOT §9 / device-final lock.
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
  // Horn: matte charcoal plates + cyan neon (approved sword-mech ref). No purple.
  const plateM = new THREE.MeshStandardMaterial({
    color: cfg.plate,
    emissive: horn ? 0x0c1018 : cfg.plate,
    emissiveIntensity: horn ? 0.06 : heavy ? 0.12 : 0.22,
    roughness: horn ? 0.62 : heavy ? 0.28 : 0.4,
    metalness: horn ? 0.42 : heavy ? 0.72 : 0.58,
  });
  const plateHiM = new THREE.MeshStandardMaterial({
    color: horn ? 0x2a303a : heavy ? 0xf8f2f6 : cfg.plate,
    emissive: horn ? 0x141820 : heavy ? 0xe8dce6 : cfg.plate,
    emissiveIntensity: horn ? 0.08 : heavy ? 0.1 : 0.24,
    roughness: horn ? 0.55 : 0.3,
    metalness: horn ? 0.48 : 0.7,
  });
  const accentM = new THREE.MeshStandardMaterial({
    color: horn ? 0x1e242e : cfg.accent,
    emissive: horn ? 0x10141c : heavy ? 0xff9ec8 : cfg.accent,
    emissiveIntensity: horn ? 0.1 : heavy ? 0.18 : 0.35,
    roughness: horn ? 0.58 : 0.36,
    metalness: horn ? 0.4 : 0.55,
  });
  // violetM kept as name for heavy/proto; horn remaps to cyan edge line (not purple)
  const violetM = new THREE.MeshStandardMaterial({
    color: horn ? 0x00c8e0 : heavy ? 0xff7ab0 : 0x5cff8a,
    emissive: horn ? 0x00e5ff : heavy ? 0xff7ab0 : 0x3cff6a,
    emissiveIntensity: horn ? 0.85 : heavy ? 0.28 : 0.32,
    roughness: horn ? 0.28 : 0.34,
    metalness: horn ? 0.25 : 0.45,
  });
  const trimM = new THREE.MeshStandardMaterial({
    color: cfg.trim,
    emissive: cfg.trim,
    emissiveIntensity: horn ? 1.35 : heavy ? 0.95 : 1.05,
    roughness: 0.22,
    metalness: 0.28,
  });
  const hotM = new THREE.MeshStandardMaterial({
    color: cfg.hot,
    emissive: cfg.hot,
    emissiveIntensity: horn ? 1.9 : heavy ? 1.4 : 1.55,
    roughness: 0.14,
    metalness: 0.1,
  });
  const visorM = new THREE.MeshStandardMaterial({
    color: cfg.visor,
    emissive: cfg.visor,
    emissiveIntensity: horn ? 2.1 : heavy ? 1.5 : 1.7,
    roughness: 0.12,
  });
  const darkM = new THREE.MeshStandardMaterial({
    color: heavy ? 0x2a1e28 : 0x080a10,
    emissive: heavy ? 0x1a1018 : 0x0a0c12,
    emissiveIntensity: 0.12,
    roughness: 0.72,
    metalness: 0.55,
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
  // violetM = cyan edge line for horn (see makeMats). Charcoal+cyan approved silhouette.
  const thighs = [];
  const shins = [];
  const foots = [];
  const arms = [];
  const fists = [];
  const pads = [];

  function hingeRing(r, tube, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 16), mat);
    ring.position.set(x, y, z);
    ring.rotation.set(rx, ry, rz);
    return ring;
  }

  // ---- slender athletic legs + circular knee/ankle hinges ----
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.11, 0.98, 0);
    // long thin thigh
    const thigh = slab(0.065, 0.09, 0.52, 0.08, plateM);
    thigh.position.set(0, -0.28, 0.005);
    const thighEdge = box(0.012, 0.4, 0.012, violetM, side * 0.038, -0.26, 0.042, 0.3);
    const thighPlate = box(0.06, 0.18, 0.018, plateHiM, 0, -0.2, 0.048, 0.18);
    // exposed joint cabling vibe at hip
    const hipCable = box(0.018, 0.06, 0.018, darkM, 0, -0.02, 0, 0.35);
    const hipHinge = hingeRing(0.032, 0.008, trimM, 0, -0.02, 0.01, Math.PI / 2, 0, 0);
    // knee circular hinge
    const knee = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.045, 12), darkM);
    knee.rotation.z = Math.PI / 2;
    knee.position.set(0, -0.56, 0.02);
    const kneeRing = hingeRing(0.042, 0.007, trimM, 0, -0.56, 0.02, 0, 0, Math.PI / 2);
    const kneeCap = box(0.05, 0.028, 0.022, plateHiM, 0, -0.56, 0.055, 0.22);
    // long thin shin
    const shin = slab(0.082, 0.052, 0.58, 0.072, plateM);
    shin.position.set(0, -0.88, 0.01);
    const shinEdge = box(0.01, 0.42, 0.01, violetM, side * 0.035, -0.86, 0.04, 0.3);
    const shinFront = box(0.048, 0.32, 0.016, plateHiM, 0, -0.84, 0.045, 0.2);
    const shinPanel = box(0.032, 0.08, 0.012, trimM, 0, -0.72, 0.055, 0.3);
    const calf = box(0.05, 0.22, 0.018, plateHiM, 0, -0.95, -0.04, 0.18);
    // ankle hinge + pointed foot
    const ankle = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.032, 10), darkM);
    ankle.rotation.z = Math.PI / 2;
    ankle.position.set(0, -1.18, 0.015);
    const ankleRing = hingeRing(0.028, 0.006, trimM, 0, -1.18, 0.015, 0, 0, Math.PI / 2);
    const foot = slab(0.05, 0.095, 0.04, 0.22, accentM);
    foot.position.set(0, -1.22, -0.01);
    const toe = box(0.04, 0.018, 0.055, trimM, 0, -1.225, -0.12, 0.28);
    const heelGlow = box(0.032, 0.012, 0.018, trimM, 0, -1.24, 0.08, 0.3);
    leg.add(
      thigh, thighEdge, thighPlate, hipCable, hipHinge,
      knee, kneeRing, kneeCap,
      shin, shinEdge, shinFront, shinPanel, calf,
      ankle, ankleRing, foot, toe, heelGlow
    );
    body.add(leg);
    thighs.push(leg);
    shins.push(shin);
    foots.push(foot);
  }

  // ---- narrow waist + light skirt plates ----
  const waist = box(0.14, 0.07, 0.1, darkM, 0, 1.02, 0, 0.16);
  const belt = box(0.18, 0.018, 0.11, trimM, 0, 1.05, 0.01, 0.28);
  const pelvisPlate = slab(0.15, 0.12, 0.055, 0.085, plateHiM);
  pelvisPlate.position.set(0, 1.07, 0.015);
  body.add(waist, belt, pelvisPlate);
  for (const side of [-1, 1]) {
    const skirt = slab(0.07, 0.045, 0.28, 0.05, accentM);
    skirt.position.set(side * 0.1, 0.9, 0.02);
    skirt.rotation.z = side * 0.18;
    const skirtEdge = box(0.01, 0.22, 0.01, violetM, side * 0.14, 0.88, 0.04, 0.3);
    body.add(skirt, skirtEdge);
  }
  const frontSkirt = slab(0.09, 0.12, 0.18, 0.04, plateM);
  frontSkirt.position.set(0, 0.9, 0.07);
  const frontLip = box(0.085, 0.012, 0.01, trimM, 0, 0.98, 0.095, 0.3);
  body.add(frontSkirt, frontLip);

  // ---- slender chest wedge + cyan core ----
  const chest = slab(0.17, 0.13, 0.4, 0.11, accentM);
  chest.position.set(0, 1.32, 0);
  const chestPlate = slab(0.13, 0.1, 0.32, 0.05, plateM);
  chestPlate.position.set(0, 1.32, 0.08);
  const reactor = box(0.08, 0.08, 0.035, hotM, 0, 1.3, 0.12, 0.16);
  reactor.scale.set(1.25, 1.25, 1.3);
  reactor.name = 'personalityCore';
  const collar = box(0.14, 0.03, 0.09, plateM, 0, 1.54, -0.005, 0.16);
  const neck = cyl(0.028, 0.036, 0.07, darkM, 10);
  neck.position.set(0, 1.59, 0);
  const coreBay = box(0.1, 0.1, 0.02, darkM, 0, 1.3, 0.1, 0.14);
  const pecL = box(0.05, 0.14, 0.022, plateHiM, -0.065, 1.36, 0.105, 0.18);
  const pecR = box(0.05, 0.14, 0.022, plateHiM, 0.065, 1.36, 0.105, 0.18);
  const seamH = box(0.11, 0.01, 0.01, trimM, 0, 1.3, 0.135, 0.32);
  const seamV = box(0.01, 0.11, 0.01, trimM, 0, 1.3, 0.135, 0.32);
  const collarLip = box(0.12, 0.012, 0.022, violetM, 0, 1.555, 0.035, 0.28);
  const sidePlateL = box(0.018, 0.28, 0.07, plateHiM, -0.1, 1.32, 0, 0.16);
  const sidePlateR = box(0.018, 0.28, 0.07, plateHiM, 0.1, 1.32, 0, 0.16);
  const abPlate = slab(0.1, 0.115, 0.1, 0.04, plateHiM);
  abPlate.position.set(0, 1.1, 0.07);
  const coreGlow = new THREE.Mesh(new THREE.OctahedronGeometry(0.048, 0), hotM);
  coreGlow.position.set(0, 1.3, 0.145);
  coreGlow.name = 'personalityCoreGlow';
  const coreRing = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.008, 6, 16), trimM);
  coreRing.position.set(0, 1.3, 0.13);
  body.add(
    chest, chestPlate, reactor, collar, neck, coreBay, pecL, pecR,
    seamH, seamV, collarLip, sidePlateL, sidePlateR, abPlate, coreGlow, coreRing
  );
  for (const side of [-1, 1]) {
    const vent = box(0.012, 0.07, 0.01, trimM, side * 0.035, 1.3, 0.13, 0.3);
    body.add(vent);
  }

  // ---- sharp upward triangular pauldrons ----
  for (const side of [-1, 1]) {
    const pad = new THREE.Group();
    const asym = side < 0 ? 1.08 : 1.0;
    pad.position.set(side * 0.15, 1.48, 0.01);
    // triangular upward pauldron: wide base → point up
    const cap = slab(0.03 * asym, 0.1 * asym, 0.16 * asym, 0.11 * asym, accentM);
    const rim = box(0.08 * asym, 0.01, 0.1 * asym, trimM, 0, 0.02, 0.02, 0.28);
    const spike = box(0.022, 0.18 * asym, 0.022, plateHiM, 0, 0.14, 0, 0.18);
    const spikeEdge = box(0.01, 0.14 * asym, 0.01, violetM, side * 0.012, 0.13, 0.02, 0.28);
    const glowStrip = box(0.01, 0.01, 0.07 * asym, trimM, 0, 0.05, 0.02, 0.32);
    const under = box(0.04 * asym, 0.028, 0.05 * asym, darkM, 0, -0.03, 0, 0.2);
    const shHinge = hingeRing(0.03, 0.007, trimM, 0, -0.045, 0, Math.PI / 2, 0, 0);
    pad.add(cap, rim, spike, spikeEdge, glowStrip, under, shHinge);
    pad.rotation.z = side * -0.38;
    body.add(pad);
    pads.push(pad);
  }

  // ---- slender arms + mid rifle + elbow hinges ----
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.17, 1.42, 0);
    const upper = slab(0.048, 0.062, 0.42, 0.052, darkM);
    upper.position.set(0, -0.24, 0);
    const armSeam = box(0.01, 0.28, 0.01, trimM, side * 0.028, -0.22, 0.028, 0.32);
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), darkM);
    elbow.position.set(0, -0.48, 0);
    const elbowRing = hingeRing(0.036, 0.006, trimM, 0, -0.48, 0, 0, 0, Math.PI / 2);
    const fore = slab(0.072, 0.048, 0.44, 0.06, plateM);
    fore.position.set(side * 0.008, -0.74, 0.01);
    const forePlate = box(0.048, 0.28, 0.016, plateHiM, side * 0.008, -0.74, 0.04, 0.2);
    const vambrace = box(0.014, 0.24, 0.012, violetM, side * 0.03, -0.74, 0.045, 0.28);
    const fist = box(0.05, 0.05, 0.05, accentM, side * 0.008, -1.0, 0.015, 0.16);
    const fistTip = box(0.035, 0.018, 0.02, trimM, side * 0.008, -1.02, 0.04, 0.3);
    arm.add(upper, armSeam, elbow, elbowRing, fore, forePlate, vambrace, fist, fistTip);
    if (side > 0) {
      const rifle = new THREE.Group();
      rifle.name = 'rifle';
      const stock = box(0.028, 0.045, 0.09, darkM, 0, -0.82, -0.03);
      const receiver = box(0.045, 0.05, 0.16, plateHiM, 0, -0.8, 0.1);
      const mag = box(0.022, 0.08, 0.04, accentM, 0, -0.92, 0.055);
      const barrel = cyl(0.012, 0.018, 0.42, darkM, 10);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, -0.8, 0.36);
      const shroud = box(0.028, 0.028, 0.11, plateM, 0, -0.8, 0.26, 0.18);
      const rail = box(0.014, 0.01, 0.16, trimM, 0, -0.74, 0.12);
      const tip = cyl(0.01, 0.01, 0.045, hotM, 10);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(0, -0.8, 0.55);
      tip.name = 'muzzle';
      const optic = box(0.014, 0.02, 0.04, violetM, 0, -0.72, 0.04, 0.25);
      rifle.add(stock, receiver, mag, barrel, shroud, rail, tip, optic);
      arm.add(rifle);
    }
    body.add(arm);
    arms.push(arm);
    fists.push(fist);
  }

  // ---- head: elongated helm + cyan visor slit + SWEPT-BACK crest ----
  const head = new THREE.Group();
  head.position.set(0, 1.74, 0);
  // slight forward lean of helm only (crest stays rear-biased in world)
  const skull = box(0.1, 0.08, 0.15, accentM, 0, 0.015, 0.0, 0.12);
  skull.rotation.x = -0.1;
  const jaw = box(0.068, 0.026, 0.09, plateM, 0, -0.048, 0.035, 0.14);
  const chin = box(0.036, 0.018, 0.035, plateHiM, 0, -0.065, 0.075, 0.2);
  const visor = box(0.088, 0.012, 0.012, visorM, 0, 0.018, 0.088, 0.18);
  const visorBar = box(0.098, 0.007, 0.014, visorM, 0, 0.018, 0.092, 0.22);
  const helmPlate = box(0.092, 0.028, 0.11, plateHiM, 0, 0.05, -0.02, 0.14);
  const brow = box(0.092, 0.01, 0.03, plateHiM, 0, 0.042, 0.055, 0.18);
  head.add(skull, jaw, chin, visor, visorBar, helmPlate, brow);
  for (const side of [-1, 1]) {
    const cheek = box(0.018, 0.055, 0.085, plateM, side * 0.052, -0.01, 0.015, 0.14);
    head.add(cheek);
  }
  // SWEPT-BACK crest — tip must read behind the skull (approved sideview)
  // Build as a Group parented at crown-rear, rotated so long axis goes up+back.
  const crest = new THREE.Group();
  crest.position.set(0, 0.07, -0.06);
  // Negative Rx: local +Y tip sweeps toward -Z (rear) — approved swept-back crest
  crest.rotation.x = -0.72;
  const crestRoot = box(0.05, 0.04, 0.06, plateM, 0, 0.0, 0.0, 0.14);
  // long axis = local +Y after group rot → world up-and-back
  const crestBlade = box(0.036, 0.48, 0.09, plateHiM, 0, 0.26, -0.02, 0.08);
  const crestMid = box(0.024, 0.36, 0.055, accentM, 0, 0.28, 0.02, 0.1);
  const crestEdge = box(0.01, 0.4, 0.014, violetM, 0, 0.28, 0.05, 0.25);
  const crestTip = box(0.016, 0.12, 0.04, trimM, 0, 0.52, -0.01, 0.18);
  const crestFin = box(0.008, 0.22, 0.07, plateM, 0, 0.22, -0.04, 0.2);
  crest.add(crestRoot, crestBlade, crestMid, crestEdge, crestTip, crestFin);
  head.add(crest);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.016, 0), hotM);
  gem.position.set(0, 0.048, 0.082);
  gem.name = 'coreGem';
  head.add(gem);
  body.add(head);

  // ---- slim backpack / thruster pack ----
  const pack = box(0.12, 0.28, 0.08, plateM, 0, 1.34, -0.11, 0.14);
  const packCore = box(0.04, 0.16, 0.018, trimM, 0, 1.34, -0.16, 0.24);
  const packFrame = box(0.14, 0.24, 0.025, plateHiM, 0, 1.34, -0.095, 0.14);
  body.add(pack, packCore, packFrame);
  const glows = [];
  for (const side of [-1, 1]) {
    const nozzle = cyl(0.028, 0.042, 0.08, darkM, 10);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(side * 0.05, 1.22, -0.18);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.14, 8), hotM);
    flame.rotation.x = -Math.PI / 2;
    flame.position.set(side * 0.05, 1.22, -0.28);
    const nozzleRing = cyl(0.036, 0.036, 0.014, trimM, 10);
    nozzleRing.rotation.x = Math.PI / 2;
    nozzleRing.position.set(side * 0.05, 1.22, -0.22);
    body.add(nozzle, flame, nozzleRing);
    glows.push(flame);
  }

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.22, 0.42, 36),
    new THREE.MeshBasicMaterial({ color: cfg.trim, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.03;
  root.add(halo);
  root.scale.setScalar(1.02);
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
