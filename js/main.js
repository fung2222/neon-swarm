// RAMPAGE MECH 暴走機甲 — v0.9.21 horn mecha silhouette pass (interim, awaiting Roy eyes); was v0.9.20 phone stable
import * as THREE from 'three';
import {
  i18n, t, flags, createStore, createStage, ThemeController, NeonCity, CyberUI, Platform,
  createAds, readHub, returnToHub as kitReturnToHub, shouldShowArcadeMenu, Particles, Shockwaves, FxState,
  ViewInput, defaultView, clampView, dampView,
} from 'cyber-kit';
import { GAME_ID, ADS, TRIAL, ARENA, MECHS, MECH_BY_ID, PLAYER, resolveMechCombat, isMechPlayable } from './config.js';
import './strings.js';
import { Game } from './logic.js';
import { View } from './view.js';
import { SwarmAudio } from './audio.js';
import { shouldAutoPauseOnHidden } from './bg-pause.js';

const $ = (id) => document.getElementById(id);
const HUB = readHub(location.search);
const ADS_ON = HUB.ads === true || HUB.ads === '1' || (!HUB.fromHub && (flags.adsim || Platform.isNative));
const AD_FLAGS = { adsim: flags.adsim || HUB.ads === true || HUB.ads === '1', debug: flags.debug };

const store = createStore(GAME_ID);
if (flags.reset) store.clear();

// v0.9.6 + v0.9.20: mobile / coarse-pointer GPU pressure cut (stability only — no balance changes)
const MOBILE_GFX = (() => {
  try {
    const coarse = matchMedia('(pointer: coarse)').matches;
    const touch = (navigator.maxTouchPoints || 0) > 0;
    const narrow = Math.min(screen.width || 9999, screen.height || 9999) <= 820;
    const ua = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
    return !!(coarse || (touch && narrow) || ua);
  } catch (_) { return false; }
})();
// v0.9.20: pool 1200→800 on mobile (further mid-run GPU pressure cut; desktop unchanged)
const PARTICLE_POOL = MOBILE_GFX ? 800 : 5200;
const MAX_PR = MOBILE_GFX ? 1 : 2;
/** Scale burst counts on mobile (further cut vs v0.9.5 for GPU stability). */
const burstN = (n) => MOBILE_GFX ? Math.max(1, Math.round(n * 0.4)) : n;

const ui = new CyberUI({ screens: ['start', 'pause', 'over', 'level', 'gfx'] });

/** Show recoverable graphics overlay (context loss or boot WebGL fail). Prefer reload over soft restore. */
function showGfxRecover(kind = 'lost') {
  const body = $('gfx-body');
  const bodyEn = $('gfx-body-en');
  const zh = kind === 'boot' ? t('gfx.boot') : t('gfx.lost');
  const en = kind === 'boot' ? t('gfx.bootEn') : t('gfx.lostEn');
  if (body) body.textContent = zh;
  if (bodyEn) bodyEn.textContent = en;
  // Hide kit permanent-fatal strip if present
  const err = document.getElementById('err');
  if (err) { err.classList.add('hidden'); err.textContent = ''; }
  try { ui.hud(false); } catch (_) {}
  try { ui.show('gfx'); } catch (_) {
    const el = $('screen-gfx');
    if (el) { el.classList.remove('hidden'); el.style.removeProperty('display'); }
  }
  ui.loaded?.(0);
}

const stage = createStage({
  canvas: $('scene'),
  // v0.9.20: permanently lower bloom on MOBILE_GFX (desktop keeps 0.22)
  bloom: MOBILE_GFX ? 0.10 : 0.22, bloomRadius: 0.28, bloomThreshold: MOBILE_GFX ? 0.96 : 0.94,
  fov: 42, exposure: 0.88,
  glow: 'low',
  glowLevels: { low: { strength: MOBILE_GFX ? 0.10 : 0.22, radius: 0.35, threshold: 0.25 } },
  maxPixelRatio: MAX_PR,
  // Recoverable copy — GPU process death is not "browser lacks WebGL forever"
  onFatal: () => showGfxRecover('boot'),
});
ui.glowToggle(stage);
stage.setGlow('low'); // v0.8.5: force low glow (ignore shared high from other games)
// v0.9.20: clamp bloom base after setGlow so mobile stays low even if prefs flip
if (MOBILE_GFX) {
  try {
    stage.bloomBase = Math.min(stage.bloomBase ?? 0.10, 0.10);
    if (stage.bloomPass) stage.bloomPass.strength = stage.bloomBase;
  } catch (_) {}
}
$('btn-gfx-reload')?.addEventListener('click', () => { location.reload(); });

const theme = new ThemeController(); theme.set(1, true);

// Wilderness-style open map: NO tall buildings in play space
const city = new NeonCity(stage, {
  floor: 'plain', floorY: -0.9, innerRadius: 90, buildings: 0,
  billboard: null, signs: false, rain: false, traffic: false,
  // Phase 2: no additive dust motes competing with pickups / MG tracers.
  dust: false,
});
// Phase 2 ambient: pull shared city lights down a notch (floor MeshStandard reads darker).
if (city.hemi) city.hemi.intensity = Math.min(city.hemi.intensity, 0.32);
if (city.dirLight) city.dirLight.intensity = Math.min(city.dirLight.intensity, 0.45);

const view = new View(stage);
view.setVisible(false);
const particles = new Particles(stage.scene, PARTICLE_POOL, { floorY: 0.02 });
stage.onResize((w, h, pr) => {
  particles.resize(h, pr);
  // Keep menu mech framing in sync on resize / orientation change (not only first setMenuMech).
  if (view.menuMech) view.updateMenuLayout(w, h);
});
const waves = new Shockwaves(stage.scene, MOBILE_GFX ? 10 : 24);
const fx = new FxState();
/** Mobile: clamp bloomDamp and roughly half trauma/slowmo so late-run AoE cannot white-out GPU. Desktop unchanged.
 *  v0.9.20: bloomDamp cap 0.25→0.18 (stronger mid-run GPU cut). */
