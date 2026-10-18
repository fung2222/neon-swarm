import * as THREE from 'three';
import { ARENA, PLAYER } from './config.js';

const mat = (c, e = 0.7) => new THREE.MeshStandardMaterial({
  color: c, emissive: c, emissiveIntensity: e, roughness: 0.35, metalness: 0.4,
});

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

    this.player = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.35, 4, 8), mat(0xff2bd6, 0.85));
    body.position.y = 0.45;
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), mat(0x00e5ff, 1.2));
    core.position.y = 0.55;
    this.player.add(body, core);
    this.playerBody = body;
    this.playerCore = core;
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

  sync(game) {
    this.player.position.set(game.px, 0, game.pz);
    const blink = game.invuln > 0 && (game.invuln * 20) % 2 < 1;
    this.playerBody.material.emissiveIntensity = blink ? 0.15 : (game.hitFlash > 0 ? 1.6 : 0.85);
    this.playerCore.material.emissiveIntensity = game.hitFlash > 0 ? 2 : 1.2;

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
