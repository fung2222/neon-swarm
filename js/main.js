// NEON SWARM — v0.2 bullet heaven
import * as THREE from 'three';
import {
  i18n, t, flags, createStore, createStage, ThemeController, NeonCity, CyberUI, Platform,
  createAds, readHub, returnToHub as kitReturnToHub, shouldShowArcadeMenu, Particles, Shockwaves, FxState,
} from 'cyber-kit';
import { GAME_ID, ADS, TRIAL } from './config.js';
import './strings.js';
import { Game } from './logic.js';
import { View } from './view.js';
import { SwarmAudio } from './audio.js';

const $ = (id) => document.getElementById(id);
const HUB = readHub(location.search);
// normalize ads for createAds / interstitial gate (kit readHub.ads is boolean)
const ADS_ON = HUB.ads === true || HUB.ads === '1' || (!HUB.fromHub && (flags.adsim || Platform.isNative));
const AD_FLAGS = { adsim: flags.adsim || HUB.ads === true || HUB.ads === '1', debug: flags.debug };

const store = createStore(GAME_ID);
if (flags.reset) store.clear();
const ui = new CyberUI({ screens: ['start', 'pause', 'over', 'level'] });
const stage = createStage({
  canvas: $('scene'), bloom: 0.85, bloomRadius: 0.42, bloomThreshold: 0.8, fov: 40, exposure: 1.05,
  onFatal: (m) => ui.fatal(m),
});
ui.glowToggle(stage);
const theme = new ThemeController(); theme.set(1, true);
const city = new NeonCity(stage, {
  floor: 'plain', floorY: -0.8, innerRadius: 12, buildings: 220,
  billboard: { zh: '霓虹洪流', en: 'N E O N   S W A R M', pos: [0, 14, -22], width: 20 },
  dustArea: 14, dustHeight: 6,
});
// clear sightline over arena
(function clearSight() {
  const m = city.city, m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  if (!m) return;
  for (let i = 0; i < m.count; i++) {
    m.getMatrixAt(i, m4); m4.decompose(p, q, sc);
    if (Math.hypot(p.x, p.z) < 11 && sc.y > 2.5) { sc.y = 1.2 + Math.random() * 1.5; m4.compose(p, q, sc); m.setMatrixAt(i, m4); }
  }
  m.instanceMatrix.needsUpdate = true;
})();

const view = new View(stage);
view.setVisible(false);
const particles = new Particles(stage.scene, 2200, { floorY: 0.02 });
stage.onResize((w, h, pr) => particles.resize(h, pr));
const waves = new Shockwaves(stage.scene, 12);
const fx = new FxState();
const audio = new SwarmAudio(store);
ui.setMuted(audio.muted);
const ads = createAds({ gameId: GAME_ID, ...ADS, flags: AD_FLAGS, onAdOpen: (on) => audio.duckAll(on) });

const S = {
  state: 'menu', demo: !!flags.demo, game: null, mode: 'endless',
  hub: HUB, keys: Object.create(null), stick: { active: false, dx: 0, dy: 0 },
  demoT: 0, newRecord: false,
};
window.__swarm = S;

function fmtTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
function refreshMenu() {
  $('start-best').textContent = String(store.getNum('best', 0));
  if ($('start-time')) $('start-time').textContent = fmtTime(store.getNum('bestTime', 0));
}
function updateHUD() {
  const g = S.game; if (!g) return;
  $('hud-score').textContent = String(Math.floor(g.score));
  $('hud-time').textContent = fmtTime(g.t);
  $('hud-lv').textContent = String(g.level);
  $('hud-hp').textContent = String(Math.max(0, g.hp));
  const pct = Math.min(1, g.xp / g.xpNeed);
  $('xp-fill').style.width = (pct * 100) + '%';
  if (HUB.trial) {
    const left = TRIAL.surviveSec - g.t;
    if (left <= 0 && g.alive) {
      // trial stop
      endRun(true);
    }
  }
}