function kickFx(o) {
  if (!MOBILE_GFX) { fx.kick(o); return; }
  const m = { ...o };
  if (m.bloomDamp != null) m.bloomDamp = Math.min(m.bloomDamp, 0.18);
  if (m.trauma != null) m.trauma *= 0.5;
  if (m.slowmo != null) m.slowmo *= 0.5;
  fx.kick(m);
}
const audio = new SwarmAudio(store);
ui.setMuted(audio.muted);
const ads = createAds({ gameId: GAME_ID, ...ADS, flags: AD_FLAGS, onAdOpen: (on) => audio.duckAll(on) });

const S = {
  state: 'menu', demo: !!flags.demo, game: null, mode: 'endless',
  hub: HUB, keys: Object.create(null), stick: { active: false, dx: 0, dy: 0 },
  demoT: 0, newRecord: false, gfxLost: false,
  mechId: MECH_BY_ID[store.get('mech', 'horn')] ? store.get('mech', 'horn') : 'horn',
};
S.mech = MECH_BY_ID[S.mechId];

// v0.9.5: WebGL context lost — freeze run + recoverable overlay (no silent white canvas + live HUD).
// Restored → hard reload: Three.js textures/RT are often invalid after GPU death; soft bloom reset is inadequate.
{
  const canvas = $('scene');
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    if (S.gfxLost) return;
    S.gfxLost = true;
    console.warn('[neon-swarm] WebGL context lost');
    try { if (S.state === 'play' || S.state === 'level') S.state = 'pause'; } catch (_) {}
    try { audio.duckAll?.(true); } catch (_) {}
    showGfxRecover('lost');
  }, false);
  canvas.addEventListener('webglcontextrestored', () => {
    console.warn('[neon-swarm] WebGL context restored — reloading for clean Three.js recovery');
    location.reload();
  }, false);
}

/** Same path as Esc / btn-pause / Platform.onBack — show pause UI; never auto-resume on visible. */
function pauseRun() {
  if (!shouldAutoPauseOnHidden(S.state)) return false;
  S.state = 'pause';
  try { ui.show('pause'); } catch (_) {}
  return true;
}

// v0.9.20 AUDIT gap: commute auto-pause when app/tab backgrounds (no auto-resume).
function onDocumentHidden() {
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') return;
  pauseRun();
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' || document.hidden) onDocumentHidden();
});
window.addEventListener('pagehide', onDocumentHidden);

/** Compact bars derived from resolveMechCombat — never a second fake table. */
function mechStatBars(m) {
  const rc = resolveMechCombat(m);
  const hpN = rc.maxHp / (PLAYER.hp + 1);          // ~1 when +1 shield
  const spN = rc.speed / PLAYER.speed;
  const dmgN = rc.bulletDmg / PLAYER.bulletDmg;
  const rofN = PLAYER.fireCd / Math.max(0.001, rc.fireCd);
  const rows = [
    ['HP', hpN], ['SPD', spN], ['ATK', dmgN], ['ROF', rofN],
  ];
  return `<div class="mech-stats">${rows.map(([lab, v]) => {
    const pct = Math.max(8, Math.min(100, Math.round(v * 70)));
    return `<span class="mech-stat"><i>${lab}</i><b style="--w:${pct}%"></b></span>`;
  }).join('')}</div>`;
}

/** Three frames on the home screen; preview is live 3D buildPlayerMech (not sprite). */
function buildMechPicker() {
  const box = $('mech-pick');
  if (!box) return;
  box.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'mech-head';
  head.textContent = t('mech.pick');
  box.appendChild(head);
  const row = document.createElement('div');
  row.className = 'mech-row';
  MECHS.forEach((m) => {
    const locked = !isMechPlayable(m);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mech-card' + (m.id === S.mechId ? ' on' : '') + ' mech-' + m.id + (locked ? ' coming' : '');
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', m.id === S.mechId ? 'true' : 'false');
    b.dataset.id = m.id;
    b.dataset.playable = locked ? '0' : '1';
    const accent = m.accent.toString(16).padStart(6, '0');
    const trim = m.trim.toString(16).padStart(6, '0');
    const badge = locked
      ? `<span class="mech-badge">${t('mech.coming')}</span>`
      : '';
    // Stub frames: still show provisional bars but dimmed via CSS — not formal balance.
    b.innerHTML =
      `<span class="mech-swatch" style="--a:#${accent};--t:#${trim}"></span>` +
      `<b>${i18n.isZh() ? m.zh : m.en}</b>` +
      `<small>${i18n.isZh() ? m.descZh : m.descEn}</small>` +
      badge +
      mechStatBars(m);
    b.addEventListener('click', () => {
      S.mechId = m.id;
      S.mech = m;
      store.set('mech', m.id);
      try { audio.click(); } catch (_) {}
      buildMechPicker();
      refreshStartLock();
      if (S.menuMech) view.setMenuMech(m.id);
    });
    row.appendChild(b);
  });
  box.appendChild(row);
  let note = box.querySelector('.mech-lock-note');
  if (!note) {
    note = document.createElement('div');
    note.className = 'mech-lock-note';
    box.appendChild(note);
  }
  refreshStartLock();
}

function refreshStartLock() {
  const playable = isMechPlayable(S.mechId);
  const btn = $('btn-play');
  if (btn) {
    btn.disabled = !playable;
    btn.classList.toggle('locked', !playable);
    btn.setAttribute('aria-disabled', playable ? 'false' : 'true');
  }
  const note = document.querySelector('#mech-pick .mech-lock-note');
  if (note) note.textContent = playable ? '' : t('mech.locked');
}

