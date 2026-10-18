import * as THREE from 'three';
import { ARENA } from './config.js';

const mat = (c, e = 0.7) => new THREE.MeshStandardMaterial({
  color: c, emissive: c, emissiveIntensity: e, roughness: 0.35, metalness: 0.4,
});

/**
 * Fan-homage bipedal mech — purple/green cyber silhouette with horn helm.
 * Inspired by classic purple EVA aesthetics; no logos, names, or trademarks.
 * Cyan accents kept for thrusters / visor glow.
 */
function buildPlayerMech() {
  const root = new THREE.Group();
  // EVA-inspired palette: violet armor + acid green trim + cyan glow
  const violet = mat(0x8b3dff, 0.9);
  const violetDeep = new THREE.MeshStandardMaterial({
    color: 0x2a1048, emissive: 0x4a1a78, emissiveIntensity: 0.55, roughness: 0.38, metalness: 0.72,
  });
  const acid = mat(0x7cff3a, 0.95);
  const acidHot = mat(0xb8ff4a, 1.15);
  const cyan = mat(0x00e5ff, 1.05);
  const plate = violetDeep;
  const visor = mat(0x7ad7ff, 1.3);
  const joint = mat(0x5cff8a, 0.75);

  const body = new THREE.Group();
  body.name = 'body';
  root.add(body);

  // ---- Legs (grouped for walk cycle)
  const thighs = [];
  const shins = [];
  const foots = [];
  const thighGeo = new THREE.BoxGeometry(0.18, 0.3, 0.2);
  const shinGeo = new THREE.BoxGeometry(0.15, 0.28, 0.17);
  const footGeo = new THREE.BoxGeometry(0.2, 0.09, 0.32);
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.17, 0.5, 0);
    const thigh = new THREE.Mesh(thighGeo, plate);
    thigh.position.set(0, -0.15, 0.02);
    const shin = new THREE.Mesh(shinGeo, plate);
    shin.position.set(0, -0.38, 0.04);
    // Green shin stripe
    const shinStripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.04), acid);
    shinStripe.position.set(side * 0.08, -0.38, 0.12);
    const foot = new THREE.Mesh(footGeo, violet);
    foot.position.set(0, -0.48, -0.02);
    const knee = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.15), acid);
    knee.position.set(0, -0.28, 0.07);
    leg.add(thigh, shin, shinStripe, foot, knee);
    body.add(leg);
    thighs.push(leg);
    shins.push(shin);
    foots.push(foot);
  }

  // ---- Hip / pelvis with green belt
  const hip = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.18, 0.3), plate);
  hip.position.set(0, 0.52, 0);
  body.add(hip);
  const hipNeon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.12), acid);
  hipNeon.position.set(0, 0.52, 0.14);
  body.add(hipNeon);

  // ---- Torso — broad purple chest
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.46, 0.34), plate);
  torso.position.set(0, 0.82, 0);
  body.add(torso);
  // Chest core (acid green "entry" glow)
  const core = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.09), acidHot);
  core.position.set(0, 0.84, 0.2);
  body.add(core);
  // Vertical violet + green chest lines
  const stripeV = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.4, 0.06), violet);
  stripeV.position.set(0, 0.82, 0.22);
  body.add(stripeV);
  const stripeG = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.05), acid);
  stripeG.position.set(0.12, 0.82, 0.21);
  body.add(stripeG);

  // ---- Shoulders / pauldrons (chunky purple)
  const pads = [];
  const padGeo = new THREE.BoxGeometry(0.26, 0.16, 0.32);
  for (const side of [-1, 1]) {
    const pad = new THREE.Mesh(padGeo, violet);
    pad.position.set(side * 0.38, 1.02, 0);
    pad.rotation.z = side * -0.22;
    const padTrim = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.1), acid);
    padTrim.position.set(side * 0.38, 1.08, 0.12);
    padTrim.rotation.z = side * -0.22;
    body.add(pad, padTrim);
    pads.push(pad);
  }

  // ---- Arms
  const arms = [];
  const fists = [];
  const upperGeo = new THREE.BoxGeometry(0.13, 0.3, 0.15);
  const lowerGeo = new THREE.BoxGeometry(0.12, 0.28, 0.13);
  const fistGeo = new THREE.BoxGeometry(0.15, 0.13, 0.15);
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.46, 0.96, 0);
    const upper = new THREE.Mesh(upperGeo, plate);
    upper.position.set(0, -0.15, 0);
    const lower = new THREE.Mesh(lowerGeo, plate);
    lower.position.set(side * 0.04, -0.42, 0.04);
    const fist = new THREE.Mesh(fistGeo, acid);
    fist.position.set(side * 0.04, -0.58, 0.06);
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 6), joint);
    elbow.position.set(side * 0.02, -0.3, 0.02);
    arm.add(upper, lower, fist, elbow);
    body.add(arm);
    arms.push(arm);
    fists.push(fist);
  }

  // ---- Head + horn helm (Unit-01–style silhouette: tall horn + jaw)
  const head = new THREE.Group();
  head.position.set(0, 1.18, 0);
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.28), plate);
  head.add(headMesh);
  // Jaw / chin plate
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.22), violet);
  jaw.position.set(0, -0.14, 0.04);
  head.add(jaw);
  // Helm cap
  const helm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.32), violet);
  helm.position.set(0, 0.14, 0);
  head.add(helm);
  // Visor slit (cyan)
  const vis = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.06), visor);
  vis.position.set(0, 0.02, 0.15);
  head.add(vis);
  // Green cheek marks
  for (const side of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.04), acid);
    cheek.position.set(side * 0.14, -0.02, 0.12);
    head.add(cheek);
  }
  // Primary horn (tall forward-leaning spike — signature silhouette)
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.55, 6), violet);
  horn.position.set(0, 0.42, -0.02);
  horn.rotation.x = -0.35;
  head.add(horn);
  const hornTip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 5), acidHot);
  hornTip.position.set(0, 0.68, -0.12);
  hornTip.rotation.x = -0.35;
  head.add(hornTip);
  // Side finlets (small horns)
  for (const side of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.22, 5), violet);
    fin.position.set(side * 0.14, 0.28, -0.02);
    fin.rotation.z = side * 0.55;
    fin.rotation.x = -0.2;
    head.add(fin);
  }
  body.add(head);

  // Back pack / thruster pack
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.34, 0.18), plate);
  pack.position.set(0, 0.86, -0.24);
  body.add(pack);
  const packStripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.04), acid);
  packStripe.position.set(0, 0.86, -0.34);
  body.add(packStripe);
  const thruster = cyan;
  for (const side of [-1, 1]) {
    const thr = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, 0.15, 8), plate);
    thr.rotation.x = Math.PI / 2;
    thr.position.set(side * 0.11, 0.8, -0.34);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), thruster);
    glow.position.set(side * 0.11, 0.8, -0.42);
    body.add(thr, glow);
    if (side < 0) root.userData.glowL = glow; else root.userData.glowR = glow;
  }

  // Soft ground halo (violet + cyan mix feel via violet)
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.58, 28),
    new THREE.MeshBasicMaterial({ color: 0x8b3dff, transparent: true, opacity: 0.34, side: THREE.DoubleSide })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.03;
  root.add(halo);

  root.userData.hullMats = [violet, acid, acidHot];
  root.userData.coreMats = [visor, thruster, acidHot];
  root.userData.thrusterMats = [thruster];
  root.userData.halo = halo;
  root.userData.plate = plate;
  root.userData.body = body;
  root.userData.legs = thighs;
  root.userData.shins = shins;
  root.userData.foots = foots;
  root.userData.arms = arms;
  root.userData.fists = fists;
  root.userData.head = head;
  root.userData.pads = pads;
  root.userData.animPhase = 0;
  root.userData.idlePhase = 0;
  root.scale.setScalar(1.18);
  return root;
}