function showMenu() {
  S.state = 'menu';
  document.body.classList.add('in-menu');
  view.setVisible(false);
  $('hud').classList.add('hidden');
  $('stick').classList.add('hidden');
  ui.show('start');
  refreshMenu();
  if (HUB.trial) {
    const el = $('start-trial');
    el.classList.remove('hidden');
    el.textContent = i18n.isZh()
      ? `試玩模式${HUB.trialLeft != null ? ` · 今日剩 ${HUB.trialLeft} 局` : ''}`
      : `Trial${HUB.trialLeft != null ? ` · ${HUB.trialLeft} left today` : ''}`;
  }
}

function showLevelCards(cards) {
  S.state = 'level';
  const box = $('level-cards');
  box.innerHTML = '';
  cards.forEach((c) => {
    const b = document.createElement('button');
    b.className = 'level-card';
    b.type = 'button';
    b.innerHTML = `<b>${i18n.isZh() ? c.zh : c.en}</b><small>${i18n.isZh() ? c.descZh : c.descEn}</small>`;
    b.addEventListener('click', () => {
      audio.pick();
      S.game.applyCard(c);
      ui.show(null);
      S.state = 'play';
      $('stick').classList.toggle('hidden', !('ontouchstart' in window) && !flags.get('stick'));
    });
    box.appendChild(b);
  });
  ui.show('level');
  audio.level();
}

function startRun() {
  audio.init();
  S.game = new Game({ seed: (Date.now() & 0xffff) ^ ((Math.random() * 1e6) | 0), endless: true });
  S.state = 'play';
  S.demoT = 0;
  S.newRecord = false;
  document.body.classList.remove('in-menu');
  view.setVisible(true);
  ui.show(null);
  $('hud').classList.remove('hidden');
  $('demo-tag').classList.toggle('hidden', !S.demo);
  const touch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 || flags.get('stick') === '1' || S.demo;
  $('stick').classList.toggle('hidden', !touch);
  $('stick').classList.add('ready');
  updateHUD();
  audio.click();
}

function endRun(trial = false) {
  const g = S.game;
  if (!g) return;
  const score = Math.floor(g.score);
  const best = store.getNum('best', 0);
  const bestTime = store.getNum('bestTime', 0);
  S.newRecord = score > best;
  if (score > best) store.setNum('best', score);
  if (g.t > bestTime) store.setNum('bestTime', g.t);
  S.state = 'over';
  $('hud').classList.add('hidden');
  $('stick').classList.add('hidden');
  $('over-score').textContent = String(score);
  $('over-best').textContent = String(store.getNum('best', 0));
  $('over-time').textContent = fmtTime(g.t);
  $('over-kills').textContent = String(g.kills);
  $('over-record').classList.toggle('hidden', !S.newRecord);
  $('over-note').textContent = trial
    ? (i18n.isZh() ? '試玩時間到 · 解鎖金級繼續洪流' : 'Trial time up — unlock Gold to keep going')
    : t('overNote');
  ui.show('over');
  audio.dead();
  if (ADS_ON) ads.naturalBreak('over').catch(() => {});
}

function applyMoveFromInput() {
  const g = S.game; if (!g || S.state !== 'play') return;
  let dx = 0, dz = 0;
  if (S.keys.KeyW || S.keys.ArrowUp) dz -= 1;
  if (S.keys.KeyS || S.keys.ArrowDown) dz += 1;
  if (S.keys.KeyA || S.keys.ArrowLeft) dx -= 1;
  if (S.keys.KeyD || S.keys.ArrowRight) dx += 1;
  if (S.stick.active) { dx += S.stick.dx; dz += S.stick.dy; }
  if (S.demo) {
    S.demoT += 0.016;
    // limp circle + noise
    dx = Math.cos(S.demoT * 0.7) + Math.sin(S.demoT * 1.3) * 0.3;
    dz = Math.sin(S.demoT * 0.7) * 0.8;
  }
  if (dx || dz) g.moveDir(dx, dz);
  else g.stopMove();
}

