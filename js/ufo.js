/**
 * Procedural UFO (no PNG). Disc + dome + neon rim + underside beam.
 * Variants come from mech cfg.trim / cfg.id — same stats, different paint.
 */
import * as THREE from 'three';

function std(color, emissive, intensity, metal = 0.55) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: intensity,
    roughness: 0.42,
    metalness: metal,
  });
}

export function buildUfo(cfg) {
  const id = (cfg && (cfg.model || cfg.id)) || 'horn';
  const trim = (cfg && cfg.trim) || 0x00e5ff;
  const plate = (cfg && cfg.plate) || 0x1a1e28;
  const hot = (cfg && cfg.hot) || trim;
  const root = new THREE.Group();
  root.name = 'ufo';

  const hull = std(plate, 0x10141c, 0.25, 0.7);
  const rimMat = std(trim, trim, 1.15, 0.2);
  const domeMat = new THREE.MeshStandardMaterial({
    color: 0xb8fbff,
    emissive: trim,
    emissiveIntensity: 0.85,
    roughness: 0.18,
    metalness: 0.15,
    transparent: true,
    opacity: 0.82,
  });
  const beamMat = new THREE.MeshBasicMaterial({
    color: trim,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 0.14, 64), hull);
  disc.position.y = 0.72;
  const belly = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.55, 0.08, 28), std(0x0c1018, trim, 0.35, 0.4));
  belly.position.y = 0.62;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
  dome.position.y = 0.78;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.055, 16, 80), rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.72;

  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 16, 1, true), beamMat);
  beam.position.y = 0.36;
  beam.rotation.x = Math.PI;

  const lights = [];
  const n = id === 'heavy' ? 5 : 3;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), std(hot, hot, 1.4, 0.1));
    bulb.position.set(Math.cos(a) * 0.86, 0.8, Math.sin(a) * 0.86);
    root.add(bulb);
    lights.push(bulb);
  }

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.95, 36),
    new THREE.MeshBasicMaterial({ color: trim, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.04;

  root.add(disc, belly, dome, rim, beam, halo);
  if (id === 'prototype') {
    const inner = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.02, 8, 28), rimMat);
    inner.rotation.x = Math.PI / 2;
    inner.position.y = 0.9;
    root.add(inner);
    root.userData.spinRing = inner;
  } else {
    root.userData.spinRing = rim;
  }
  root.scale.setScalar((id === 'heavy' ? 1.14 : id === 'prototype' ? 0.94 : 1) * 0.7);

  const stub = hull;
  root.userData.isSprite = false;
  root.userData.isUfo = true;
  root.userData.mechId = id;
  root.userData.hullMats = [hull];
  root.userData.coreMats = [domeMat, rimMat];
  root.userData.thrusterMats = [beamMat];
  root.userData.halo = halo;
  root.userData.beam = beam;
  root.userData.lights = lights;
  root.userData.legs = [];
  root.userData.arms = [];
  return root;
}