// Mild camera zoom (pinch / wheel) — one-finger left for move stick
const ZOOM_LIM = { zoomMin: 0.72, zoomMax: 1.28, azMax: 0.01, pitchMin: 0.5, pitchMax: 1.5 };
const pView = defaultView();
const pViewC = defaultView();
const viewPitch = 1.05;
const viewExt = [ARENA.half * 0.15, ARENA.half * 0.15];
new ViewInput($('scene'), {
  enabled: () => S.state === 'play' || S.state === 'pause',
  zoom: (f) => {
    pView.zoom *= f;
    clampView(pView, viewPitch, viewExt, ZOOM_LIM);
  },
  twist: () => {},
  pan: () => {},
  orbit: () => {},
  // ViewInput always calls h.tap on clean pointerup — stub required (do not patch vendor).
  tap: () => {},
  down: () => { audio.init(); },
}, { oneFingerOrbit: false });

window.__swarm = S;
S.view = view;

/** Select-stage drag: horizontal yaw on #mech-stage (mouse + one finger). */
(function wireMenuMechDrag() {
  const el = $('mech-stage') || $('scene');
  if (!el) return;
  let dragging = false;
  let lastX = 0;
  const onDown = (x, e) => {
    if (S.state !== 'menu') return;
    dragging = true;
    lastX = x;
    if (e && e.cancelable) e.preventDefault();
  };
  const onMove = (x, e) => {
    if (!dragging || S.state !== 'menu') return;
    const dx = x - lastX;
    lastX = x;
    view.nudgeMenuYaw(dx * 0.012);
    if (e && e.cancelable) e.preventDefault();
  };
  const onUp = () => { dragging = false; };
  el.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    onDown(e.clientX, e);
  });
  window.addEventListener('mousemove', (e) => onMove(e.clientX, e));
  window.addEventListener('mouseup', onUp);
  el.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    onDown(e.touches[0].clientX, e);
  }, { passive: false });
  el.addEventListener('touchmove', (e) => {
    if (!dragging || e.touches.length !== 1) return;
    onMove(e.touches[0].clientX, e);
  }, { passive: false });
  el.addEventListener('touchend', onUp);
  el.addEventListener('touchcancel', onUp);
})();


function fmtTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
function refreshMenu() {
  $('start-best').textContent = String(store.getNum('best', 0));
  if ($('start-time')) $('start-time').textContent = fmtTime(store.getNum('bestTime', 0));
  buildMechPicker();
  refreshStartLock();
}
let _hudAcc = 0;
let _hudSnap = '';
function checkTrialEnd() {
  const g = S.game; if (!g || !HUB.trial) return;
  const left = TRIAL.surviveSec - g.t;
  if (left <= 0 && g.alive) endRun(true);
}
function updateHUD(force = false) {
  const g = S.game; if (!g) return;
  const score = Math.floor(g.score);
  const timeStr = fmtTime(g.t);
  const lv = g.level;
  const hp = Math.max(0, g.hp);
  const xpPct = Math.min(1, g.xp / g.xpNeed);
  const goalLeft = Math.max(0, (g.goalKills || 0) - g.kills);
  const snap = score + '|' + timeStr + '|' + lv + '|' + hp + '|' + xpPct.toFixed(2) + '|' + goalLeft;
  if (!force && snap === _hudSnap) return;
  _hudSnap = snap;
  $('hud-score').textContent = String(score);
  $('hud-time').textContent = timeStr;
  $('hud-lv').textContent = String(lv);
  $('hud-hp').textContent = String(hp);
  $('xp-fill').style.width = (xpPct * 100) + '%';
  const goalEl = $('hud-goal');
  if (goalEl) {
    $('goal-left').textContent = String(goalLeft);
    goalEl.classList.toggle('done', goalLeft === 0);
    const lab = goalEl.querySelector('span');
    if (lab) lab.textContent = goalLeft === 0 ? t('goal.ready') : t('goal.kills');
  }
}