// ---- virtual stick
(function bindStick() {
  const root = $('stick');
  const knob = $('stick-knob');
  let pid = null, cx = 0, cy = 0;
  const R = 56;
  const DEAD = 8;
  const setKnob = (x, y) => { knob.style.transform = `translate(${x}px,${y}px)`; };
  const onDown = (e) => {
    if (S.state !== 'play') return;
    if (e.target.closest && e.target.closest('button,.level-card,#hud')) return;
    const t = e.changedTouches ? e.changedTouches[0] : e;
    pid = t.pointerId ?? t.identifier ?? 'mouse';
    // if pressing the stick widget, center on stick; else dynamic origin at finger
    if (e.target.closest && e.target.closest('#stick')) {
      const rect = root.getBoundingClientRect();
      cx = rect.left + rect.width / 2;
      cy = rect.top + rect.height / 2;
    } else {
      cx = t.clientX; cy = t.clientY;
    }
    S.stick.active = true;
    root.classList.add('active');
    onMove(e);
    audio.init();
  };
  const onMove = (e) => {
    if (!S.stick.active) return;
    const pts = e.changedTouches ? [...e.changedTouches] : [e];
    const t = pts.find((x) => (x.pointerId ?? x.identifier ?? 'mouse') === pid) || pts[0];
    if (!t) return;
    let dx = t.clientX - cx, dy = t.clientY - cy;
    const len = Math.hypot(dx, dy) || 1;
    const cl = Math.min(len, R);
    const kx = (dx / len) * cl, ky = (dy / len) * cl;
    setKnob(kx, ky);
    if (len < DEAD) { S.stick.dx = 0; S.stick.dy = 0; }
    else {
      const mag = Math.min(1, (len - DEAD) / (R - DEAD));
      S.stick.dx = (dx / len) * mag;
      S.stick.dy = (dy / len) * mag;
    }
    if (e.cancelable) e.preventDefault();
  };
  const onUp = () => {
    S.stick.active = false; S.stick.dx = 0; S.stick.dy = 0; setKnob(0, 0); pid = null;
    root.classList.remove('active');
  };
  root.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  // also allow drag anywhere on canvas (one-thumb)
  $('scene').addEventListener('pointerdown', (e) => {
    if (S.state !== 'play') return;
    if (e.target.closest && e.target.closest('button,.level-card,#stick')) return;
    // treat as world drag stick centered on press
    const t = e;
    pid = t.pointerId;
    cx = t.clientX; cy = t.clientY;
    S.stick.active = true;
    setKnob(0, 0);
    audio.init();
  });
})();

window.addEventListener('keydown', (e) => {
  S.keys[e.code] = true;
  audio.init();
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (S.state === 'play') { S.state = 'pause'; ui.show('pause'); }
    else if (S.state === 'pause') { S.state = 'play'; ui.show(null); }
  }
  if (e.code === 'KeyM') { audio.toggleMute(); ui.setMuted(audio.muted); }
});
window.addEventListener('keyup', (e) => { S.keys[e.code] = false; });

$('btn-play')?.addEventListener('click', () => startRun());
$('btn-endless')?.addEventListener('click', () => startRun());
$('btn-pause')?.addEventListener('click', () => { if (S.state === 'play') { S.state = 'pause'; ui.show('pause'); } });
$('btn-resume')?.addEventListener('click', () => { S.state = 'play'; ui.show(null); });
$('btn-restart')?.addEventListener('click', () => startRun());
$('btn-quit')?.addEventListener('click', () => showMenu());
$('btn-retry')?.addEventListener('click', () => startRun());
$('btn-menu')?.addEventListener('click', () => showMenu());
$('btn-mute')?.addEventListener('click', () => { audio.toggleMute(); ui.setMuted(audio.muted); });

if (shouldShowArcadeMenu(HUB)) {
  const b = $('btn-arcade-menu');
  if (b) {
    b.classList.remove('hidden');
    b.addEventListener('click', () => kitReturnToHub({ gameId: GAME_ID, openStore: false }, location.search));
  }
}

ui.mountHowto({
  privacyUrl: './privacy.html',
  onOpen: () => { try { audio.click(); } catch (_) {} },
  getContent: () => ({
    kicker: 'NEON SWARM',
    title: t('kit.howto'),
    sections: [
      { heading: t('kit.rules'), body: t('help.rules') },
      { heading: t('kit.controls'), body: t('help.controls') },
    ],
  }),
});
ui.mountSettings({
  audio, stage,
  onOpen: () => { try { audio.click(); } catch (_) {} },
});

i18n.onChange(() => refreshMenu());
Platform.onBack(() => {
  if (S.state === 'level') return true; // must pick
  if (S.state === 'pause') { S.state = 'play'; ui.show(null); return true; }
  if (S.state === 'over') { showMenu(); return true; }
  if (S.state === 'play') { S.state = 'pause'; ui.show('pause'); return true; }
  return false;
});

