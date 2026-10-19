import * as THREE from 'three';
import { ARENA, ENEMIES, DROP, MECH_BY_ID } from './config.js';

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
function buildPlayerMech(cfg) {
  const root = new THREE.Group();
  const plateC = cfg.plate;
  const accentC = cfg.accent;
  const trimC = cfg.trim;
  const hotC = cfg.hot;
  const visorC = cfg.visor;

  const plate = hullMat(plateC, 0.32);
  const armour = hullMat(accentC, 0.42);
  const trim = mat(trimC, 0.95);
  const hot = mat(hotC, 1.2);
  const visor = mat(visorC, 1.35);
  const thruster = mat(cfg.trim, 1.0);
  const joint = mat(trimC, 0.7);

  const body = new THREE.Group();
  body.name = 'body';
  root.add(body);

  const horny = cfg.id !== 'heavy';
  const proto = cfg.id === 'proto';

  // ---- legs (animated groups: thighs / shins / foots)
  const thighs = [];
  const shins = [];
  const foots = [];
  const arms = [];
  const fists = [];
  const pads = [];

  const legW = horny ? 0.19 : 0.24;
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.18, 0.52, 0);
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(legW, 0.3, 0.21), plate);
    thigh.position.set(0, -0.15, 0.02);
    const knee = new THREE.Mesh(new THREE.BoxGeometry(legW + 0.04, 0.12, 0.19), armour);
    knee.position.set(0, -0.3, 0.05);
    const shin = new THREE.Mesh(new THREE.BoxGeometry(legW - 0.03, 0.28, 0.18), plate);
    shin.position.set(0, -0.44, 0.04);
    seam(0.05, 0.22, 0.03, trimC, side * 0.09, -0.44, 0.11, leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(legW + 0.02, 0.1, 0.34), armour);
    foot.position.set(0, -0.58, -0.02);
    seam(legW, 0.018, 0.2, hotC, 0, -0.53, -0.02, leg);
    leg.add(thigh, knee, shin, foot);
    body.add(leg);
    thighs.push(leg);
    shins.push(shin);
    foots.push(foot);
  }

  // ---- pelvis
  const hip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.32), plate);
  hip.position.set(0, 0.53, 0);
  body.add(hip);
  seam(0.46, 0.05, 0.06, trimC, 0, 0.54, 0.15, body);

  // ---- torso (trapezoid-ish: chest wider than waist)
  const waist = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.26), plate);
  waist.position.set(0, 0.66, 0);
  const chest = new THREE.Mesh(new THREE.BoxGeometry(horny ? 0.54 : 0.62, horny ? 0.42 : 0.46, 0.34), armour);
  chest.position.set(0, 0.93, 0);
  const collar = new THREE.Mesh(new THREE.BoxGeometry(horny ? 0.4 : 0.48, 0.08, 0.3), plate);
  collar.position.set(0, 1.17, 0);
  body.add(waist, chest, collar);
  // chest core (entry plug / reactor) + vertical seams
  const core = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.08), hot);
  core.position.set(0, 0.93, 0.2);
  body.add(core);
  seam(0.03, 0.34, 0.03, trimC, 0.16, 0.95, 0.19, body);
  seam(0.03, 0.34, 0.03, trimC, -0.16, 0.95, 0.19, body);
  seam(0.3, 0.02, 0.03, hotC, 0, 1.06, 0.19, body);

  // ---- shoulders
  const padGeo = new THREE.BoxGeometry(horny ? 0.3 : 0.36, horny ? 0.2 : 0.24, horny ? 0.34 : 0.4);
  for (const side of [-1, 1]) {
    const pad = new THREE.Mesh(padGeo, armour);
    pad.position.set(side * (horny ? 0.42 : 0.48), 1.08, 0);
    pad.rotation.z = side * -0.18;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(padGeo.parameters.width * 0.9, 0.05, 0.1), trim);
    cap.position.set(side * (horny ? 0.42 : 0.48), 1.16, 0.13);
    cap.rotation.z = side * -0.18;
    body.add(pad, cap);
    pads.push(pad);

    // heavy frame: shoulder cannons (silhouette cue) — still low, never blocking view
    if (!horny) {
      const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.36, 8), plate);
      gun.rotation.x = Math.PI / 2;
      gun.position.set(side * 0.5, 1.18, -0.16);
      const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 8), hot);
      muzzle.rotation.x = Math.PI / 2;
      muzzle.position.set(side * 0.5, 1.18, -0.34);
      body.add(gun, muzzle);
    }
  }

  // ---- arms
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * (horny ? 0.5 : 0.56), 1.0, 0);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.16), plate);
    upper.position.set(0, -0.15, 0);
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), joint);
    elbow.position.set(side * 0.02, -0.31, 0.02);
    const fore = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.28, 0.15), armour);
    fore.position.set(side * 0.04, -0.45, 0.05);
    // forearm cannon (heavy / proto) — the "built weapon" read
    if (!horny || proto) {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.22, 8), plate);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(side * 0.04, -0.46, 0.18);
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 8), hot);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(side * 0.04, -0.46, 0.3);
      arm.add(barrel, tip);
    }
    const fist = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.16), trim);
    fist.position.set(side * 0.04, -0.62, 0.06);
    arm.add(upper, elbow, fore, fist);
    body.add(arm);
    arms.push(arm);
    fists.push(fist);
  }

  // ---- head
  const head = new THREE.Group();
  head.position.set(0, 1.24, 0);
  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.26, 0.29), plate);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.24), armour);
  jaw.position.set(0, -0.15, 0.04);
  const helm = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.33), armour);
  helm.position.set(0, 0.15, 0);
  const vis = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.06), visor);
  vis.position.set(proto ? 0.03 : 0, 0.03, 0.16);
  head.add(skull, jaw, helm, vis);
  if (proto) {
    // offset monocle visor + rear sensor
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 10), visor);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(-0.1, 0.04, 0.17);
    head.add(lens);
    seam(0.18, 0.025, 0.02, trimC, 0.02, -0.06, 0.17, head);
  }
  if (horny) {
    // signature horn — tall forward-leaning spike + cheek finlets
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.58, 6), plate);
    horn.position.set(0, 0.44, -0.02);
    horn.rotation.x = -0.35;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.13, 5), hot);
    tip.position.set(0, 0.7, -0.12);
    tip.rotation.x = -0.35;
    head.add(horn, tip);
    for (const side of [-1, 1]) {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.24, 5), trim);
      fin.position.set(side * 0.15, 0.29, -0.02);
      fin.rotation.z = side * 0.55;
      fin.rotation.x = -0.2;
      head.add(fin);
    }
  } else if (!proto) {
    // heavy frame: twin rear antennae + a wide brow
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.08), armour);
    brow.position.set(0, 0.12, 0.14);
    head.add(brow);
    for (const side of [-1, 1]) {
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.26, 5), trim);
      ant.position.set(side * 0.11, 0.32, -0.06);
      ant.rotation.z = side * 0.28;
      head.add(ant);
    }
  } else {
    // proto: swept-back crest fin
    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.36), trim);
    crest.position.set(0, 0.2, -0.12);
    crest.rotation.x = 0.35;
    head.add(crest);
  }
  body.add(head);

  // ---- thruster pack
  const pack = new THREE.Mesh(new THREE.BoxGeometry(horny ? 0.32 : 0.4, 0.36, 0.2), plate);
  pack.position.set(0, 0.95, -0.26);
  seam(0.1, 0.28, 0.03, trimC, 0, 0.95, -0.37, body);
  body.add(pack);
  const glows = [];
  for (const side of [-1, 1]) {
    const thr = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.16, 8), plate);
    thr.rotation.x = Math.PI / 2;
    thr.position.set(side * 0.12, 0.88, -0.38);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), thruster);
    glow.position.set(side * 0.12, 0.88, -0.46);
    body.add(thr, glow);
    glows.push(glow);
  }

  // ---- ground halo (soft violet/cyan disc, not a hard ring)
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.3, 0.6, 32),
    new THREE.MeshBasicMaterial({ color: trimC, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.03;
  root.add(halo);

  root.userData.hullMats = [armour, plate];
  root.userData.coreMats = [visor, thruster, hot];
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
  root.userData.glowL = glows[0];
  root.userData.glowR = glows[1];
  root.userData.animPhase = 0;
  root.userData.idlePhase = 0;
  root.userData.scaleBase = 1.16;
  root.scale.setScalar(1.16);
  return root;
}

// ---------------------------------------------------------------------------
// Hostiles: humans first (the lab), mechs/drones as their support.
// Every silhouette is built from layered parts so it reads at phone size.
// ---------------------------------------------------------------------------
function humanMesh(kind, color, coat) {
  const g = new THREE.Group();
  const cloth = hullMat(clothColor(kind, coat), 0.18);
  const skin = hullMat(0xe8c39e, 0.08);
  const dark = hullMat(0x141824, 0.12);
  const accent = mat(color, 0.9);
  const legs = [];

  // humans read small next to a 3 m mech on a phone — lean into it, but keep the silhouette
  const scale = kind === 'chief' ? 1.5 : kind === 'officer' ? 1.42 : kind === 'soldier' ? 1.32 : 1.24;
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 0.11), dark);
    leg.position.set(side * 0.07, -0.17, 0);
    g.add(leg);
    legs.push(leg);
  }
  // ---- torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.34, 0.15), cloth);
  torso.position.set(0, 0.14, 0);
  g.add(torso);
  // lab coat tail / armour plate
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.04), cloth);
  tail.position.set(0, -0.02, -0.09);
  tail.rotation.x = -0.15;
  g.add(tail);
  seam(0.18, 0.02, 0.02, color, 0, 0.2, 0.08, g);

  // ---- head
  const head = new THREE.Group();
  head.position.set(0, 0.38, 0);
  const face = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.17, 0.16), skin);
  head.add(face);
  if (kind === 'chief' || kind === 'officer') {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.18), dark);
    cap.position.set(0, 0.09, 0.01);
    head.add(cap);
    seam(0.16, 0.015, 0.02, color, 0, 0.06, 0.1, head);
  }
  if (kind === 'staffer' || kind === 'chief' || kind === 'officer') {
    const specs = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.03, 0.02), mat(color, 1.3));
    specs.position.set(0, 0.01, 0.085);
    head.add(specs);
  }
  if (kind === 'soldier') {
    const helm = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.12, 0.2), dark);
    helm.position.set(0, 0.05, -0.005);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.03), accent);
    visor.position.set(0, 0.02, 0.1);
    head.add(helm, visor);
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.1), dark);
    pack.position.set(0, -0.06, -0.12);
    g.add(pack);
  }
  g.add(head);

  // ---- arms + weapon
  const arms = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.16, 0.24, 0);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.26, 0.08), cloth);
    upper.position.set(0, -0.12, 0);
    arm.add(upper);
    arms.push(arm);
    g.add(arm);
    if (side === 1 && kind !== 'staffer') {
      const gun = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.3), dark);
      gun.position.set(0, -0.24, 0.08);
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.04), accent);
      tip.position.set(0, -0.24, 0.24);
      arm.add(gun, tip);
    }
    if (side === 1 && kind === 'staffer') {
      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.02), dark);
      clip.position.set(0, -0.24, 0.05);
      arm.add(clip);
      seam(0.1, 0.02, 0.01, color, 0, -0.2, 0.07, arm);
    }
  }

  if (kind === 'chief') {
    // lab aura ring — marks the boss-tier human without any screen clutter
    const aura = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.44, 28), flatMat(color));
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.04;
    aura.material.transparent = true;
    aura.material.opacity = 0.55;
    g.add(aura);
  }

  g.scale.setScalar(scale);
  g.userData.legs = legs;
  g.userData.arms = arms;
  g.userData.type = kind;
  return g;
}