function showMenu() {
  S.state = 'menu';
  document.body.classList.add('in-menu');
  view.hideMenuMech();
  view.setMenuMech(S.mechId);
  view.setPlayerVisible(false);
  S.menuMech = true;
  $('hud').classList.add('hidden');
  const _bhp = $('boss-hp'); if (_bhp) _bhp.classList.add('hidden');
  $('stick').classList.add('hidden');
  Object.assign(pView, defaultView());
  Object.assign(pViewC, defaultView());
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

function cardKindClass(c) {
  if (c.kind === 'armor') return 'kind-armor';
  if (c.kind === 'weapon') return 'kind-weapon';
  return 'kind-util';
}

/** Large readable SVG emblems per upgrade shape (fallback: emoji glyph). */
function cardEmblem(c) {
  const stroke = 'currentColor';
  const sv = (inner) =>
    `<svg class="emblem" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${inner}</svg>`;
  const shapes = {
    bolt: sv(`<path d="M30 6 L18 34 H30 L26 58 L48 26 H34 L38 6 Z" fill="${stroke}" opacity=".95"/>`),
    clock: sv(`<circle cx="32" cy="32" r="22" fill="none" stroke="${stroke}" stroke-width="4"/>
      <path d="M32 16 V34 L44 40" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`),
    orbit: sv(`<circle cx="32" cy="32" r="8" fill="${stroke}"/>
      <ellipse cx="32" cy="32" rx="26" ry="12" fill="none" stroke="${stroke}" stroke-width="3" transform="rotate(-25 32 32)"/>
      <circle cx="54" cy="24" r="4" fill="${stroke}"/>`),
    spread: sv(`<path d="M32 50 L32 14 M32 32 L14 12 M32 32 L50 12 M32 32 L18 28 M32 32 L46 28"
      fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`),
    pierce: sv(`<path d="M10 40 L42 18 L54 14 L48 26 L26 48 Z" fill="${stroke}"/>
      <path d="M42 18 L54 14" stroke="#0a0520" stroke-width="2"/>`),
    lock: sv(`<circle cx="24" cy="32" r="10" fill="none" stroke="${stroke}" stroke-width="3"/>
      <circle cx="40" cy="32" r="10" fill="none" stroke="${stroke}" stroke-width="3"/>
      <circle cx="32" cy="32" r="4" fill="${stroke}"/>`),
    nova: sv(`<path d="M32 6 L36 26 L56 32 L36 38 L32 58 L28 38 L8 32 L28 26 Z" fill="${stroke}"/>`),
    frost: sv(`<path d="M32 8 V56 M12 20 L52 44 M52 20 L12 44" fill="none" stroke="${stroke}" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="5" fill="${stroke}"/>`),
    rail: sv(`<rect x="8" y="28" width="48" height="8" rx="2" fill="${stroke}"/>
      <path d="M50 20 L60 32 L50 44" fill="none" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/>`),
    shield: sv(`<path d="M32 8 L52 16 V34 C52 46 40 54 32 58 C24 54 12 46 12 34 V16 Z"
      fill="none" stroke="${stroke}" stroke-width="4"/><path d="M32 18 V46" stroke="${stroke}" stroke-width="3"/>`),
    plate: sv(`<rect x="14" y="14" width="36" height="36" rx="4" fill="none" stroke="${stroke}" stroke-width="4"/>
      <rect x="22" y="22" width="20" height="20" rx="2" fill="${stroke}" opacity=".85"/>`),
    deflect: sv(`<path d="M12 40 Q32 8 52 40" fill="none" stroke="${stroke}" stroke-width="4"/>
      <path d="M20 28 L32 18 L44 28" fill="none" stroke="${stroke}" stroke-width="3.5"/>`),
    swift: sv(`<path d="M10 40 H34 L28 52 M10 32 H42 L36 44 M10 24 H50 L44 36"
      fill="none" stroke="${stroke}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`),
    magnet: sv(`<path d="M18 18 V34 A14 14 0 0 0 46 34 V18" fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/>
      <rect x="14" y="14" width="10" height="10" rx="2" fill="${stroke}"/><rect x="40" y="14" width="10" height="10" rx="2" fill="${stroke}"/>`),
    heart: sv(`<path d="M32 50 C18 40 10 30 10 22 A10 10 0 0 1 32 18 A10 10 0 0 1 54 22 C54 30 46 40 32 50 Z" fill="${stroke}"/>`),
    orb: sv(`<circle cx="32" cy="28" r="14" fill="none" stroke="${stroke}" stroke-width="4"/>
      <circle cx="32" cy="28" r="6" fill="${stroke}"/>
      <path d="M24 44 H40 M28 50 H36" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round"/>`),
  };
  if (c.shape && shapes[c.shape]) return shapes[c.shape];
  return `<span class="emblem-glyph">${c.icon || '◆'}</span>`;
}

let _beatBannerT = 0;
function showBeatBanner(zh, en, ms = 1600, opts = {}) {
  const el = $('beat-banner');
  const zhEl = $('beat-zh');
  const enEl = $('beat-en');
  if (!el) return;
  if (zhEl) zhEl.textContent = zh || t('beat.eliteIn');
  if (enEl) enEl.textContent = en || t('beat.eliteInEn');
  el.classList.toggle('boss', !!opts.boss);
  el.classList.remove('hidden');
  clearTimeout(_beatBannerT);
  _beatBannerT = setTimeout(() => el.classList.add('hidden'), ms);
}

function updateBossHp() {
  const bar = $('boss-hp');
  if (!bar) return;
  const g = S.game;
  const boss = g && g.enemies ? g.enemies.find((e) => e.boss) : null;
  if (!boss || !g.alive) {
    bar.classList.add('hidden');
    return;
  }
  bar.classList.remove('hidden');
  const zh = $('boss-hp-zh');
  const en = $('boss-hp-en');
  if (zh) zh.textContent = boss.nameZh || t('boss.hp');
  if (en) en.textContent = boss.nameEn || 'SWARM CORE';
  const fill = $('boss-hp-fill');
  if (fill) {
    const pct = Math.max(0, Math.min(1, boss.hp / Math.max(1, boss.maxHp)));
    fill.style.width = (pct * 100) + '%';
  }
}

function resumeAfterCardPick() {
  // applyCard may have opened a deferred level-up (XP banked during pickup pause).
  if (S.game && S.game.pausedForLevel && S.game.pendingCards && S.game.pendingCards.length) {
    showLevelCards(S.game.pendingCards, { from: S.game.pendingFrom || 'level' });
    return;
  }
  ui.show(null);
  S.state = 'play';
  // Stick stays hidden until press — drag-anywhere reveals it under the finger.
  const touch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 || flags.get('stick') === '1' || S.demo;
  $('stick').classList.toggle('hidden', !touch);
  $('stick').classList.remove('active', 'following');
}

function showLevelCards(cards, opts = {}) {
  if (!cards || !cards.length) {
    // Safety net: a level-up must never silently swallow the pick (v0.3.3 left the run running with no card).
    return;
  }
  S.state = 'level';
  const from = opts.from || (S.game && S.game.pendingFrom) || 'level';
  const title = $('level-title');
  if (title) {
    title.textContent = from === 'pickup'
      ? t('pickup.title')
      : t('levelUp');
  }
  const box = $('level-cards');
  box.innerHTML = '';
  let prevTaken = S.game.taken || {};
  cards.forEach((c) => {
    const b = document.createElement('button');
    b.className = 'level-card ' + cardKindClass(c);
    b.type = 'button';
    const kind = c.kind === 'armor'
      ? (i18n.isZh() ? '裝甲' : 'ARMOR')
      : c.kind === 'weapon'
        ? (i18n.isZh() ? '武器' : 'WEAPON')
        : (i18n.isZh() ? '輔助' : 'UTIL');
    const showCount = c.max != null && !String(c.id || '').startsWith('_pickup_');
    const times = showCount ? `<em class="card-count">${prevTaken[c.id] || 0}/${c.max}</em>` : '';
    b.innerHTML =
      `<span class="card-icon" aria-hidden="true">${cardEmblem(c)}</span>` +
      `<span class="card-body"><b>${i18n.isZh() ? c.zh : c.en}</b>` +
      `<em class="card-kind">${kind}</em>${times}` +
      `<small>${i18n.isZh() ? c.descZh : c.descEn}</small></span>`;
    b.addEventListener('click', () => {
      audio.pick();
      S.game.applyCard(c);
      resumeAfterCardPick();
    });
    box.appendChild(b);
  });
  ui.show('level');
  audio.levelChime();
}
S.showLevelCards = showLevelCards;

function startRun() {
  if (!isMechPlayable(S.mechId)) {
    refreshStartLock();
    try { audio.click(); } catch (_) {}
    return;
  }
  audio.init();
  view.hideMenuMech();
  S.menuMech = false;
  view.setPlayerVisible(true);
  S.game = new Game({
    seed: (Date.now() & 0xffff) ^ ((Math.random() * 1e6) | 0),
    endless: true,
    mech: S.mechId,
  });
  // QA / screenshot: ?arsenal=1 unlocks every special weapon at stack 1
  if (flags.get('arsenal') === '1') {
    const g = S.game;
    g.laser = Math.max(g.laser, 1);
    g.shotgun = Math.max(g.shotgun, 1);
    g.rocket = Math.max(g.rocket, 1);
    g.grenade = Math.max(g.grenade, 1);
    g.plasma = Math.max(g.plasma, 1);
    g.taken = { ...(g.taken || {}), laser: 1, shotgun: 1, rocket: 1, grenade: 1, plasma: 1 };
  }
  view.setMech(S.mechId);
  S.state = 'play';
  S.demoT = 0;
  S.newRecord = false;
  Object.assign(pView, defaultView());
  Object.assign(pViewC, defaultView());
  document.body.classList.remove('in-menu');
  view.setVisible(true);
  ui.show(null);
  $('hud').classList.remove('hidden');
  $('demo-tag').classList.toggle('hidden', !S.demo);
  const touch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 || flags.get('stick') === '1' || S.demo;
  $('stick').classList.toggle('hidden', !touch);
  $('stick').classList.add('ready');
  $('stick').classList.remove('active', 'following');
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
  if ($('over-best-time')) $('over-best-time').textContent = fmtTime(store.getNum('bestTime', 0));
  $('over-kills').textContent = String(g.kills);
  if ($('over-goals')) $('over-goals').textContent = String(g.goalsCleared || 0);
  $('over-record').classList.toggle('hidden', !S.newRecord);
  const who = g.killer ? (i18n.isZh() ? g.killer.zh : g.killer.en) : null;
  $('over-note').textContent = trial
    ? (i18n.isZh() ? '試玩時間到 · 解鎖金級繼續暴走' : 'Trial time up — unlock Gold to keep rampaging')
    : (who ? t('killedBy', { who }) : t('overNote'));
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
    dx = Math.cos(S.demoT * 0.7) + Math.sin(S.demoT * 1.3) * 0.3;
    dz = Math.sin(S.demoT * 0.7) * 0.8;
  }
  if (dx || dz) g.moveDir(dx, dz);
  else g.stopMove();
}