/** Enemy robot / mech silhouettes — not pure primitives. */
function enemyMeshFor(type, color) {
  const g = new THREE.Group();
  const hull = mat(color, 0.8);
  const trim = mat(color, 1.05);
  const dark = new THREE.MeshStandardMaterial({
    color: 0x0c0818, emissive: color, emissiveIntensity: 0.25, roughness: 0.5, metalness: 0.55,
  });
  let mesh;

  if (type === 'tank') {
    // Heavy biped: wide torso, stubby legs, shoulder cannons
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.5, 0.5), hull);
    torso.position.y = 0.15;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.28), dark);
    head.position.set(0, 0.48, 0.05);
    const vis = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.05), trim);
    vis.position.set(0, 0.5, 0.2);
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 0.24), dark);
      leg.position.set(side * 0.22, -0.25, 0);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.32), hull);
      pad.position.set(side * 0.42, 0.28, 0);
      const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.4, 6), trim);
      gun.rotation.z = Math.PI / 2;
      gun.position.set(side * 0.55, 0.28, 0.1);
      g.add(leg, pad, gun);
    }
    g.add(torso, head, vis);
    mesh = torso;
  } else if (type === 'splitter') {
    // Twin-head / dual-torso mech that reads as "about to split"
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.28, 0.3), dark);
    base.position.y = -0.05;
    for (const side of [-1, 1]) {
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.4, 0.28), hull);
      torso.position.set(side * 0.22, 0.25, 0);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.18), trim);
      head.position.set(side * 0.22, 0.52, 0.04);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.32, 0.1), dark);
      arm.position.set(side * 0.42, 0.2, 0);
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 5), trim);
      horn.position.set(side * 0.22, 0.66, 0);
      g.add(torso, head, arm, horn);
    }
    const link = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.12), trim);
    link.position.set(0, 0.3, 0);
    g.add(base, link);
    mesh = base;
  } else if (type === 'swarmling') {
    // Tiny scout drone-mech: compact body + thruster + antenna
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.32), hull);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.16), dark);
    head.position.set(0, 0.14, 0.1);
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.04), trim);
    eye.position.set(0, 0.16, 0.18);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.22, 5), trim);
    ant.position.set(0.05, 0.28, 0.08);
    const thr = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), trim);
    thr.position.set(0, 0, -0.2);
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.12), dark);
      wing.position.set(side * 0.22, 0.02, -0.02);
      wing.rotation.z = side * 0.3;
      g.add(wing);
    }
    g.add(body, head, eye, ant, thr);
    mesh = body;
  } else {
    // runner — lean chase biped with blade arms
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.26), hull);
    torso.position.y = 0.08;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.2), dark);
    head.position.set(0, 0.4, 0.02);
    const vis = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.04), trim);
    vis.position.set(0, 0.42, 0.12);
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.2, 5), trim);
    crest.position.set(0, 0.55, -0.02);
    crest.rotation.x = -0.25;
    for (const side of [-1, 1]) {
      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.12), dark);
      thigh.position.set(side * 0.12, -0.22, 0);
      const shin = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.22, 0.1), dark);
      shin.position.set(side * 0.12, -0.42, 0.02);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.08), hull);
      arm.position.set(side * 0.24, 0.1, 0);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.28), trim);
      blade.position.set(side * 0.28, -0.05, 0.12);
      g.add(thigh, shin, arm, blade);
    }
    g.add(torso, head, vis, crest);
    mesh = torso;
  }

  g.userData.mesh = mesh;
  g.userData.type = type;
  return g;
}