function clothColor(kind, coat) {
  if (kind === 'staffer' || kind === 'chief') return 0xdfe4f2;
  if (kind === 'officer') return 0x2a1030;
  if (kind === 'soldier') return 0x1b3a2b;
  return coat || 0x2b3350;
}

/** Drone / walker / escort mech support frames. */
function supportMesh(kind, color) {
  const g = new THREE.Group();
  const metal = hullMat(0x1a2030, 0.2);
  const trim = mat(color, 0.9);
  if (kind === 'drone') {
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.17, 0), metal);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), trim);
    eye.position.set(0, 0.02, 0.15);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 6, 16), trim);
    ring.rotation.x = Math.PI / 2;
    g.add(core, eye, ring);
    for (const side of [-1, 1]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.1), metal);
      fin.position.set(side * 0.24, 0, -0.04);
      fin.rotation.z = side * 0.25;
      g.add(fin);
    }
    g.position.y = 0.45;
    g.userData.bob = true;
  } else if (kind === 'walker') {
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.4, 0.46), metal);
    torso.position.y = 0.12;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.24), metal);
    head.position.set(0, 0.42, 0.05);
    const vis = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.04), trim);
    vis.position.set(0, 0.44, 0.18);
    const legs = [];
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(side * 0.2, -0.1, 0);
      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.2), metal);
      thigh.position.set(0, -0.14, 0);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.32), trim);
      foot.position.set(0, -0.32, 0.04);
      leg.add(thigh, foot);
      g.add(leg);
      legs.push(leg);
    }
    for (const side of [-1, 1]) {
      const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.34, 8), metal);
      gun.rotation.x = Math.PI / 2;
      gun.position.set(side * 0.36, 0.24, 0.06);
      g.add(gun);
    }
    g.add(torso, head, vis);
    g.userData.legs = legs;
  } else {
    // escort mech — the heaviest support frame
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.5, 0.52), metal);
    torso.position.y = 0.24;
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.06), trim);
    chest.position.set(0, 0.3, 0.27);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.28), metal);
    head.position.set(0, 0.6, 0.02);
    const vis = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.04), trim);
    vis.position.set(0, 0.62, 0.16);
    g.add(torso, chest, head, vis);
    const legs = [];
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(side * 0.24, -0.02, 0);
      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.36, 0.24), metal);
      thigh.position.set(0, -0.18, 0);
      leg.add(thigh);
      g.add(leg);
      legs.push(leg);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.34), metal);
      pad.position.set(side * 0.5, 0.44, 0);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.4, 8), trim);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(side * 0.5, 0.44, 0.2);
      g.add(pad, barrel);
    }
    g.userData.legs = legs;
  }
  g.userData.type = kind;
  return g;
}