// ---- virtual stick: drag-anywhere; widget/glow follows press (no blocking finger overlay)
(function bindStick() {
  const root = $('stick');
  const knob = $('stick-knob');
  let pid = null, cx = 0, cy = 0;
  const R = 56;
  const DEAD = 8;
  const HALF = 66; // stick widget half-size (css 132px)
  const setKnob = (x, y) => { knob.style.transform = `translate(${x}px,${y}px)`; };
  const placeAt = (x, y) => {
    // Center the translucent stick on the press point so glow follows the finger.
    root.style.left = Math.round(x - HALF) + 'px';
    root.style.top = Math.round(y - HALF) + 'px';
    root.style.right = 'auto';
    root.style.bottom = 'auto';
  };
  const resetHome = () => {
    // Park off-corner when idle — never leave a big opaque pad under the playfield.
    root.style.left = '';
    root.style.top = '';
    root.style.right = '';
    root.style.bottom = '';
    root.classList.remove('active', 'following');
  };
  const begin = (clientX, clientY, pointerId) => {
    pid = pointerId;
    cx = clientX; cy = clientY;
    placeAt(cx, cy);
    setKnob(0, 0);
    S.stick.active = true;
    S.stick.dx = 0; S.stick.dy = 0;
    root.classList.add('active', 'following');
    root.classList.remove('hidden');
    audio.init();
  };
  const onMove = (e) => {
    if (!S.stick.active || pid == null) return;
    const pts = e.changedTouches ? [...e.changedTouches] : [e];
    const tch = pts.find((x) => (x.pointerId ?? x.identifier ?? 'mouse') === pid) || pts[0];
    if (!tch) return;
    let dx = tch.clientX - cx, dy = tch.clientY - cy;
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
  const onUp = (e) => {
    if (pid == null) return;
    if (e && e.pointerId != null && e.pointerId !== pid) return;
    S.stick.active = false; S.stick.dx = 0; S.stick.dy = 0; setKnob(0, 0); pid = null;
    resetHome();
  };
  // Any playfield press (except real UI controls) starts the stick. ViewInput keeps pinch zoom.
  // Listen on window so transparent HUD chrome / safe-area overlays cannot swallow the down.
  const UI_BLOCK = 'button, a, input, textarea, select, .level-card, .icon-btn, .neon-btn';
  const onPlayfieldDown = (e) => {
    if (S.state !== 'play') return;
    if (e.target.closest && e.target.closest(UI_BLOCK)) return;
    if (e.target.closest && e.target.closest('.screen:not(.hidden)')) return;
    if (e.pointerType === 'touch' && e.isPrimary === false) return;
    if (pid != null) return;
    begin(e.clientX, e.clientY, e.pointerId ?? 'mouse');
    if (e.cancelable) e.preventDefault();
  };
  window.addEventListener('pointerdown', onPlayfieldDown, { passive: false });
  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
})();

window.addEventListener('keydown', (e) => {
  S.keys[e.code] = true;
  audio.init();
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (S.state === 'play') pauseRun();
    else if (S.state === 'pause') { S.state = 'play'; ui.show(null); }
  }
  if (e.code === 'KeyM') { audio.toggleMute(); ui.setMuted(audio.muted); }
  // Mild zoom shortcuts
  if (e.code === 'Equal' || e.code === 'NumpadAdd') {
    pView.zoom *= 0.94; clampView(pView, viewPitch, viewExt, ZOOM_LIM);
  }
  if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
    pView.zoom *= 1.06; clampView(pView, viewPitch, viewExt, ZOOM_LIM);
  }
});
window.addEventListener('keyup', (e) => { S.keys[e.code] = false; });