function gemMesh() {
  // Crystal XP gem — distinct green octahedron
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), mat(0x3bff8a, 1.2));
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.03, 6, 16),
    mat(0x7affc0, 1.0)
  );
  ring.rotation.x = Math.PI / 2;
  g.add(core, ring);
  g.userData.mesh = core;
  return g;
}

function buildObstacles(parent) {
  const group = new THREE.Group();
  parent.add(group);
  const crateMat = new THREE.MeshStandardMaterial({
    color: 0x141a2c, emissive: 0x182038, emissiveIntensity: 0.28, roughness: 0.6, metalness: 0.3,
  });
  const edgeMat = mat(0x3a6a9a, 0.35);
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x101624, emissive: 0x141e32, emissiveIntensity: 0.25, roughness: 0.65, metalness: 0.25,
  });
  const debrisMat = new THREE.MeshStandardMaterial({
    color: 0x1a2240, emissive: 0x243058, emissiveIntensity: 0.3, roughness: 0.55, metalness: 0.35,
  });

  // Deterministic-ish scatter of low props (no tall buildings)
  const spots = [
    [6, 4], [-8, 3], [4, -9], [-5, -7], [12, -2], [-14, 6], [9, 11], [-10, -12],
    [18, 5], [-16, -4], [2, 16], [-3, -18], [22, -10], [-20, 14], [7, -20], [-12, 20],
    [15, 18], [-18, -16], [25, 2], [-24, -8], [11, -15], [-7, 22], [20, -22], [-22, 8],
    [0, 10], [10, 0], [-10, 0], [0, -12], [14, 8], [-14, -10],
  ];
  let i = 0;
  for (const [x, z] of spots) {
    const kind = i % 5;
    if (kind === 0) {
      // Crate stack (low)
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), crateMat);
      c.position.set(x, 0.35, z);
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.06, 0.95), edgeMat);
      edge.position.set(x, 0.72, z);
      group.add(c, edge);
    } else if (kind === 1) {
      // Low wall segment
      const w = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 0.35), wallMat);
      w.position.set(x, 0.28, z);
      w.rotation.y = (i * 0.7) % Math.PI;
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.05, 0.4), edgeMat);
      top.position.copy(w.position); top.position.y = 0.58; top.rotation.y = w.rotation.y;
      group.add(w, top);
    } else if (kind === 2) {
      // Debris cluster
      for (let k = 0; k < 3; k++) {
        const d = new THREE.Mesh(new THREE.BoxGeometry(0.35 + (k % 2) * 0.2, 0.2, 0.3), debrisMat);
        d.position.set(x + (k - 1) * 0.4, 0.12, z + (k % 2) * 0.25);
        d.rotation.y = k * 0.8;
        group.add(d);
      }
    } else if (kind === 3) {
      // Barrel / drum (short)
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.65, 10), crateMat);
      b.position.set(x, 0.33, z);
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 6, 14), edgeMat);
      band.rotation.x = Math.PI / 2;
      band.position.set(x, 0.45, z);
      group.add(b, band);
    } else {
      // Low ramp / wedge debris
      const r = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.8), wallMat);
      r.position.set(x, 0.14, z);
      r.rotation.z = 0.15;
      group.add(r);
    }
    i++;
  }
  return group;
}