function enemyMeshFor(type) {
  const def = ENEMIES[type] || ENEMIES.staffer;
  if (def.family === 'human') return humanMesh(def.kind, def.color, def.coat);
  return supportMesh(def.kind, def.color);
}

/** Drop mesh: a big flat letter billboard over a small solid cube. */
function makeLetterTexture(letter) {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, s, s);
  ctx.font = '900 104px Orbitron, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 12;
  ctx.strokeStyle = 'rgba(5,1,15,0.92)';
  ctx.strokeText(letter, s / 2, s / 2 + 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(letter, s / 2, s / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const LETTER_TEX = {};
const WEAPON_TEX = {};
function letterTexture(letter) {
  if (!LETTER_TEX[letter]) LETTER_TEX[letter] = makeLetterTexture(letter);
  return LETTER_TEX[letter];
}

/** Weapon emblem card for the "W" drop — the gun icon on a dark plate, unmistakable at phone size. */
function makeWeaponTexture(icon) {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(5,1,15,0.9)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(10, 10, s - 20, s - 20, 18); else ctx.rect(10, 10, s - 20, s - 20);
  ctx.fill();
  ctx.strokeStyle = '#ffe600';
  ctx.lineWidth = 6;
  ctx.stroke();
  // draw a simple gun silhouette so the drop reads even without the emoji glyph
  ctx.fillStyle = '#ffe600';
  ctx.fillRect(34, 50, 58, 14);
  ctx.fillRect(38, 64, 14, 22);
  ctx.fillRect(84, 58, 10, 8);
  ctx.fillStyle = '#05010f';
  ctx.fillRect(46, 54, 26, 3);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function dropMesh(d) {
  const g = new THREE.Group();
  const color = (DROP[d.kind] && DROP[d.kind].color) || 0x3bff8a;
  // solid cube = "pick this up"
  const cube = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), mat(color, 0.85));
  cube.rotation.x = Math.PI / 4;
  cube.rotation.z = Math.PI / 4;
  g.add(cube);
  // floating letter / icon plane above it
  const tex = d.kind === 'weapon' ? (WEAPON_TEX[d.weaponIcon] || (WEAPON_TEX[d.weaponIcon] = makeWeaponTexture(d.weaponIcon))) : letterTexture(d.letter || 'X');
  const bill = new THREE.Mesh(
    new THREE.PlaneGeometry(0.46, 0.46),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  bill.position.y = 0.42;
  bill.name = 'bill';
  g.add(bill);
  g.userData.cube = cube;
  g.userData.bill = bill;
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
    this.setMech('horn');

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
    this.player = buildPlayerMech(mech);
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
    const mech = buildPlayerMech(cfg);
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
    m.rotation.y = t * 0.5;
    const ud = m.userData;
    if (ud.body) ud.body.position.y = Math.sin(t * 1.6) * 0.02;
    if (ud.glowL && ud.glowR) {
      const pulse = 1 + Math.sin(t * 2.4) * 0.06;
      ud.glowL.scale.setScalar(pulse);
      ud.glowR.scale.setScalar(pulse);
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
    this.player.rotation.y = this._facing;
    const bank = THREE.MathUtils.clamp(-game.vx * 0.25, -0.2, 0.2);
    this.player.rotation.z += (bank - this.player.rotation.z) * 0.15;
    this.player.rotation.x = Math.hypot(game.vx, game.vz) > 0.1 ? -0.05 : 0;

    const blink = game.invuln > 0 && (game.invuln * 20) % 2 < 1;
    const hit = game.hitFlash > 0;
    const hullE = blink ? 0.1 : (hit ? 1.6 : 0.85);
    const coreE = blink ? 0.2 : (hit ? 2.2 : 1.25);
    const thrE = blink ? 0.2 : (hit ? 2 : (1.1 + Math.hypot(game.vx, game.vz) * 0.4));
    this._setEmissive(this.player.userData.hullMats, hullE);
    this._setEmissive(this.player.userData.coreMats, coreE);
    this._setEmissive(this.player.userData.thrusterMats, thrE);
    if (this.playerBody) this.playerBody.material.emissiveIntensity = hullE;
    if (this.playerCore) this.playerCore.material.emissiveIntensity = coreE;

    // ---- animation: walk cycle, idle hover, fire kick, hurt flinch
    const move = Math.hypot(game.vx, game.vz);
    const halo = this.player.userData.halo;
    if (halo) halo.material.opacity = 0.24 + move * 0.1;
    const ud = this.player.userData;
    ud.idlePhase = (game.t || 0) * 2.4;
    if (move > 0.08) ud.animPhase = (ud.animPhase || 0) + move * 0.55;
    else ud.animPhase = (ud.animPhase || 0) * 0.92;
    const walk = ud.animPhase || 0;
    const swing = Math.sin(walk) * Math.min(1, move * 1.4);
    const swingOpp = Math.sin(walk + Math.PI) * Math.min(1, move * 1.4);
    if (ud.legs && ud.legs.length === 2) { ud.legs[0].rotation.x = swing * 0.55; ud.legs[1].rotation.x = swingOpp * 0.55; }
    if (ud.shins && ud.shins.length === 2) { ud.shins[0].rotation.x = Math.max(0, -swing) * 0.35; ud.shins[1].rotation.x = Math.max(0, -swingOpp) * 0.35; }
    if (ud.foots && ud.foots.length === 2) { ud.foots[0].rotation.x = swing * 0.25; ud.foots[1].rotation.x = swingOpp * 0.25; }
    const fireKick = Math.max(0, game.muzzle || 0);
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

    if (this.novaAge >= 0) {
      this.novaAge += 0.05;
      const k = Math.min(1, this.novaAge);
      this.novaRing.position.set(game.px, 0.08, game.pz);
      this.novaRing.scale.setScalar(1 + k * (this._novaR || 2) * 4);
      this.novaRing.material.opacity = 0.85 * (1 - k);
      if (k >= 1) { this.novaAge = -1; this.novaRing.visible = false; }
    }

    // ---- enemies
    this._recycle(this._ePool, this.enemyG);
    for (const e of game.enemies) {
      const m = this._take(this._ePool, this.enemyG, () => enemyMeshFor(e.type));
      if (m.userData.type !== e.type) {
        while (m.children.length) m.remove(m.children[0]);
        const fresh = enemyMeshFor(e.type);
        while (fresh.children.length) m.add(fresh.children[0]);
        m.userData = { ...fresh.userData, type: e.type };
      }
      m.position.set(e.x, (ENEMIES[e.type] && ENEMIES[e.type].kind === 'drone') ? 0.45 + Math.sin(game.t * 3 + e.wob) * 0.08 : 0, e.z);
      m.rotation.y = Math.atan2(game.px - e.x, game.pz - e.z);
      const glow = e.hit > 0 ? 1.6 : (e.slow > 0 ? 0.5 : 0.85);
      const legSwing = Math.sin(game.t * (e.speed * 2.4) + e.wob) * 0.5;
      const legs = m.userData.legs || [];
      if (legs.length) { legs[0].rotation.x = legSwing; if (legs[1]) legs[1].rotation.x = -legSwing; }
      m.traverse((ch) => {
        if (ch.isMesh && ch.material && ch.material.emissive) ch.material.emissiveIntensity = glow;
      });
    }

    // ---- bullets (player shots)
    this._recycle(this._bPool, this.bulletG);
    for (const b of game.bullets) {
      const m = this._take(this._bPool, this.bulletG, () => new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.24, 4, 8), mat(0x00e5ff, 1.5)));
      m.position.set(b.x, 0.55, b.z);
      m.rotation.y = Math.atan2(b.vx, b.vz);
      m.rotation.x = Math.PI / 2;
      const col = b.frost ? 0x7ad7ff : 0x00e5ff;
      m.material.color.setHex(col); m.material.emissive.setHex(col);
    }

    // ---- drops (cube + big letter / weapon icon).
    // The pool is rebuilt every frame from the live drop list: pop a slot, parent it to gemG,
    // then sweep everything still in gemG back into the pool. _take() must NOT be used here —
    // it re-parents without removing from the pool's view, which is what produced a trail of
    // duplicate letter cubes for a single drop.
    for (const g of game.gems) {
      const key = (g.kind || 'xp');
      if (!this._gPool[key]) this._gPool[key] = [];
      const bucket = this._gPool[key];
      let slot = null;
      while (bucket.length && !slot) {
        const cand = bucket.pop();
        if (cand && cand.userData && cand.userData.bill && cand.userData.cube) slot = cand;
      }
      if (!slot || !slot.userData.bill) { slot = dropMesh(g); slot.userData.poolKey = key; }
      slot.userData.poolKey = key;
      if (slot.parent !== this.gemG) this.gemG.add(slot);
      slot.visible = true;
      const tex = g.kind === 'weapon'
        ? (WEAPON_TEX[g.weaponIcon] || (WEAPON_TEX[g.weaponIcon] = makeWeaponTexture(g.weaponIcon)))
        : letterTexture(g.letter || 'X');
      const bill = slot.userData.bill;
      if (bill && bill.material.map !== tex) {
        bill.material.map = tex;
        bill.material.needsUpdate = true;
      }
      const pop = g.pop > 0 ? 1 + g.pop * 1.5 : 1;
      slot.position.set(g.x, 0.28, g.z);
      slot.scale.setScalar(pop);
      slot.userData.cube.rotation.y += 0.06;
      slot.userData.cube.position.y = Math.sin(game.t * 3 + g.x) * 0.04;
      if (bill) {
        bill.position.y = 0.46 + Math.sin(game.t * 2.4 + g.z) * 0.04;
        bill.quaternion.copy(this.stage.camera.quaternion);
      }
    }
    // sweep: unclaimed slots from LAST frame go back to the pool and off the scene. The list is
    // captured before this frame's slots are added — sweeping gemG directly would also sweep
    // the drops we just placed.
    for (const c of this._dropLive) {
      this.gemG.remove(c);
      c.visible = false;
      const key = c.userData.poolKey || 'xp';
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
