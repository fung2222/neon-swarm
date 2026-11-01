/**
 * Player visual = procedural UFO (js/ufo.js). No PNG sheets.
 */
import * as THREE from 'three';
import { buildUfo } from './ufo.js';

export function preloadAllSprites() {}

export function buildPlayerSprite(cfg) {
  return buildUfo(cfg || { id: 'horn', trim: 0x00e5ff });
}

export function enemySpriteKey() { return 'proc'; }

/** Kept so old call sites do not throw. Live enemies use view.js procedural meshes. */
export function buildEnemySprite(type) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xff3b6e, emissive: 0xff3b6e, emissiveIntensity: 0.45, roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.36, 4, 8), mat);
  body.position.y = 0.5;
  g.add(body);
  g.userData.type = type;
  g.userData.isSprite = false;
  g.userData.hullMats = [mat];
  g.userData.coreMats = [mat];
  return g;
}

export function retargetEnemySprite(root, type) {
  if (root && root.userData) root.userData.type = type;
  return root;
}

export function buildDoctorNpc() {
  const g = new THREE.Group();
  const coat = new THREE.MeshStandardMaterial({ color: 0xe8eef8, emissive: 0x6688aa, emissiveIntensity: 0.25, roughness: 0.7 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xf1cfa8, emissive: 0x6a4a30, emissiveIntensity: 0.12, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.42, 4, 8), coat);
  body.position.y = 0.55;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), skin);
  head.position.y = 0.98;
  g.add(body, head);
  g.userData.isNpc = true;
  g.userData.isSprite = false;
  g.userData.type = 'doctor';
  return g;
}

export function billboardToCamera() {}
export function applySpriteFlash() {}
export function applySpriteMotion() {}
export function syncBakedPlayerSprite() {}