$('btn-play')?.addEventListener('click', () => startRun());
$('btn-endless')?.addEventListener('click', () => startRun());
$('btn-pause')?.addEventListener('click', () => { pauseRun(); });
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
  if (S.gfxLost) return true;
  if (S.state === 'level') return true;
  if (S.state === 'pause') { S.state = 'play'; ui.show(null); return true; }
  if (S.state === 'over') { showMenu(); return true; }
  if (S.state === 'play') { pauseRun(); return true; }
  return false;
});

function tick(dt) {
  if (S.demo && S.state === 'level' && S.game?.pendingCards?.length) {
    S.demoT = (S.demoT || 0) + dt;
    if (S.demoT > 1.2) {
      S.demoT = 0;
      const c = S.game.pendingCards[0];
      audio.pick();
      S.game.applyCard(c);
      resumeAfterCardPick();
    }
  }
  if (S.state === 'menu') {
    const cam = stage.camera;
    const tm = performance.now() * 0.001;
    // Showcase framing from updateMenuLayout (desktop right-column vs mobile centered).
    // Yaw the MECH (view.nudgeMenuYaw), not the camera orbit.
    const mc = view._menuCam || { pos: [0.15, 3.15, 5.4], lookAt: [0, 1.15, 0] };
    cam.position.set(mc.pos[0], mc.pos[1], mc.pos[2]);
    cam.lookAt(mc.lookAt[0], mc.lookAt[1], mc.lookAt[2]);
    if (S.menuMech) view.updateMenu(tm);
    return;
  }
  if (!S.game) return;
  if (S.state === 'over') return;
  if (S.state === 'play') applyMoveFromInput();
  const { events } = S.state === 'play' ? S.game.step(dt) : { events: [] };
  for (const ev of events) {
    if (ev.type === 'fire') {
      audio.fire();
      const g = S.game;
      // Muzzle flash uses the SAME coords computed once at bullet spawn (js/muzzle.js).
      const mx = ev.muzzleX != null ? ev.muzzleX : g.px;
      const my = ev.muzzleY != null ? ev.muzzleY : 0.95;
      const mz = ev.muzzleZ != null ? ev.muzzleZ : g.pz;
      const muzzle = new THREE.Vector3(mx, my, mz);
      particles.burst(muzzle, new THREE.Color(0x00e5ff), burstN(3), { speed: 2.4, up: 0.3, life: 0.2, size: 0.32, bright: 1.0 });
      // v0.9.20: skip muzzle secondary burst on mobile (pool pressure)
      if (!MOBILE_GFX) {
        particles.burst(muzzle, new THREE.Color(0x7ad7ff), burstN(2), { speed: 1.2, up: 0.5, life: 0.16, size: 0.26, bright: 0.9 });
      }
    }
        else if (ev.type === 'hit') {
      audio.hit();
      if (ev.x != null) {
        const c = new THREE.Color(ev.color || 0x00e5ff);
        const n = ev.heavy ? 22 : 12;
        particles.burst(new THREE.Vector3(ev.x, 0.5, ev.z), c, burstN(Math.min(n, 8)), { speed: ev.heavy ? 4 : 3, up: 1.2, life: 0.55, bright: 1.0 });
        // v0.8.5: no white hit particles
        if (ev.heavy) kickFx({ trauma: 0.08, slowmo: 0.04, bloomDamp: 0.35 });
      }
    }
    else if (ev.type === 'kill') {
      audio.kill();
      const c = new THREE.Color(ev.enemy.color);
      const human = ev.enemy.family === 'human';
      const pos = new THREE.Vector3(ev.enemy.x, 0.4, ev.enemy.z);
      const punch = !!(ev.gore || ev.elite);
      // Ordinary kills: local particles/ring only — no chain slowmo at high kill rate.
      // Elite / gore / heavy: keep noticeable trauma + hit-stop.
      particles.burst(pos, c, burstN(punch ? (human ? 6 : 10) : (human ? 4 : 6)), { speed: punch ? 4 : 2.6, up: punch ? 1.8 : 1.1, life: punch ? 0.45 : 0.28, bright: 1.0 });
      if (punch) {
        particles.burst(pos, new THREE.Color(0x00e5ff), burstN(4), { speed: 2.2, up: 2.5, life: 0.35, size: 0.45, bright: 0.95 });
        particles.ring(pos, c, 10, 6, 0.3);
        waves.spawn(pos, c, { r0: 0.3, r1: 2.0, dur: 0.4, a: 0.75 });
        if (view.burstGore) view.burstGore(ev.enemy.x, ev.enemy.z, ev.enemy.color || 0x8a93a8);
        kickFx({ trauma: 0.12, slowmo: 0.06, fovKick: 0.02, bloomDamp: 0.85 });
        const flash = $('fx-flash');
        if (flash) { flash.classList.add('on'); clearTimeout(flash._t); flash._t = setTimeout(() => flash.classList.remove('on'), 45); }
      } else if (!MOBILE_GFX) {
        // Ordinary kill ring/wave skipped on mobile (v0.9.6); small burst kept above.
        particles.ring(pos, c, 6, 3.5, 0.18);
        waves.spawn(pos, c, { r0: 0.2, r1: 1.1, dur: 0.28, a: 0.4 });
      }
    }
    else if (ev.type === 'explode') {
      audio.nova();
      const pos = new THREE.Vector3(ev.x, 0.2, ev.z);
      const col = new THREE.Color(ev.tag === 'plasma' ? 0xb8ff3a : 0x00e5ff);
      particles.burst(pos, col, burstN(12), { speed: 4.5, up: 1.8, life: 0.4, size: 0.55, bright: 1.0 });
      // boss color merged; v0.9.20: skip explode ring on mobile
      if (!MOBILE_GFX) particles.ring(pos, col, 12, 7, 0.28);
      waves.spawn(pos, col, { r0: 0.35, r1: (ev.r || 1.6) * 1.1, dur: 0.4, a: 0.8 });
      if (view.burstGore) view.burstGore(ev.x, ev.z, 0x8a93a8);
      kickFx({ trauma: 0.1, slowmo: 0.04, fovKick: 0.03, bloomDamp: 0.9 });
    }
    else if (ev.type === 'puddle') {
      if (!MOBILE_GFX) particles.ring(new THREE.Vector3(ev.x, 0.08, ev.z), new THREE.Color(0xb8ff3a), 8, 4, 0.18);
    }
else if (ev.type === 'xp') {
      audio.xp();
      particles.burst(new THREE.Vector3(ev.x || S.game.px, 0.6, ev.z || S.game.pz), new THREE.Color(0x3bff8a), burstN(8), { speed: 2.4, up: 1.8, size: 0.55, bright: 1.0 });
      // v0.9.20: skip xp secondary burst on mobile
      if (!MOBILE_GFX) {
        particles.burst(new THREE.Vector3(ev.x || S.game.px, 0.8, ev.z || S.game.pz), new THREE.Color(0x7affc0), burstN(4), { speed: 1.4, up: 2.2, life: 0.4, size: 0.4, bright: 0.9 });
      }
    }
    else if (ev.type === 'heal') {
      audio.xp();
      particles.burst(new THREE.Vector3(S.game.px, 0.7, S.game.pz), new THREE.Color(0x00e5ff), burstN(10), { speed: 2.5, up: 2, size: 0.5, bright: 1.0 });
      // v0.9.20: skip heal ring on mobile (pickup-adjacent non-essential)
      if (!MOBILE_GFX) particles.ring(new THREE.Vector3(S.game.px, 0.1, S.game.pz), new THREE.Color(0x00e5ff), 10, 5, 0.2);
    }
    else if (ev.type === 'weapon') {
      audio.nova();
      particles.burst(new THREE.Vector3(S.game.px, 0.8, S.game.pz), new THREE.Color(0xffe600), burstN(10), { speed: 2.8, up: 2.2, size: 0.5, bright: 1.0 });
    }
    else if (ev.type === 'hurt') {
      // Hurt feedback only — applyMoveFromInput / setMove still run during hitFlash/invuln.
      audio.hurt();
      kickFx({ trauma: 0.14, aberr: 0.12, bloomDamp: 0.7 });
      particles.burst(new THREE.Vector3(S.game.px, 0.7, S.game.pz), new THREE.Color(0xff2bd6), burstN(8), { speed: 3.2, up: 1.4, size: 0.45, bright: 1.0 });
      const flash = $('fx-flash');
      if (flash) { flash.classList.add('on'); clearTimeout(flash._t); flash._t = setTimeout(() => flash.classList.remove('on'), 50); }
    }
    else if (ev.type === 'dead') endRun(false);
    else if (ev.type === 'levelup') showLevelCards(ev.cards, { from: ev.from || 'level' });
    else if (ev.type === 'nova') {
      audio.nova();
      view.pulseNova(ev.r);
      const npos = new THREE.Vector3(S.game.px, 0.05, S.game.pz);
      particles.burst(npos.clone().setY(0.4), new THREE.Color(0xffe600), burstN(14), { speed: 5, up: 1.4, life: 0.4, size: 0.6, bright: 1.0 });
      if (!MOBILE_GFX) particles.ring(npos, new THREE.Color(0xffe600), 12, 6, 0.22);
      waves.spawn(npos, new THREE.Color(0xffe600), { r0: 0.4, r1: ev.r * 1.1, dur: 0.4, a: 0.85 });
      kickFx({ trauma: 0.12, bloomDamp: 1.0 });
    }
    else if (ev.type === 'wave') {
      audio.wave();
      if (!MOBILE_GFX) particles.ring(new THREE.Vector3(S.game.px, 0.1, S.game.pz), new THREE.Color(0xff2bd6), 10, 5, 0.18);
    }
    else if (ev.type === 'zoneEnter') {
      const zoneKey = {
        rooftop: 'zone.rooftop',
        blockade: 'zone.blockade',
        reactor: 'zone.reactor',
        assembly: 'zone.assembly',
      }[ev.zone] || 'zone.assembly';
      const zoneKeyEn = {
        rooftop: 'zone.rooftopEn',
        blockade: 'zone.blockadeEn',
        reactor: 'zone.reactorEn',
        assembly: 'zone.assemblyEn',
      }[ev.zone] || 'zone.assemblyEn';
      const zh = t(zoneKey);
      const en = t(zoneKeyEn);
      showBeatBanner(zh, en, 1800);
      try { audio.wave(); } catch (_) {}
    }
    else if (ev.type === 'eliteIn' || (ev.type === 'beat' && ev.kind === 'elite')) {
      const zh = ev.nameZh
        ? (`精英出現 · ${ev.nameZh}`)
        : t('beat.eliteIn');
      const en = ev.nameEn
        ? (`ELITE INBOUND · ${ev.nameEn}`)
        : t('beat.eliteInEn');
      showBeatBanner(zh, en, 1800);
      audio.wave();
      // v0.9.20: skip elite inbound bloom kick on mobile
      if (!MOBILE_GFX) kickFx({ trauma: 0.08, bloomDamp: 0.5 });
    }
    else if (ev.type === 'bossIn' || (ev.type === 'beat' && ev.kind === 'boss')) {
      const zh = ev.nameZh
        ? (`Boss 出現 · ${ev.nameZh}`)
        : t('beat.bossIn');
      const en = ev.nameEn
        ? (`BOSS INBOUND · ${ev.nameEn}`)
        : t('beat.bossInEn');
      showBeatBanner(zh, en, 2200, { boss: true });
      audio.wave();
      kickFx({ trauma: 0.12, bloomDamp: 0.7 });
      updateBossHp();
    }
    else if (ev.type === 'phase' && ev.phase) {
      const key = 'boss.phase.' + ev.phase;
      try {
        const zh = t(key);
        // Only flash phase banner for volley/frenzy (orbit is inbound)
        if (ev.phase === 'volley' || ev.phase === 'frenzy') {
          showBeatBanner(zh, ev.phase.toUpperCase() + ' PHASE', 1200, { boss: true });
        }
      } catch (_) {}
    }
    else if (ev.type === 'telegraph') {
      // View syncs warning lane / boss lanes from hazards; light audio cue
      try { audio.wave(); } catch (_) {}
    }
    else if (ev.type === 'eliteCharge') {
      // v0.9.20: mobile — trauma only, no bloomDamp
      if (MOBILE_GFX) kickFx({ trauma: 0.05, fovKick: 0.01 });
      else kickFx({ trauma: 0.1, fovKick: 0.02, bloomDamp: 0.6 });
    }
    else if (ev.type === 'bossVolley') {
      if (MOBILE_GFX) kickFx({ trauma: 0.04, fovKick: 0.01 });
      else kickFx({ trauma: 0.08, fovKick: 0.015, bloomDamp: 0.5 });
    }
    else if (ev.type === 'bossKill') {
      kickFx({ trauma: 0.16, bloomDamp: 1.0 });
      audio.nova();
    }
  }

  // v0.8.4: removed per-frame foot thruster particles (move sparks + bloom white-out)
  if (S.state === 'play' || S.state === 'level' || S.state === 'pause') {
    if (S.state === 'play') {
      dampView(pViewC, pView, dt);
      view.setZoom(pViewC.zoom);
      particles.update(dt);
      waves.update(dt);
      fx.update(dt);
      view.sync(S.game, dt);
      view.frameCamera(stage.camera, S.game, dt);
      fx.shake(stage.camera, performance.now() * 0.001, 0.45);
      fx.applyPost(stage, performance.now() * 0.001);
      checkTrialEnd();
      _hudAcc += dt;
      if (_hudAcc >= 0.1) { _hudAcc = 0; updateHUD(); updateBossHp(); }
      if (S.demo && S.game.t > 50) endRun(false);
    } else if (S.game) {
      view.sync(S.game, dt);
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
  if (flags.debug) {
    window.__NS = { get game() { return S.game; }, get S() { return S; }, view, stage, audio };
  }
  const PERF = flags.get('perf') === '1';
  let _perfAcc = 0, _perfFrames = 0, _perfNearestMs = 0;
  stage.loop((dt, time, rawDt) => {
    if (S.gfxLost) return; // freeze game + render after context loss (overlay owns the screen)
    const capped = Math.min(0.05, dt);
    if (PERF && S.game && S.state === 'play') {
      const t0 = performance.now();
      tick(capped * (fx.timeScale || 1));
      const elapsed = performance.now() - t0;
      _perfAcc += elapsed; _perfFrames++;
      if (_perfFrames >= 60) {
        console.log('[perf] avg tick ms', (_perfAcc / _perfFrames).toFixed(2),
          'enemies', S.game.enemies.length, 'bullets', S.game.bullets.length);
        _perfAcc = 0; _perfFrames = 0;
      }
    } else {
      tick(capped * (fx.timeScale || 1));
    }
    city.update(time, capped, stage.camera);
    stage.render(rawDt);
  }, { isActive: () => true, fpsEl: $('fps') });
  if (flags.fps) $('fps').classList.remove('hidden');
  ads.init().catch(() => {});
}
boot().catch((e) => { console.error(e); showGfxRecover('boot'); });