function tick(dt) {
  // demo level pick
  if (S.demo && S.state === 'level' && S.game?.pendingCards?.length) {
    S.demoT = (S.demoT || 0) + dt;
    if (S.demoT > 1.2) {
      S.demoT = 0;
      const c = S.game.pendingCards[0];
      audio.pick();
      S.game.applyCard(c);
      ui.show(null);
      S.state = 'play';
    }
  }
  if (S.state === 'menu') {
    const cam = stage.camera;
    const t = performance.now() * 0.00012;
    cam.position.set(Math.sin(t) * 3, 14, 18);
    cam.lookAt(0, 2, 0);
    return;
  }
  if (!S.game) return;
  if (S.state === 'over') return;
  if (S.state === 'play') applyMoveFromInput();
  const { events } = S.state === 'play' ? S.game.step(dt) : { events: [] };
  for (const ev of events) {
    if (ev.type === 'fire') audio.fire();
    else if (ev.type === 'hit') {
      audio.hit();
      if (ev.x != null) {
        const c = new THREE.Color(ev.color || 0x00e5ff);
        particles.burst(new THREE.Vector3(ev.x, 0.5, ev.z), c, 6, { speed: 3, up: 1.2, size: 0.7 });
      }
    }
    else if (ev.type === 'kill') {
      audio.kill();
      const c = new THREE.Color(ev.enemy.color);
      const pos = new THREE.Vector3(ev.enemy.x, 0.4, ev.enemy.z);
      particles.burst(pos, c, 18, { speed: 5, up: 2.5 });
      waves.spawn(pos, c, { r0: 0.3, r1: 1.8, dur: 0.45, a: 2.2 });
      fx.kick({ trauma: 0.12 });
    }
    else if (ev.type === 'xp') {
      audio.xp();
      particles.burst(new THREE.Vector3(ev.x || S.game.px, 0.6, ev.z || S.game.pz), new THREE.Color(0x3bff8a), 8, { speed: 2.5, up: 2, size: 0.8 });
    }
    else if (ev.type === 'hurt') {
      audio.hurt();
      fx.kick({ trauma: 0.35, aberr: 0.4 });
      const flash = $('fx-flash');
      if (flash) { flash.classList.add('on'); setTimeout(() => flash.classList.remove('on'), 120); }
    }
    else if (ev.type === 'dead') endRun(false);
    else if (ev.type === 'levelup') showLevelCards(ev.cards);
    else if (ev.type === 'nova') {
      audio.nova();
      view.pulseNova(ev.r);
      waves.spawn(new THREE.Vector3(S.game.px, 0.05, S.game.pz), new THREE.Color(0xffe600), { r0: 0.4, r1: ev.r * 1.2, dur: 0.5, a: 2.4 });
      fx.kick({ trauma: 0.2 });
    }
    else if (ev.type === 'wave') audio.wave();
  }
  if (S.state === 'play' || S.state === 'level' || S.state === 'pause') {
    if (S.state === 'play') {
      particles.update(dt);
      waves.update(dt);
      fx.update(dt);
      view.sync(S.game);
      view.frameCamera(stage.camera, S.game, dt);
      fx.shake(stage.camera, performance.now() * 0.001);
      fx.applyPost(stage, performance.now() * 0.001);
      updateHUD();
      if (S.demo && S.game.t > 50) endRun(false);
    } else if (S.game) {
      view.sync(S.game);
      particles.update(dt);
    }
  }
}

async function boot() {
  if (document.fonts) await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
  if (flags.mute) { audio.muted = true; ui.setMuted(true); }
  showMenu();
  ui.loaded();
  if (S.demo || flags.autostart) startRun();
  stage.loop((dt, time, rawDt) => {
    tick(Math.min(0.05, dt));
    city.update(time, dt, stage.camera);
    stage.render(rawDt);
  }, { isActive: () => true, fpsEl: $('fps') });
  if (flags.fps) $('fps').classList.remove('hidden');
  ads.init().catch(() => {});
}
boot().catch((e) => { console.error(e); ui.fatal('載入失敗 Failed to start: ' + e.message); });