export class View {
  constructor(stage) {
    this.stage = stage;
    this.group = new THREE.Group();
    stage.scene.add(this.group);

    // Large open floor (square wilderness pad — not a tiny circle)
    const floorSize = ARENA.half * 2 + 4;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(floorSize, floorSize),
      new THREE.MeshStandardMaterial({
        color: 0x0a1020, emissive: 0x0e1834, emissiveIntensity: 0.55, roughness: 0.85, metalness: 0.12,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = ARENA.floorY;
    this.group.add(floor);

    // Soft edge markers (faint rings) — not a tight cage
    const softRing = new THREE.Mesh(
      new THREE.RingGeometry(ARENA.soft - 0.15, ARENA.soft + 0.08, 96),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
    );
    softRing.rotation.x = -Math.PI / 2;
    softRing.position.y = 0.04;
    this.group.add(softRing);

    const hardRing = new THREE.Mesh(
      new THREE.RingGeometry(ARENA.half - 0.1, ARENA.half + 0.06, 96),
      new THREE.MeshBasicMaterial({ color: 0xff2bd6, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
    );
    hardRing.rotation.x = -Math.PI / 2;
    hardRing.position.y = 0.05;
    this.group.add(hardRing);

    const grid = new THREE.GridHelper(floorSize, Math.floor(floorSize / 2.5), 0x00e5ff, 0x1a2850);
    grid.position.y = 0.025;
    if (Array.isArray(grid.material)) {
      for (const m of grid.material) { m.opacity = 0.35; m.transparent = true; }
    } else {
      grid.material.opacity = 0.35;
      grid.material.transparent = true;
    }
    this.group.add(grid);

    buildObstacles(this.group);

    this.player = buildPlayerMech();
    this.playerBody = { material: this.player.userData.hullMats[0] };
    this.playerCore = { material: this.player.userData.coreMats[0] };
    this._facing = Math.PI;
    this.group.add(this.player);

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
    this._gPool = [];
    this._oPool = [];
    this._zoom = 1;
  }

  setVisible(on) { this.group.visible = !!on; }

  setZoom(z) { this._zoom = z; }

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

  _setEmissive(mats, flash) {
    for (const m of mats) m.emissiveIntensity = flash;
  }

  sync(game) {
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
    this.player.rotation.y = this._facing;
    const bank = THREE.MathUtils.clamp(-game.vx * 0.25, -0.2, 0.2);
    this.player.rotation.z += (bank - this.player.rotation.z) * 0.15;
    this.player.rotation.x = Math.hypot(game.vx, game.vz) > 0.1 ? -0.05 : 0;

    const blink = game.invuln > 0 && (game.invuln * 20) % 2 < 1;
    const hit = game.hitFlash > 0;
    // Hit flash goes hotter cyan/white — never depends on red body color
    const hullE = blink ? 0.12 : (hit ? 1.8 : 0.95);
    const coreE = blink ? 0.2 : (hit ? 2.2 : 1.25);
    const thrE = blink ? 0.2 : (hit ? 2 : (1.1 + Math.hypot(game.vx, game.vz) * 0.4));
    this._setEmissive(this.player.userData.hullMats, hullE);
    this._setEmissive(this.player.userData.coreMats, coreE);
    this._setEmissive(this.player.userData.thrusterMats, thrE);
    this.playerBody.material.emissiveIntensity = hullE;
    this.playerCore.material.emissiveIntensity = coreE;

    // Damage accent: briefly tint plate emissive toward danger red ONLY on hit
    if (this.player.userData.plate) {
      if (hit) this.player.userData.plate.emissive.setHex(0xff2244);
      else this.player.userData.plate.emissive.setHex(0x4a1a78);
      this.player.userData.plate.emissiveIntensity = hit ? 0.9 : 0.5;
    }

    const move = Math.hypot(game.vx, game.vz);
    const halo = this.player.userData.halo;
    if (halo) halo.material.opacity = 0.26 + move * 0.12;

    // ---- Mech animations: walk cycle, idle hover, fire kick, hurt flinch ----
    const ud = this.player.userData;
    const dtAnim = 0.016; // sync is per-frame; phase advances with game.t
    ud.idlePhase = (game.t || 0) * 2.4;
    if (move > 0.08) ud.animPhase = (ud.animPhase || 0) + move * 0.55;
    else ud.animPhase = (ud.animPhase || 0) * 0.92;
    const walk = ud.animPhase || 0;
    const swing = Math.sin(walk) * Math.min(1, move * 1.4);
    const swingOpp = Math.sin(walk + Math.PI) * Math.min(1, move * 1.4);
    if (ud.legs && ud.legs.length === 2) {
      ud.legs[0].rotation.x = swing * 0.55;
      ud.legs[1].rotation.x = swingOpp * 0.55;
    }
    if (ud.shins && ud.shins.length === 2) {
      ud.shins[0].rotation.x = Math.max(0, -swing) * 0.35;
      ud.shins[1].rotation.x = Math.max(0, -swingOpp) * 0.35;
    }
    if (ud.foots && ud.foots.length === 2) {
      ud.foots[0].rotation.x = swing * 0.25;
      ud.foots[1].rotation.x = swingOpp * 0.25;
    }
    const fireKick = Math.max(0, game.muzzle || 0);
    const hurtKick = Math.max(0, game.hitFlash || 0);
    if (ud.arms && ud.arms.length === 2) {
      // Walk arm counter-swing + fire punch forward + hurt flinch
      ud.arms[0].rotation.x = swingOpp * 0.4 - fireKick * 1.1 - hurtKick * 0.5;
      ud.arms[1].rotation.x = swing * 0.4 - fireKick * 0.85 - hurtKick * 0.35;
      ud.arms[0].rotation.z = -0.08 + fireKick * 0.15;
      ud.arms[1].rotation.z = 0.08 - fireKick * 0.12;
    }
    if (ud.fists) {
      for (const f of ud.fists) f.scale.setScalar(1 + fireKick * 0.35);
    }
    if (ud.head) {
      ud.head.rotation.x = -fireKick * 0.12 + Math.sin(ud.idlePhase) * 0.03;
      ud.head.position.y = 1.18 + Math.sin(ud.idlePhase * 0.5) * 0.015;
    }
    if (ud.body) {
      const bob = move > 0.08
        ? Math.abs(Math.sin(walk)) * 0.06
        : Math.sin(ud.idlePhase) * 0.025;
      ud.body.position.y = bob;
      ud.body.rotation.x = move > 0.08 ? -0.04 : Math.sin(ud.idlePhase * 0.7) * 0.02;
    }
    if (ud.pads && ud.pads.length === 2) {
      ud.pads[0].rotation.z = -0.2 + Math.sin(ud.idlePhase) * 0.04;
      ud.pads[1].rotation.z = 0.2 - Math.sin(ud.idlePhase) * 0.04;
    }
    // Thruster sphere pulse when boosting / firing
    if (ud.glowL && ud.glowR) {
      const pulse = 1 + move * 0.35 + fireKick * 1.2 + Math.sin(ud.idlePhase * 2) * 0.08;
      ud.glowL.scale.setScalar(pulse);
      ud.glowR.scale.setScalar(pulse);
    }
    void dtAnim;

    if (this.novaAge >= 0) {
      this.novaAge += 0.05;
      const k = Math.min(1, this.novaAge);
      this.novaRing.position.set(game.px, 0.08, game.pz);
      this.novaRing.scale.setScalar(1 + k * (this._novaR || 2) * 4);
      this.novaRing.material.opacity = 0.85 * (1 - k);
      if (k >= 1) { this.novaAge = -1; this.novaRing.visible = false; }
    }

    this._recycle(this._ePool, this.enemyG);
    for (const e of game.enemies) {
      const m = this._take(this._ePool, this.enemyG, () => enemyMeshFor('runner', 0x00e5ff));
      // Rebuild if pooled mesh type mismatches
      if (m.userData.type !== e.type) {
        while (m.children.length) m.remove(m.children[0]);
        const fresh = enemyMeshFor(e.type, e.color);
        while (fresh.children.length) m.add(fresh.children[0]);
        m.userData.mesh = fresh.userData.mesh;
        m.userData.type = e.type;
      }
      m.position.set(e.x, e.r * 0.9, e.z);
      const glow = e.hit > 0 ? 1.5 : (e.slow > 0 ? 0.45 : 0.75);
      m.traverse((ch) => {
        if (ch.isMesh && ch.material && ch.material.emissive) {
          ch.material.color.setHex(e.color);
          ch.material.emissive.setHex(e.color);
          ch.material.emissiveIntensity = glow;
        }
      });
      m.rotation.y += e.type === 'swarmling' ? 0.08 : 0.03;
    }

    this._recycle(this._bPool, this.bulletG);
    for (const b of game.bullets) {
      const m = this._take(this._bPool, this.bulletG, () => new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat(0x00e5ff, 1.4)));
      m.position.set(b.x, 0.55, b.z);
      m.material.color.setHex(b.frost ? 0x7ad7ff : 0x00e5ff);
      m.material.emissive.setHex(b.frost ? 0x7ad7ff : 0x00e5ff);
    }

    this._recycle(this._gPool, this.gemG);
    for (const g of game.gems) {
      const m = this._take(this._gPool, this.gemG, () => gemMesh());
      const pop = g.pop > 0 ? 1 + g.pop * 1.5 : 1;
      m.position.set(g.x, 0.3, g.z);
      m.scale.setScalar(pop);
      m.rotation.y += 0.1;
    }

    this._recycle(this._oPool, this.orbitG);
    if (game.orbits > 0) {
      const R = 1.4;
      for (let o = 0; o < game.orbits; o++) {
        const ang = game.t * 3.2 + (o / game.orbits) * Math.PI * 2;
        const m = this._take(this._oPool, this.orbitG, () => new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.45), mat(0xffe600, 1.2)));
        m.position.set(game.px + Math.cos(ang) * R, 0.7, game.pz + Math.sin(ang) * R);
        m.rotation.y = -ang;
      }
    }
  }

  frameCamera(cam, game, dt) {
    // Camera tracks the player fully (iso offset) — not a weak 25% lerp to origin.
    const z = this._zoom || 1;
    const tx = game.px;
    const tz = game.pz + 12 * z;
    const ty = 14 * z;
    const k = Math.min(1, dt * 7);
    cam.position.x += (tx - cam.position.x) * k;
    cam.position.y += (ty - cam.position.y) * k;
    cam.position.z += (tz - cam.position.z) * k;
    cam.lookAt(game.px, 0.85, game.pz);
  }
}
