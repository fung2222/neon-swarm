import * as THREE from 'three';
import { ARENA } from './config.js';

const mat = (c, e = 0.7) => new THREE.MeshStandardMaterial({
  color: c, emissive: c, emissiveIntensity: e, roughness: 0.35, metalness: 0.4,
});

/** Cyberpunk hover-mech / runner silhouette — readable from high iso / top-down. */
function buildPlayerSilhouette() {
  const root = new THREE.Group();
  const hull = mat(0xff2bd6, 0.85);
  const armor = new THREE.MeshStandardMaterial({
    color: 0x1a0a2e, emissive: 0x3a1050, emissiveIntensity: 0.55, roughness: 0.45, metalness: 0.65,
  });
  const glass = mat(0x00e5ff, 1.15);
  const accent = mat(0x7ad7ff, 1.0);
  const thruster = mat(0xffe600, 1.35);
  const edge = mat(0xff2bd6, 1.05);

  // Elongated chassis (forward = -Z so nose points toward default fire dir)
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.78), armor);
  chassis.position.set(0, 0.28, 0);
  root.add(chassis);

  // Magenta neon under-rail
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.06, 0.72), hull);
  rail.position.set(0, 0.16, 0.02);
  root.add(rail);

  // Pointy nose / plow
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 4), hull);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0.3, -0.55);
  root.add(nose);

  // Cockpit canopy (cyan glass dome)
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), glass);
  canopy.position.set(0, 0.46, -0.08);
  canopy.scale.set(1.15, 0.85, 1.35);
  root.add(canopy);

  // Pilot head hint (small sphere — anime-ish from iso)
  const pilot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), accent);
  pilot.position.set(0, 0.52, -0.06);
  root.add(pilot);

  // Shoulder pauldrons
  const pauldronGeo = new THREE.BoxGeometry(0.16, 0.14, 0.28);
  const pL = new THREE.Mesh(pauldronGeo, hull);
  pL.position.set(-0.34, 0.38, 0.02);
  pL.rotation.z = 0.25;
  const pR = new THREE.Mesh(pauldronGeo, hull);
  pR.position.set(0.34, 0.38, 0.02);
  pR.rotation.z = -0.25;
  root.add(pL, pR);

  // Side wing fins (sweep back) — silhouette width for top-down
  const finGeo = new THREE.BoxGeometry(0.55, 0.04, 0.22);
  const finL = new THREE.Mesh(finGeo, edge);
  finL.position.set(-0.38, 0.24, 0.12);
  finL.rotation.set(0.1, 0.35, -0.35);
  const finR = new THREE.Mesh(finGeo, edge);
  finR.position.set(0.38, 0.24, 0.12);
  finR.rotation.set(0.1, -0.35, 0.35);
  root.add(finL, finR);

  // Outer fin neon tips
  const tipGeo = new THREE.BoxGeometry(0.08, 0.05, 0.28);
  const tipL = new THREE.Mesh(tipGeo, glass);
  tipL.position.set(-0.58, 0.26, 0.22);
  tipL.rotation.y = 0.4;
  const tipR = new THREE.Mesh(tipGeo, glass);
  tipR.position.set(0.58, 0.26, 0.22);
  tipR.rotation.y = -0.4;
  root.add(tipL, tipR);

  // Spine antenna / sensor mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.38, 6), accent);
  mast.position.set(0, 0.62, 0.12);
  root.add(mast);
  const mastTip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), thruster);
  mastTip.position.set(0, 0.82, 0.12);
  root.add(mastTip);

  // Rear thruster pods
  const thrGeo = new THREE.CylinderGeometry(0.08, 0.11, 0.22, 8);
  const thrL = new THREE.Mesh(thrGeo, armor);
  thrL.rotation.x = Math.PI / 2;
  thrL.position.set(-0.16, 0.26, 0.48);
  const thrR = new THREE.Mesh(thrGeo, armor);
  thrR.rotation.x = Math.PI / 2;
  thrR.position.set(0.16, 0.26, 0.48);
  root.add(thrL, thrR);

  const glowGeo = new THREE.SphereGeometry(0.09, 8, 8);
  const glowL = new THREE.Mesh(glowGeo, thruster);
  glowL.position.set(-0.16, 0.26, 0.6);
  const glowR = new THREE.Mesh(glowGeo, thruster);
  glowR.position.set(0.16, 0.26, 0.6);
  root.add(glowL, glowR);

  // Soft ground halo (subtle — not the main body)
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.22, 0.48, 24),
    new THREE.MeshBasicMaterial({ color: 0xff2bd6, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.04;
  root.add(halo);

  root.userData.hullMats = [hull, edge];
  root.userData.coreMats = [glass, accent];
  root.userData.thrusterMats = [thruster];
  root.userData.glowL = glowL;
  root.userData.glowR = glowR;
  root.userData.halo = halo;
  return root;
}

export class View {
  constructor(stage) {
    this.stage = stage;
    this.group = new THREE.Group();
    stage.scene.add(this.group);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(ARENA.half + 0.4, 48),
      new THREE.MeshStandardMaterial({ color: 0x0a0520, emissive: 0x12083a, emissiveIntensity: 0.35, roughness: 0.8, metalness: 0.2 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = ARENA.floorY;
    this.group.add(floor);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(ARENA.half - 0.05, ARENA.half + 0.12, 64),
      mat(0x00e5ff, 0.9)
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    this.group.add(ring);

    const grid = new THREE.GridHelper(ARENA.half * 2, 16, 0xff2bd6, 0x1a1040);
    grid.position.y = 0.03;
    grid.material.opacity = 0.35;
    grid.material.transparent = true;
    this.group.add(grid);

    this.player = buildPlayerSilhouette();
    // Compat aliases for hit-flash (legacy body/core names)
    this.playerBody = { material: this.player.userData.hullMats[0] };
    this.playerCore = { material: this.player.userData.coreMats[0] };
    this._facing = Math.PI; // nose toward -Z initially
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
  }

  setVisible(on) { this.group.visible = !!on; }

  _take(pool, parent, make) {
    let m = pool.pop();
    if (!m) { m = make(); parent.add(m); }
    m.visible = true;
    return m;
  }
  _recycle(pool, parent) {
    while (parent.children.length) {
      const c = parent.children.pop();
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

  _setEmissive(mats, base, flash) {
    for (const m of mats) m.emissiveIntensity = flash;
  }

  sync(game) {
    this.player.position.set(game.px, 0, game.pz);

    // Face move dir, else nearest foe, else keep last facing
    let tx = game.vx, tz = game.vz;
    if (Math.hypot(tx, tz) < 0.08 && game.enemies.length) {
      const e = game.enemies.reduce((best, cur) => {
        const d = Math.hypot(cur.x - game.px, cur.z - game.pz);
        return !best || d < best.d ? { d, e: cur } : best;
      }, null);
      if (e) { tx = e.e.x - game.px; tz = e.e.z - game.pz; }
    }
    if (Math.hypot(tx, tz) > 0.08) {
      // Nose is local -Z; rotY(atan2(tx,tz)+π) aims that axis at (tx,tz).
      const want = Math.atan2(tx, tz) + Math.PI;
      let d = want - this._facing;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this._facing += d * 0.22;
    }
    this.player.rotation.y = this._facing;
    // Slight bank into turn / move
    const bank = THREE.MathUtils.clamp(-game.vx * 0.35, -0.28, 0.28);
    this.player.rotation.z += (bank - this.player.rotation.z) * 0.15;
    this.player.rotation.x = Math.hypot(game.vx, game.vz) > 0.1 ? -0.08 : 0;

    const blink = game.invuln > 0 && (game.invuln * 20) % 2 < 1;
    const hit = game.hitFlash > 0;
    const hullE = blink ? 0.12 : (hit ? 1.7 : 0.85);
    const coreE = blink ? 0.2 : (hit ? 2.1 : 1.15);
    const thrE = blink ? 0.2 : (hit ? 2 : (1.1 + Math.hypot(game.vx, game.vz) * 0.45));
    this._setEmissive(this.player.userData.hullMats, 0.85, hullE);
    this._setEmissive(this.player.userData.coreMats, 1.15, coreE);
    this._setEmissive(this.player.userData.thrusterMats, 1.35, thrE);
    // Keep aliases in sync for any external reads
    this.playerBody.material.emissiveIntensity = hullE;
    this.playerCore.material.emissiveIntensity = coreE;

    const move = Math.hypot(game.vx, game.vz);
    const halo = this.player.userData.halo;
    if (halo) halo.material.opacity = 0.28 + move * 0.12;

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
      const m = this._take(this._ePool, this.enemyG, () => {
        const g = new THREE.Group();
        const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), mat(0x00e5ff, 0.8));
        g.add(mesh);
        g.userData.mesh = mesh;
        return g;
      });
      m.position.set(e.x, e.r, e.z);
      const mesh = m.userData.mesh;
      mesh.material.color.setHex(e.color);
      mesh.material.emissive.setHex(e.color);
      mesh.material.emissiveIntensity = e.hit > 0 ? 1.5 : (e.slow > 0 ? 0.45 : 0.75);
      const s = e.type === 'tank' ? 1.35 : e.type === 'splitter' ? 1.1 : e.type === 'swarmling' ? 0.55 : 0.85;
      mesh.scale.setScalar(s);
      mesh.rotation.y += 0.03;
    }

    this._recycle(this._bPool, this.bulletG);
    for (const b of game.bullets) {
      const m = this._take(this._bPool, this.bulletG, () => new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat(0x00e5ff, 1.4)));
      m.position.set(b.x, 0.45, b.z);
      m.material.color.setHex(b.frost ? 0x7ad7ff : 0x00e5ff);
      m.material.emissive.setHex(b.frost ? 0x7ad7ff : 0x00e5ff);
    }

    this._recycle(this._gPool, this.gemG);
    for (const g of game.gems) {
      const m = this._take(this._gPool, this.gemG, () => new THREE.Mesh(new THREE.TetrahedronGeometry(0.16), mat(0x3bff8a, 1.1)));
      const pop = g.pop > 0 ? 1 + g.pop * 1.5 : 1;
      m.position.set(g.x, 0.25, g.z);
      m.scale.setScalar(pop);
      m.rotation.y += 0.08;
    }

    this._recycle(this._oPool, this.orbitG);
    if (game.orbits > 0) {
      const R = 1.35;
      for (let o = 0; o < game.orbits; o++) {
        const ang = game.t * 3.2 + (o / game.orbits) * Math.PI * 2;
        const m = this._take(this._oPool, this.orbitG, () => new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.45), mat(0xffe600, 1.2)));
        m.position.set(game.px + Math.cos(ang) * R, 0.5, game.pz + Math.sin(ang) * R);
        m.rotation.y = -ang;
      }
    }
  }

  frameCamera(cam, game, dt) {
    const tx = game.px * 0.35;
    const tz = game.pz * 0.35 + 11;
    const ty = 13.5;
    cam.position.x += (tx - cam.position.x) * Math.min(1, dt * 4);
    cam.position.y += (ty - cam.position.y) * Math.min(1, dt * 4);
    cam.position.z += (tz - cam.position.z) * Math.min(1, dt * 4);
    cam.lookAt(game.px * 0.2, 0.5, game.pz * 0.2);
  }
}
