// RAMPAGE MECH 暴走機甲 — tip v0.9.181
import * as THREE from 'three';
import {
  i18n, t, flags, createStore, createStage, ThemeController, NeonCity, CyberUI, Platform,
  createAds, readHub, returnToHub as kitReturnToHub, shouldShowArcadeMenu, Particles, Shockwaves, FxState,
  ViewInput, defaultView, clampView, dampView,
} from 'cyber-kit';
import { GAME_ID, ADS, TRIAL, ARENA, MECHS, MECH_BY_ID, PLAYER, resolveMechCombat, isMechPlayable, isSlotWeapon, hasEmptyWeaponSlot, CARDS_BY_ID, weaponDef, normalizeWeaponId, WEAPON_ICON, starterLoadout, flattenLoadout, weaponLevel } from './config.js';
import './strings.js';
import { Game } from './logic.js';
import { View } from './view.js';
import { SwarmAudio } from './audio.js';
import { shouldAutoPauseOnHidden } from './bg-pause.js';
import {
  computeShedLevel, pixelRatioForShed, bloomStrengthForShed,
  shouldSkipParticleTick, shouldSkipPostFx, shouldSkipFeelRing, shouldCoolPause,
  buildInterruptSnapshot, writeInterruptSnapshot, readInterruptSnapshot,
  clearInterruptSnapshot, formatInterruptNote, SHED,
} from './webgl-guard.js';
import { createBannerController, BANNER_MS } from './banner-queue.js';
import {
  shouldShowCoach, markCoachSeen, zoneShortLabel, formatLoadoutFromGame,
  zoneChipInfo,
  COACH_MS, HURT_VIGNETTE_MS, STICK_HINT_MS,
} from './run-loop-ux.js';
import {
  createEarlyFeedbackState, resetEarlyFeedback,
  noteFirstKill, noteFirstLevel, noteFirstHeal, takePendingEarly,
  FIRST_KILL_MS, EARLY_COPY,
} from './early-feedback.js';
import {
  createStreakState, resetStreak, noteStreakKill, noteStreakBreak,
  STREAK_TOAST_MS, STREAK_WINDOW_MS,
} from './kill-streak.js';
import {
  buildShareText, canNativeShare, shareButtonLabels, confirmCopy, shareOrCopy,
  LIVE_URL, SHARE_CONFIRM_MS,
} from './result-share.js';
import {
  createDamageFloatPool, ndcToCss,
  DMG_FLOAT_MAX_DESKTOP, DMG_FLOAT_MAX_MOBILE,
} from './damage-numbers.js';
import {
  applyMuteUi, applyMutePreference, writeMutedToStore, readMutedFromStore, muteTipFor,
  MUTE_STORE_KEY, MUTE_LS_KEY,
} from './mute-persist.js';
import { slotIndexForWeapon, SLOT_FIRE_PULSE_MS } from './slot-fire-pulse.js';
import {
  muzzleFeelFx, explodeFeelFx, chargeFeelFx, stickFeelFx, frostHitFeelFx,
  slowFieldFeelFx, deployDronesFeelFx, blackholeFeelFx, flashFeelFx, puddleFeelFx,
} from './weapons-feel-fx.js';
import { weaponIconHtml, WEAPON_ICON_SRC } from './weapons-icons.js';

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
const PARTICLE_POOL = MOBILE_GFX ? 1600 : 5200; // v0.9.54: raise mobile baseline (was 800)
const MAX_PR = MOBILE_GFX ? 1 : 2;
/** Scale burst counts on mobile (further cut vs v0.9.5 for GPU stability). */
const burstN = (n) => MOBILE_GFX ? Math.max(1, Math.round(n * 0.55)) : n; // v0.9.54 prettier baseline
/** Apply feel-FX recipe steps through existing Particles / Shockwaves pools. */
function applyFeelBursts(pos, steps, { waves: wavesApi = waves } = {}) {
  if (!steps || !steps.length) return;
  for (const s of steps) {
    const n = burstN(s.n);
    particles.burst(pos, new THREE.Color(s.color), n, {
      speed: s.speed, up: s.up, life: s.life, size: s.size, bright: s.bright,
    });
    if (s.ring && !MOBILE_GFX) {
      particles.ring(pos, new THREE.Color(s.color), s.ring.n || 10, s.ring.speed || 5, s.ring.life || 0.22);
    }
    if (s.wave && wavesApi) {
      wavesApi.spawn(pos, new THREE.Color(s.color), s.wave);
    }
    if (s.flashMs) {
      const flash = $('fx-flash');
      if (flash) {
        flash.classList.add('on');
        clearTimeout(flash._t);
        flash._t = setTimeout(() => flash.classList.remove('on'), s.flashMs);
      }
    }
  }
}


const ui = new CyberUI({ screens: ['start', 'pause', 'over', 'level', 'gfx'] });

/** Show recoverable graphics overlay (context loss or boot WebGL fail). Prefer reload over soft restore. */
function showGfxRecover(kind = 'lost') {
  const body = $('gfx-body');
  const bodyEn = $('gfx-body-en');
  let zh = kind === 'boot' ? t('gfx.boot') : t('gfx.lost');
  let en = kind === 'boot' ? t('gfx.bootEn') : t('gfx.lostEn');
  // v0.9.51: append last-run interrupt note when snapshot survives reload
  if (kind === 'lost') {
    try {
      const snap = readInterruptSnapshot(typeof sessionStorage !== 'undefined' ? sessionStorage : null);
      const noteZh = formatInterruptNote(snap, true);
      const noteEn = formatInterruptNote(snap, false);
      if (noteZh) zh = zh + '\n\n' + noteZh;
      if (noteEn) en = en + '\n\n' + noteEn;
    } catch (_) {}
  }
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
  bloom: MOBILE_GFX ? 0.15 : 0.22, bloomRadius: 0.28, bloomThreshold: MOBILE_GFX ? 0.95 : 0.94, // v0.9.54 mobile prettier
  fov: 42, exposure: 0.88,
  glow: 'low',
  glowLevels: { low: { strength: MOBILE_GFX ? 0.15 : 0.22, radius: 0.35, threshold: 0.25 } },
  maxPixelRatio: MAX_PR,
  // Recoverable copy — GPU process death is not "browser lacks WebGL forever"
  onFatal: () => showGfxRecover('boot'),
});
// PAUSE-GLOW-TO-SETTINGS-001: no pause #btn-glow — quality/畫質 lives in settings only (mountSettings)
stage.setGlow('low'); // v0.8.5: force low glow (ignore shared high from other games)
// v0.9.20: clamp bloom base after setGlow so mobile stays low even if prefs flip
if (MOBILE_GFX) {
  try {
    stage.bloomBase = Math.min(stage.bloomBase ?? 0.15, 0.15); // v0.9.54
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
// Phase 2 ambient: keep floor darker than enemies / bullets / pickups / telegraphs.
if (city.hemi) city.hemi.intensity = Math.min(city.hemi.intensity, 0.28);
if (city.dirLight) city.dirLight.intensity = Math.min(city.dirLight.intensity, 0.40);

const view = new View(stage);
view.setVisible(false);
const particles = new Particles(stage.scene, PARTICLE_POOL, { floorY: 0.02 });
stage.onResize((w, h, pr) => {
  particles.resize(h, pr);
  // Keep menu mech framing in sync on resize / orientation change (not only first setMenuMech).
  if (view.menuMech) view.updateMenuLayout(w, h);
});
const waves = new Shockwaves(stage.scene, MOBILE_GFX ? 16 : 24); // v0.9.54
const fx = new FxState();

// v0.9.34: DOM floating damage / heal / hurt digits (mobile-light pool)
const _dmgRoot = $('dmg-floats');
const dmgFloats = _dmgRoot
  ? createDamageFloatPool(_dmgRoot, {
      max: MOBILE_GFX ? DMG_FLOAT_MAX_MOBILE : DMG_FLOAT_MAX_DESKTOP,
    })
  : null;
const _dmgProj = new THREE.Vector3();
function worldXZToScreen(x, z, y = 0.95) {
  const cam = stage.camera;
  const canvas = stage.renderer?.domElement || $('scene');
  if (!cam || !canvas) return null;
  _dmgProj.set(x, y, z).project(cam);
  if (_dmgProj.z > 1.05) return null;
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  return ndcToCss(_dmgProj.x, _dmgProj.y, w, h);
}
function spawnCombatFloat(opts) {
  if (!dmgFloats || !opts) return;
  let left = opts.left, top = opts.top;
  if (left == null || top == null) {
    const scr = worldXZToScreen(
      opts.x != null ? opts.x : (S.game && S.game.px) || 0,
      opts.z != null ? opts.z : (S.game && S.game.pz) || 0,
      opts.y != null ? opts.y : 0.95,
    );
    if (!scr) return;
    left = scr.left + (opts.jitterX || 0);
    top = scr.top + (opts.jitterY || 0);
  }
  dmgFloats.spawn({
    kind: opts.kind,
    amount: opts.amount,
    left, top,
    heavy: opts.heavy,
    frontBlock: opts.frontBlock,
    key: opts.key,
  });
}

/** Mobile: clamp bloomDamp and roughly half trauma/slowmo so late-run AoE cannot white-out GPU. Desktop unchanged.
 *  v0.9.20: bloomDamp cap 0.25→0.18 (stronger mid-run GPU cut). */
function kickFx(o) {
  if (!MOBILE_GFX) { fx.kick(o); return; }
  const m = { ...o };
  const shed = S._shedLevel | 0;
  // v0.9.126 PHONE-GPU-DEEPEN-001 — further clamp under mid-run shed (no soft-juice invent)
  let bloomCap = 0.22;
  let traumaMul = 0.5;
  let slowMul = 0.5;
  if (shed >= 3) { bloomCap = 0.10; traumaMul = 0.28; slowMul = 0.28; }
  else if (shed >= 2) { bloomCap = 0.14; traumaMul = 0.36; slowMul = 0.36; }
  else if (shed >= 1) { bloomCap = 0.18; traumaMul = 0.42; slowMul = 0.42; }
  if (m.bloomDamp != null) m.bloomDamp = Math.min(m.bloomDamp, bloomCap);
  if (m.trauma != null) m.trauma *= traumaMul;
  if (m.slowmo != null) m.slowmo *= slowMul;
  fx.kick(m);
}
const audio = new SwarmAudio(store);
// Mirror alias key so early-paint script + smoke tests stay aligned with kit store.
writeMutedToStore(store, !!audio.muted);
function muteButtons() {
  // HUD-MUTE-TO-GEAR-001: in-run mute chrome removed; mute lives in settings sheet only.
  return [];
}
function syncMuteChrome() {
  applyMuteUi(!!audio.muted, muteButtons(), { isZh: i18n.isZh() });
  ui.setMuted(audio.muted);
}
function toggleMutePersist() {
  audio.toggleMute();
  writeMutedToStore(store, !!audio.muted);
  syncMuteChrome();
  return audio.muted;
}
syncMuteChrome();
const ads = createAds({ gameId: GAME_ID, ...ADS, flags: AD_FLAGS, onAdOpen: (on) => audio.duckAll(on) });

const S = {
  state: 'menu', demo: !!flags.demo, game: null, mode: 'endless',
  hub: HUB, keys: Object.create(null), stick: { active: false, dx: 0, dy: 0 },
  demoT: 0, newRecord: false, gfxLost: false,
  _shedLevel: 0, _shedHot: 0, _shedFrame: 0, _shedAccMs: 0, _shedAccN: 0,
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
    // v0.9.51: persist tiny interrupt snapshot for post-reload note (not seamless resume)
    try {
      const snap = buildInterruptSnapshot(S.game);
      writeInterruptSnapshot(typeof sessionStorage !== 'undefined' ? sessionStorage : null, snap);
    } catch (_) {}
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
S.weaponIconHtml = weaponIconHtml;
S.WEAPON_ICON_SRC = WEAPON_ICON_SRC;
S.CARDS_BY_ID = CARDS_BY_ID;
S.formatLoadoutFromGame = formatLoadoutFromGame;
S.view = view;
S._coachSessionShown = false;
S._coachTimer = 0;
S._early = createEarlyFeedbackState();
S._earlyToastTimer = 0;
S._streak = createStreakState();
S._stickHintTimer = 0;


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

/** v0.9.48: persistent map-zone chip (zh + EN small; accent by zone). */
function updateZoneHudChip(g) {
  const el = $('hud-zone');
  if (!el) return;
  const info = zoneChipInfo((g && g.mapZone) || 'lab');
  if (el.dataset.zone !== info.id) el.dataset.zone = info.id;
  el.style.setProperty('--zone-accent', info.accent);
  const zh = $('hud-zone-zh');
  const en = $('hud-zone-en');
  if (zh) zh.textContent = info.zh;
  if (en) en.textContent = info.en;
}

function updateHUD(force = false) {
  const g = S.game; if (!g) return;
  const score = Math.floor(g.score);
  const timeStr = fmtTime(g.t);
  const lv = g.level;
  const hp = Math.max(0, g.hp);
  const maxHp = Math.max(1, g.maxHp || hp || 1);
  const xpPct = Math.min(1, g.xp / Math.max(1e-6, g.xpNeed));
  const goalLeft = Math.max(0, (g.goalKills || 0) - g.kills);
  const armor = Math.max(0, Math.floor(g.armor || 0));
  const slotsKey = (g.weaponSlots || []).map((id) => id || '-').join(',')
    + ':' + (g.weaponSlots || []).map((id) => id ? ((g.taken && g.taken[id]) || (id === 'mg' ? 1 : 0)) : 0).join(',');
  const zoneKey = g.mapZone || 'lab';
  const fillKey = _railFillSnap(g);
  const snap = score + '|' + timeStr + '|' + lv + '|' + hp + '/' + maxHp + '|' + armor
    + '|' + xpPct.toFixed(2) + '|' + goalLeft + '|' + slotsKey + '|' + zoneKey + '|' + fillKey
    + '|' + (g.fireMode || 'primary');
  if (!force && snap === _hudSnap) return;
  _hudSnap = snap;
  $('hud-score').textContent = String(score);
  $('hud-time').textContent = timeStr;
  $('hud-lv').textContent = String(lv);
  $('hud-hp').textContent = String(hp);
  const hpFill = $('hub-hp-fill');
  if (hpFill) hpFill.style.width = (Math.min(1, hp / maxHp) * 100) + '%';
  const xpFill = $('xp-fill');
  if (xpFill) xpFill.style.width = (xpPct * 100) + '%';
  const xpPctEl = $('xp-pct');
  if (xpPctEl) xpPctEl.textContent = Math.round(xpPct * 100) + '%';
  // v0.9.102 XP-BAR-A11Y-001
  const xpBar = document.querySelector('.xp-bar');
  if (xpBar) xpBar.setAttribute('aria-valuenow', String(Math.round(xpPct * 100)));
  const armEl = $('hud-armor');
  const armBlock = $('hub-armor-block');
  if (armEl && armBlock) {
    armEl.textContent = String(armor);
    armBlock.hidden = armor <= 0;
  }
  const goalEl = $('hud-goal');
  if (goalEl) {
    $('goal-left').textContent = String(goalLeft);
    goalEl.classList.toggle('done', goalLeft === 0);
    const lab = goalEl.querySelector('span');
    if (lab) lab.textContent = goalLeft === 0 ? t('goal.ready') : t('goal.kills');
  }
  updateZoneHudChip(g);
  updateWeaponSlotsHUD(g);
}

/** Compact resource/cd key so water-fill rail refreshes without inventing new systems.
 * WEAPONS-RAIL-FILL-EDGE-001: include secondaryBurstLeft so burst drain/snap refreshes HUD. */
function _railFillSnap(g) {
  if (!g) return '';
  const slots = g.weaponSlots || [];
  const parts = [];
  for (let i = 0; i < slots.length; i++) {
    const id = slots[i];
    if (!id) { parts.push('-'); continue; }
    const def = weaponDef(id);
    if (!def) { parts.push(id); continue; }
    if (def.category === 'secondary') {
      const res = g.weaponResources && g.weaponResources[id];
      parts.push(res ? (res.current.toFixed(1) + '/' + res.max) : '0');
    } else if (def.category === 'throw') {
      const cd = (g.throwCdT && g.throwCdT[id]) || 0;
      parts.push(cd.toFixed(2));
    } else {
      parts.push('1');
    }
  }
  const burst = (g.fireMode === 'secondary') ? (g.secondaryBurstLeft | 0) : 0;
  return parts.join(',') + '|b' + burst;
}

function _tileFillRatio(g, id, def) {
  if (!id || !def) return 0;
  if (def.category === 'primary') return 1;
  let r = 1;
  if (def.category === 'secondary') {
    const res = g.weaponResources && g.weaponResources[id];
    if (!res || !res.max) return 0;
    r = Math.max(0, Math.min(1, res.current / res.max));
  } else if (def.category === 'throw') {
    const cdMax = (def.base && def.base.cd) || 1.7;
    const cd = (g.throwCdT && g.throwCdT[id]) || 0;
    if (cdMax <= 0) return 1;
    r = Math.max(0, Math.min(1, 1 - (cd / cdMax)));
  } else {
    return 1;
  }
  // WEAPONS-RAIL-FILL-EDGE-001: snap near-empty / near-full so water edge reads clean
  if (r <= 0.02) return 0;
  if (r >= 0.98) return 1;
  return r;
}

/** Secondary empty or throw fully cooling → drained; throw mid-CD → on-cd. */
function _tileFillEdge(g, id, def, fill) {
  if (!id || !def) return { drained: false, onCd: false };
  if (def.category === 'secondary') {
    return { drained: fill <= 0, onCd: false };
  }
  if (def.category === 'throw') {
    const cd = (g.throwCdT && g.throwCdT[id]) || 0;
    return { drained: fill <= 0, onCd: cd > 0.05 };
  }
  return { drained: false, onCd: false };
}

const SLOT_LABEL = {
  mg: 'GAT', gatling: 'GAT', laser: 'ION', ion_beam: 'ION',
  shotgun: 'SG', rocket: 'TRK', tracking_bomb: 'TRK',
  grenade: 'FRAG', frag: 'FRAG', plasma: 'ACID', acid_gun: 'ACID',
  vulcan: 'VUL', zero_laser: 'ZERO', slow_gun: 'SLOW',
  attack_drone: 'DRN', blackhole: 'BH', chill: 'CHILL', flash: 'FLASH', gravity: 'GRAV',
};
const SLOT_ICON = {
  mg: '⚡', gatling: '⚡', laser: '═', ion_beam: '═',
  shotgun: '✴', rocket: '🚀', tracking_bomb: '🚀',
  grenade: '💣', frag: '💣', plasma: '☣', acid_gun: '☣',
  vulcan: '☢', zero_laser: '❄', slow_gun: '🕸',
  attack_drone: '🛸', blackhole: '◉', chill: '❄', flash: '✦', gravity: '◎',
  ...WEAPON_ICON,
};

function _slotLv(g, id) {
  return weaponLevel(id, g.taken || {});
}

function updateWeaponSlotsHUD(g) {
  const bar = $('weapon-slots');
  if (!bar || !g) return;
  if (g.loadout) g.weaponSlots = flattenLoadout(g.loadout);
  const slots = g.weaponSlots || flattenLoadout(starterLoadout());
  const kids = bar.children;
  for (let i = 0; i < 6; i++) {
    let el = kids[i];
    if (!el) {
      el = document.createElement('div');
      el.className = 'wslot';
      el.setAttribute('data-i', String(i));
      bar.appendChild(el);
    }
    // remove extras beyond 6
    const id = slots[i] || null;
    const def = weaponDef(id);
    el.classList.toggle('empty', !id);
    el.classList.toggle('filled', !!id);
    el.classList.toggle('primary', !!(def && def.category === 'primary'));
    if (!id) {
      el.innerHTML = '<span class="wslot-ico" aria-hidden="true">' + weaponIconHtml(null, { empty: true, size: 22 }) + '</span><span class="wslot-lv"></span>';
      el.title = i18n.isZh() ? '空武器格' : 'Empty slot';
      continue;
    }
    const lv = _slotLv(g, id);
    const lab = def ? (i18n.isZh() ? def.zh : def.en) : (SLOT_LABEL[id] || id.toUpperCase());
    el.innerHTML =
      `<span class="wslot-ico" aria-hidden="true">${weaponIconHtml(id, { size: 22 })}</span>` +
      `<span class="wslot-name">${lab}</span>` +
      `<span class="wslot-lv">Lv${lv}</span>`;
    el.title = `${lab} Lv${lv}`;
  }
  while (bar.children.length > 6) bar.removeChild(bar.lastChild);
  updateWeaponStatusHUD(g);
  updateWeaponRailHUD(g);
}

function updateWeaponStatusHUD(g) {
  const modeEl = $('wstat-mode');
  const nameEl = $('wstat-name');
  const lvEl = $('wstat-lv');
  const resEl = $('wstat-res');
  if (!modeEl || !g) return;
  const zh = i18n.isZh();
  const secondary = g.fireMode === 'secondary';
  const id = secondary
    ? (typeof g.activeSecondaryId === 'function' ? g.activeSecondaryId() : null)
    : (typeof g.activePrimaryId === 'function' ? g.activePrimaryId() : 'gatling');
  const def = weaponDef(id);
  const icoEl = $('wstat-ico');
  if (icoEl) {
    icoEl.innerHTML = id ? weaponIconHtml(id, { size: 22 }) : weaponIconHtml(null, { empty: true, size: 22 });
  }
  modeEl.textContent = secondary ? (zh ? '副' : 'SEC') : (zh ? '主' : 'PRI');
  // v0.9.59: full catalog zh/en titles (機關雷射炮 etc.), not truncated short labels
  nameEl.textContent = def ? (zh ? def.zh : def.en) : (id || '—');
  nameEl.title = nameEl.textContent;
  if (id) {
    const br = g.weaponBranches && g.weaponBranches[id];
    const ult = g.weaponUlts && g.weaponUlts[id];
    let s = `Lv${_slotLv(g, id)}`;
    if (br) s += `·${br}`;
    if (ult) s += ult.replace('U', '');
    lvEl.textContent = s;
  } else {
    lvEl.textContent = '';
  }
  if (resEl) {
    const res = id && g.weaponResources && g.weaponResources[id];
    if (secondary && res) {
      resEl.textContent = `${Math.ceil(res.current)}/${res.max}`;
    } else {
      resEl.textContent = '';
    }
  }
}

function updateWeaponRailHUD(g) {
  const rail = $('weapon-rail');
  if (!rail || !g) return;
  if (g.loadout) g.weaponSlots = flattenLoadout(g.loadout);
  const slots = g.weaponSlots || flattenLoadout(starterLoadout());
  const zh = i18n.isZh();
  // Color-only groups — no text labels on rail (v0.9.61)
  const groups = [
    { key: 'primary', start: 0, n: 2 },
    { key: 'secondary', start: 2, n: 2 },
    { key: 'throw', start: 4, n: 2 },
  ];
  const activePri = typeof g.activePrimaryId === 'function' ? g.activePrimaryId() : slots[0];
  const activeSec = g.fireMode === 'secondary' && typeof g.activeSecondaryId === 'function'
    ? g.activeSecondaryId() : null;

  if (!rail.dataset.built) {
    rail.innerHTML = '';
    // v0.9.90 RAIL-GROUP-A11Y-001 — aria on groups only (no visible P/S/T name labels; color-only preserved)
    const groupAria = zh
      ? { primary: '主武器', secondary: '副武器', throw: '投擲' }
      : { primary: 'Primary', secondary: 'Secondary', throw: 'Throw' };
    for (const gr of groups) {
      const wrap = document.createElement('div');
      wrap.className = 'wrail-group';
      wrap.dataset.cat = gr.key;
      wrap.setAttribute('role', 'group');
      wrap.setAttribute('aria-label', groupAria[gr.key] || gr.key);
      for (let k = 0; k < gr.n; k++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'wrail-tile empty';
        btn.dataset.i = String(gr.start + k);
        btn.dataset.cat = gr.key;
        btn.addEventListener('pointerup', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          const game = S.game;
          if (!game || S.state !== 'play') return;
          const idx = Number(btn.dataset.i);
          game.selectWeaponTile(idx);
          updateWeaponSlotsHUD(game);
        });
        wrap.appendChild(btn);
      }
      rail.appendChild(wrap);
    }
    rail.dataset.built = '1';
  }

  const tiles = rail.querySelectorAll('.wrail-tile');
  tiles.forEach((btn) => {
    const i = Number(btn.dataset.i);
    const id = slots[i] || null;
    const def = weaponDef(id);
    btn.classList.toggle('empty', !id);
    btn.classList.toggle('primary', !!(def && def.category === 'primary'));
    btn.classList.toggle('secondary', !!(def && def.category === 'secondary'));
    btn.classList.toggle('throw', !!(def && def.category === 'throw'));
    const isActive = !!id && (
      (def && def.category === 'primary' && id === activePri && g.fireMode !== 'secondary')
      || (def && def.category === 'secondary' && id === activeSec)
    );
    btn.classList.toggle('active', isActive);
    const fill = _tileFillRatio(g, id, def);
    const edge = _tileFillEdge(g, id, def, fill);
    btn.classList.toggle('drained', !!(id && edge.drained));
    btn.classList.toggle('on-cd', !!(id && edge.onCd));
    const bursting = !!(id && def && def.category === 'secondary' && isActive && (g.secondaryBurstLeft | 0) > 0);
    btn.classList.toggle('bursting', bursting);
    if (!id) {
      btn.classList.remove('drained', 'on-cd', 'bursting');
      btn.innerHTML = '<span class="wrail-fill" style="--fill:0" aria-hidden="true"></span>' +
        '<span class="wslot-ico" aria-hidden="true">' + weaponIconHtml(null, { empty: true, size: 26 }) + '</span>';
      btn.title = zh ? '空' : 'Empty';
      btn.setAttribute('aria-label', btn.title);
      btn.disabled = true;
      return;
    }
    btn.disabled = false;
    const lv = _slotLv(g, id);
    const br = g.weaponBranches && g.weaponBranches[id];
    const ult = g.weaponUlts && g.weaponUlts[id];
    let lvTxt = `Lv${lv}`;
    if (br) lvTxt += `·${br}`;
    if (ult) lvTxt += ult.replace('U', '');
    const fullName = zh ? def.zh : def.en;
    // Icon + water fill only — no on-rail name/lv text (title/aria keep full name for a11y)
    const mutedOpt = edge.drained ? { size: 26, muted: true } : { size: 26 };
    // v0.9.73 WEAPONS-RAIL-PATH-BADGE-001 — tiny A/B/C·U corner when branched (no name labels)
    let pathBadge = '';
    if (br || ult) {
      const u = ult ? (String(ult).startsWith('U') ? String(ult) : ('U' + ult)) : '';
      const pk = br && u ? `${br}·${u}` : (br ? String(br) : u);
      pathBadge = `<span class="wrail-path" aria-hidden="true">${pk}</span>`;
    }
    btn.innerHTML =
      `<span class="wrail-fill" style="--fill:${fill.toFixed(3)}" aria-hidden="true"></span>` +
      `<span class="wslot-ico" aria-hidden="true">${weaponIconHtml(id, mutedOpt)}</span>` +
      pathBadge;
    let title = `${fullName} ${lvTxt}`;
    if (edge.drained) title += zh ? ' · 用盡' : ' · empty';
    else if (edge.onCd) title += zh ? ' · 冷卻' : ' · cooling';
    else if (bursting) title += zh ? ` · 連發${g.secondaryBurstLeft}` : ` · burst ${g.secondaryBurstLeft}`;
    btn.title = title;
    btn.setAttribute('aria-label', title);
  });
}

/** v0.9.49: brief yellow pulse on the slot that just fired (multi-bar readability). */
const _slotPulseTimers = [null, null, null, null, null, null];
function pulseWeaponSlotFire(weaponId) {
  const g = S.game;
  if (!g || !weaponId) return;
  const i = slotIndexForWeapon(g.weaponSlots, weaponId);
  if (i < 0) return;
  const bar = $('weapon-slots');
  const el = bar && bar.children[i];
  const rail = $('weapon-rail');
  const railEl = rail && rail.querySelector(`.wrail-tile[data-i="${i}"]`);
  for (const node of [el, railEl]) {
    if (!node) continue;
    node.classList.remove('fire-pulse');
    void node.offsetWidth;
    node.classList.add('fire-pulse');
  }
  if (_slotPulseTimers[i]) clearTimeout(_slotPulseTimers[i]);
  _slotPulseTimers[i] = setTimeout(() => {
    if (el) el.classList.remove('fire-pulse');
    if (railEl) railEl.classList.remove('fire-pulse');
    _slotPulseTimers[i] = null;
  }, SLOT_FIRE_PULSE_MS);
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
  // v0.9.51: surface last graphics-interrupt snapshot on menu after reload
  try {
    const noteEl = $('interrupt-note');
    if (noteEl) {
      const snap = readInterruptSnapshot(typeof sessionStorage !== 'undefined' ? sessionStorage : null);
      const note = formatInterruptNote(snap, i18n.isZh());
      if (note) {
        noteEl.textContent = note;
        noteEl.classList.remove('hidden');
      } else {
        noteEl.textContent = '';
        noteEl.classList.add('hidden');
      }
    }
  } catch (_) {}
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

/** P/S/T family class for rail+card color tokens (v0.9.63). */
function cardWeaponCatClass(c) {
  const id = c && (c.weaponId || (c.kind === 'weapon' ? c.id : null) || c.id);
  if (!id || String(id).startsWith('_')) return '';
  const def = weaponDef(normalizeWeaponId(id) || id);
  const cat = def && def.category;
  if (cat === 'primary' || cat === 'secondary' || cat === 'throw') return 'cat-' + cat;
  return '';
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
    // PHASE6-TRADEOFF-CARDS-001 emblems
    overclock: sv(`<circle cx="32" cy="32" r="20" fill="none" stroke="${stroke}" stroke-width="3.5"/>
      <circle cx="32" cy="32" r="8" fill="none" stroke="${stroke}" stroke-width="3"/>
      <path d="M32 8 V14 M32 50 V56 M8 32 H14 M50 32 H56 M14 14 L18 18 M46 46 L50 50 M50 14 L46 18 M14 50 L18 46"
        fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round"/>`),
    glass: sv(`<path d="M22 10 H42 L38 54 H26 Z" fill="none" stroke="${stroke}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M26 28 H38" stroke="${stroke}" stroke-width="3" stroke-linecap="round"/>
      <path d="M18 14 L46 50" stroke="${stroke}" stroke-width="2.5" opacity=".7"/>`),
    heavy: sv(`<rect x="12" y="18" width="40" height="30" rx="3" fill="none" stroke="${stroke}" stroke-width="4"/>
      <rect x="20" y="26" width="24" height="14" rx="2" fill="${stroke}" opacity=".8"/>
      <path d="M18 48 H46" stroke="${stroke}" stroke-width="3.5" stroke-linecap="round"/>`),
  };
  if (c.shape && shapes[c.shape]) return shapes[c.shape];
  return `<span class="emblem-glyph">${c.icon || '◆'}</span>`;
}

/** v0.9.32: short priority queue + min display — see js/banner-queue.js */
const _bannerCtl = createBannerController({
  show(item) {
    const el = $('beat-banner');
    const zhEl = $('beat-zh');
    const enEl = $('beat-en');
    if (!el) return;
    if (zhEl) zhEl.textContent = item.zh || t('beat.eliteIn');
    if (enEl) enEl.textContent = item.en || t('beat.eliteInEn');
    el.classList.toggle('boss', !!item.boss);
    el.classList.remove('hidden');
  },
  hide() {
    const el = $('beat-banner');
    if (el) el.classList.add('hidden');
  },
});

function showBeatBanner(zh, en, ms, opts = {}) {
  const kind = opts.kind || (opts.boss ? 'boss' : 'default');
  _bannerCtl.push({
    kind,
    zh,
    en,
    ms: ms != null ? ms : undefined,
    boss: !!opts.boss || kind === 'boss' || kind === 'phase',
  });
}
S.showBeatBanner = showBeatBanner;
S.showRunCoach = showRunCoach;
S.hideRunCoach = hideRunCoach;
S.flashHurtVignette = flashHurtVignette;
S.pulseStickHint = pulseStickHint;
S.spawnCombatFloat = spawnCombatFloat;
S.dmgFloats = dmgFloats;
S._bannerCtl = _bannerCtl;
S.BANNER_MS = BANNER_MS;
S.syncMuteChrome = syncMuteChrome;
S.toggleMutePersist = toggleMutePersist;
S.MUTE_LS_KEY = MUTE_LS_KEY;
S.audio = audio;

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
  // v0.9.54: branch / ult offer queued behind level-up / pickup
  if (S.game && typeof S.game._flushPathOffer === 'function' && S.game._flushPathOffer()) {
    showLevelCards(S.game.pendingCards, { from: S.game.pendingFrom || 'branch' });
    return;
  }
  ui.show(null);
  S.state = 'play';
  // STICK-TOUCH-SHOW-001: stay fully hidden until next finger press (no idle corner hint).
  $('stick').classList.add('hidden');
  $('stick').classList.remove('ready', 'active', 'following', 'hint-pulse');
}

function clearSwapSlotHighlights() {
  const bar = $('weapon-slots');
  if (!bar) return;
  for (const el of bar.children) el.classList.remove('swap-target', 'swap-hint');
}

function highlightSwapSlot(index) {
  clearSwapSlotHighlights();
  const bar = $('weapon-slots');
  if (!bar || index == null) return;
  const el = bar.children[index];
  if (el) el.classList.add('swap-target');
}

function showLevelCards(cards, opts = {}) {
  if (!cards || !cards.length) {
    // Safety net: a level-up must never silently swallow the pick (v0.3.3 left the run running with no card).
    return;
  }
  S.state = 'level';
  const from = opts.from || (S.game && S.game.pendingFrom) || 'level';
  const title = $('level-title');
  const isSwap = from === 'pickup' && cards.some((c) => c.pickupAction === 'swap');
  const isPickup = from === 'pickup';
  const isBranch = from === 'branch';
  const isUlt = from === 'ult';
  if (title) {
    // WEAPONS-BRANCH-CARD-PATH-001: subtitle weapon name on branch/ult pick (UI only)
    let pathWeaponName = '';
    if ((isBranch || isUlt) && cards[0] && cards[0].weaponId) {
      const wd = weaponDef(cards[0].weaponId);
      if (wd) pathWeaponName = i18n.isZh() ? wd.zh : wd.en;
    }
    title.textContent = isSwap
      ? t('pickup.swap')
      : isPickup
        ? t('pickup.title')
        : isBranch
          ? ((i18n.isZh() ? '選擇分支' : 'CHOOSE BRANCH') + (pathWeaponName ? ' · ' + pathWeaponName : ''))
          : isUlt
            ? ((i18n.isZh() ? '選擇大招' : 'CHOOSE ULTIMATE') + (pathWeaponName ? ' · ' + pathWeaponName : ''))
            : t('levelUp');
  }
  const box = $('level-cards');
  box.innerHTML = '';
  box.classList.toggle('pickup-offer', isPickup);
  box.classList.toggle('pickup-swap', isSwap);
  box.classList.toggle('branch-offer', isBranch || isUlt);
  clearSwapSlotHighlights();
  if (isSwap && S.game) {
    // Soft hint on every swappable (non-mg) filled slot while choosing.
    const slots = S.game.weaponSlots || [];
    const bar = $('weapon-slots');
    if (bar) {
      slots.forEach((sid, i) => {
        if (!sid || sid === 'mg') return;
        const el = bar.children[i];
        if (el) el.classList.add('swap-hint');
      });
    }
  }
  let prevTaken = (S.game && S.game.taken) || {};
  const slots = (S.game && S.game.weaponSlots) || null;
  cards.forEach((c) => {
    const b = document.createElement('button');
    const action = c.pickupAction || '';
    const catCls = cardWeaponCatClass(c);
    b.className = 'level-card ' + cardKindClass(c)
      + (catCls ? ' ' + catCls : '')
      + (action ? ' action-' + action : '')
      + (action === 'swap' ? ' has-swap' : '');
    b.type = 'button';
    if (action === 'swap' && c.swapIndex != null) b.dataset.swapIndex = String(c.swapIndex);
    const kind = action === 'branch'
      ? (i18n.isZh() ? '分支' : 'BRANCH')
      : action === 'ult'
        ? (i18n.isZh() ? '大招' : 'ULT')
        : c.kind === 'armor'
      ? (i18n.isZh() ? '裝甲' : 'ARMOR')
      : c.kind === 'weapon'
        ? (i18n.isZh() ? '武器' : 'WEAPON')
        : (action === 'convertHeal'
          ? (i18n.isZh() ? '修復' : 'REPAIR')
          : action === 'keep'
            ? (i18n.isZh() ? '略過' : 'SKIP')
            : (i18n.isZh() ? '輔助' : 'UTIL'));
    // WEAPONS-BRANCH-CARD-PATH-001: visible path chip A/B/C or U1/U2 (no ult invent)
    const pathKey = action === 'ult'
      ? String(c.ult || c.ultId || c.branch || '').toUpperCase()
      : action === 'branch'
        ? String(c.branch || '').toUpperCase()
        : '';
    const pathChip = pathKey
      ? `<em class="card-path" data-path="${pathKey}">${pathKey}</em>`
      : '';
    const showCount = c.max != null && !String(c.id || '').startsWith('_pickup_') && action !== 'swap';
    const stackNow = prevTaken[c.id] || 0;
    let times = '';
    if (showCount) {
      const pct = Math.max(0, Math.min(100, Math.round((stackNow / Math.max(1, c.max)) * 100)));
      times = `<em class="card-count" title="${stackNow}/${c.max}">`
        + `${stackNow}/${c.max}`
        + `<span class="stack-bar" aria-hidden="true"><span class="stack-fill" style="width:${pct}%"></span></span>`
        + `</em>`;
    }
    const healBadge = action === 'convertHeal' && c.healAmount
      ? `<em class="card-count heal">+${c.healAmount} HP</em>` : '';
    // Light slot context on level-up new slot weapons (not pickup actions — those already say take/swap).
    let slotHint = '';
    if (!isPickup && !action && c.kind === 'weapon' && isSlotWeapon(c.id) && slots) {
      const owned = !!(prevTaken[c.id] || (slots || []).includes(c.id));
      if (!owned) {
        if (hasEmptyWeaponSlot(slots)) {
          slotHint = `<em class="card-slot-hint fill">${i18n.isZh() ? '裝入空欄' : 'EMPTY SLOT'}</em>`;
        } else {
          slotHint = `<em class="card-slot-hint swap-need">${i18n.isZh() ? '欄滿・需替換' : 'FULL · SWAP'}</em>`;
        }
      }
    }
    const titleZh = c.zh || c.en || '';
    const titleEn = c.en || '';
    const titleHtml = i18n.isZh()
      ? `<strong class="card-title">${titleZh}</strong>`
        + (titleEn ? `<em class="card-title-en">${titleEn}</em>` : '')
      : `<strong class="card-title">${titleEn || titleZh}</strong>`;
    const desc = i18n.isZh() ? (c.descZh || c.descEn || '') : (c.descEn || c.descZh || '');
    if (pathKey) b.dataset.path = pathKey;
    b.innerHTML =
      `<span class="card-icon" aria-hidden="true">${cardEmblem(c)}</span>` +
      `<span class="card-body">${titleHtml}` +
      `<span class="card-meta"><em class="card-kind">${kind}</em>${pathChip}${times}${healBadge}${slotHint}</span>` +
      `<small class="card-desc">${desc}</small></span>`;
    if (pathKey) {
      b.setAttribute('aria-label', `${kind} ${pathKey} ${titleZh || titleEn}`);
    }
    if (action === 'swap') {
      const idx = c.swapIndex;
      b.addEventListener('pointerenter', () => highlightSwapSlot(idx));
      b.addEventListener('pointerleave', () => {
        clearSwapSlotHighlights();
        // restore soft hints
        if (S.game) {
          (S.game.weaponSlots || []).forEach((sid, i) => {
            if (!sid || sid === 'mg') return;
            const el = $('weapon-slots') && $('weapon-slots').children[i];
            if (el) el.classList.add('swap-hint');
          });
        }
      });
      b.addEventListener('focus', () => highlightSwapSlot(idx));
    }
    b.addEventListener('click', () => {
      audio.pick();
      clearSwapSlotHighlights();
      S.game.applyCard(c);
      resumeAfterCardPick();
    });
    box.appendChild(b);
  });
  // Keep slot bar visible under pickup/swap so players see which cell is replaced.
  if (isPickup && S.game) {
    $('hud') && $('hud').classList.remove('hidden');
    updateWeaponSlotsHUD(S.game);
    if (isSwap) {
      (S.game.weaponSlots || []).forEach((sid, i) => {
        if (!sid || sid === 'mg') return;
        const el = $('weapon-slots') && $('weapon-slots').children[i];
        if (el) el.classList.add('swap-hint');
      });
    }
  }
  ui.show('level');
  audio.levelChime();
}

S.showLevelCards = showLevelCards;
S.syncWeaponHud = () => { if (S.game) updateWeaponSlotsHUD(S.game); };

/** v0.9.37 early-run toast — pointer-events none; never steals stick. */
function isCoachVisible() {
  const el = $('run-coach');
  return !!(el && !el.classList.contains('hidden'));
}

function isEarlyToastBusy() {
  const el = $('early-toast');
  return !!(el && !el.classList.contains('hidden'));
}

function hideEarlyToast() {
  const el = $('early-toast');
  if (el) {
    el.classList.add('hidden');
    el.classList.remove('kind-kill', 'kind-level', 'kind-heal', 'kind-streak');
  }
  if (S._earlyToastTimer) { clearTimeout(S._earlyToastTimer); S._earlyToastTimer = 0; }
}

function showEarlyToast(zh, en, ms, kind) {
  const el = $('early-toast');
  const zhEl = $('early-toast-zh');
  const enEl = $('early-toast-en');
  if (!el) return false;
  if (zhEl) zhEl.textContent = zh || '';
  if (enEl) enEl.textContent = en || '';
  el.classList.remove('kind-kill', 'kind-level', 'kind-heal', 'kind-streak');
  if (kind === 'firstKill') el.classList.add('kind-kill');
  else if (kind === 'firstLevel') el.classList.add('kind-level');
  else if (kind === 'firstHeal') el.classList.add('kind-heal');
  else if (kind === 'streak') el.classList.add('kind-streak');
  el.classList.remove('hidden');
  if (S._earlyToastTimer) clearTimeout(S._earlyToastTimer);
  S._earlyToastTimer = setTimeout(() => hideEarlyToast(), Math.max(400, ms || FIRST_KILL_MS));
  return true;
}

function flushPendingEarlyToast() {
  if (!S._early) return;
  const p = takePendingEarly(S._early);
  if (!p) return;
  if (isCoachVisible()) {
    // still up — re-defer
    S._early.pending = p;
    return;
  }
  showEarlyToast(p.zh, p.en, p.ms, p.kind);
}

function pulseXpBarFirstLevel() {
  const bar = document.querySelector('.xp-bar');
  if (!bar) return;
  bar.classList.add('xp-first-level');
  clearTimeout(bar._xpPulseT);
  bar._xpPulseT = setTimeout(() => bar.classList.remove('xp-first-level'), 700);
}

function applyFirstLevelJuice(panel) {
  pulseXpBarFirstLevel();
  // Slightly stronger chime on first XP level-up (extra arpeggio beat)
  try {
    if (audio && audio.levelChime) {
      setTimeout(() => { try { audio.levelChime(); } catch (_) {} }, 90);
    }
  } catch (_) {}
  if (panel) {
    panel.classList.add('first-level-glow');
    clearTimeout(panel._flgT);
    panel._flgT = setTimeout(() => panel.classList.remove('first-level-glow'), 1200);
  }
}

S.showEarlyToast = showEarlyToast;
S.hideEarlyToast = hideEarlyToast;
S.flushPendingEarlyToast = flushPendingEarlyToast;
S.isCoachVisible = isCoachVisible;
S.createStreakState = createStreakState;
S.noteStreakKill = noteStreakKill;
S.resetStreak = resetStreak;


/** v0.9.33 first-run coach — pointer-events none; dismiss on timeout or first stick. */
function hideRunCoach() {
  const el = $('run-coach');
  if (el) el.classList.add('hidden');
  if (S._coachTimer) { clearTimeout(S._coachTimer); S._coachTimer = 0; }
  // v0.9.37: coach out → show deferred first-kill toast (no stack in first 2s)
  try { flushPendingEarlyToast(); } catch (_) {}
}

function showRunCoach(opts = {}) {
  const el = $('run-coach');
  const zhEl = $('run-coach-zh');
  const enEl = $('run-coach-en');
  if (!el) return false;
  const touch = !!opts.touch;
  const zh = touch ? t('coach.move') : t('coach.wasd');
  const en = touch ? t('coach.moveEn') : t('coach.wasdEn');
  if (zhEl) zhEl.textContent = zh;
  if (enEl) enEl.textContent = en;
  el.classList.remove('hidden');
  if (S._coachTimer) clearTimeout(S._coachTimer);
  S._coachTimer = setTimeout(() => hideRunCoach(), COACH_MS);
  try {
    markCoachSeen(typeof localStorage !== 'undefined' ? localStorage : null);
  } catch (_) {}
  S._coachSessionShown = true;
  return true;
}

function maybeShowRunCoach(touch) {
  const session = { sessionShown: !!S._coachSessionShown };
  let store = null;
  try { store = typeof localStorage !== 'undefined' ? localStorage : null; } catch (_) {}
  if (!shouldShowCoach(store, session)) return false;
  return showRunCoach({ touch });
}

function pulseStickHint() {
  const root = $('stick');
  if (!root || root.classList.contains('hidden')) return;
  root.classList.add('hint-pulse');
  if (S._stickHintTimer) clearTimeout(S._stickHintTimer);
  S._stickHintTimer = setTimeout(() => {
    root.classList.remove('hint-pulse');
    S._stickHintTimer = 0;
  }, STICK_HINT_MS);
}

function flashHurtVignette() {
  const el = $('fx-hurt');
  if (!el) return;
  el.classList.add('on');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('on'), HURT_VIGNETTE_MS);
}

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
  // QA / screenshot: ?arsenal=1 fills all 4 slots at stack 1 (HUD ≡ fire; no orphan extras).
  if (flags.get('arsenal') === '1') {
    const g = S.game;
    g.loadout = {
      primary: ['gatling', 'ion_beam'],
      secondary: ['shotgun', null],
      throw: ['frag', null],
    };
    g.weaponSlots = flattenLoadout(g.loadout);
    g.shotgun = Math.max(g.shotgun || 0, 1);
    g.laser = Math.max(g.laser || 0, 1);
    g.ion_beam = Math.max(g.ion_beam || 0, 1);
    g.frag = Math.max(g.frag || 0, 1);
    g.grenade = Math.max(g.grenade || 0, 1);
    g.weaponResources.shotgun = { type: 'ammo', current: 8, max: 8 };
    g.taken = {
      ...(g.taken || {}),
      gatling: Math.max(1, (g.taken && g.taken.gatling) || 0),
      ion_beam: 1, laser: 1,
      shotgun: 1,
      frag: 1, grenade: 1,
    };
    delete g.taken.plasma;
    g._pruneUnslottedWeapons();
  }
  view.setMech(S.mechId);
  S.state = 'play';
  S.demoT = 0;
  S.newRecord = false;
  // v0.9.51: fresh run — clear interrupt note + reset mid-run GPU shed
  try { clearInterruptSnapshot(typeof sessionStorage !== 'undefined' ? sessionStorage : null); } catch (_) {}
  S._shedLevel = 0;
  S._shedHot = 0;
  S._shedFrame = 0;
  S._shedAccMs = 0;
  S._shedAccN = 0;
  Object.assign(pView, defaultView());
  Object.assign(pViewC, defaultView());
  document.body.classList.remove('in-menu');
  view.setVisible(true);
  ui.show(null);
  $('hud').classList.remove('hidden');
  $('demo-tag').classList.toggle('hidden', !S.demo);
  const touch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 || flags.get('stick') === '1' || S.demo;
  // STICK-TOUCH-SHOW-001: keep stick hidden until finger press — no ready corner ghost / hint-pulse.
  $('stick').classList.add('hidden');
  $('stick').classList.remove('ready', 'active', 'following', 'hint-pulse');
  updateHUD();
  audio.click();
  // v0.9.37: once-per-run early feedback flags
  S._early = resetEarlyFeedback(S._early || createEarlyFeedbackState());
  // v0.9.38: kill-streak soft feedback (no economy)
  S._streak = resetStreak(S._streak || createStreakState());
  hideEarlyToast();
  // First-run coach tip text OK (pointer-events none); do NOT pulse a visible idle stick.
  const showedCoach = maybeShowRunCoach(touch);
  if (!showedCoach) hideRunCoach();
}

function endRun(trial = false) {
  try { dmgFloats && dmgFloats.clear(); } catch (_) {}

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
  // v0.9.44: positioning score breakdown (over only — no mid-run toast)
  {
    const el = $('over-pos');
    if (el) {
      const sm = g.scoreMove | 0;
      const ss = g.scoreSafe | 0;
      const sp = g.scorePace | 0;
      if (sm + ss + sp > 0) {
        el.classList.remove('hidden');
        el.textContent = i18n.isZh()
          ? `走位 +${sm} · 安全區 +${ss} · 清場 +${sp}`
          : `Move +${sm} · Safe +${ss} · Pace +${sp}`;
      } else {
        el.classList.add('hidden');
        el.textContent = '';
      }
    }
  }
  $('over-record').classList.toggle('hidden', !S.newRecord);
  const who = g.killer ? (i18n.isZh() ? g.killer.zh : g.killer.en) : null;
  $('over-note').textContent = trial
    ? (i18n.isZh() ? '試玩時間到 · 解鎖金級繼續暴走' : 'Trial time up — unlock Gold to keep rampaging')
    : (who ? t('killedBy', { who }) : t('overNote'));
  // v0.9.33 zone reached + loadout summary
  const zh = i18n.isZh();
  if ($('over-zone')) $('over-zone').textContent = zoneShortLabel(g.mapZone || 'lab', zh);
  if ($('over-loadout')) $('over-loadout').textContent = formatLoadoutFromGame(g, CARDS_BY_ID, zh);
  // v0.9.39: stash run summary for share/copy
  S._lastShare = {
    timeStr: fmtTime(g.t),
    kills: g.kills | 0,
    zone: zoneShortLabel(g.mapZone || 'lab', zh),
    score: Math.floor(g.score),
    isZh: zh,
  };
  refreshShareButton();
  hideShareConfirm();
  hideRunCoach();
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
  if (dx || dz) hideRunCoach();
  if (S.demo) {
    S.demoT += 0.016;
    dx = Math.cos(S.demoT * 0.7) + Math.sin(S.demoT * 1.3) * 0.3;
    dz = Math.sin(S.demoT * 0.7) * 0.8;
  }
  if (dx || dz) g.moveDir(dx, dz);
  else g.stopMove();
}

// ---- virtual stick: STICK-TOUCH-SHOW-001 — hidden until press; relocates under finger; hide on release
(function bindStick() {
  const root = $('stick');
  const knob = $('stick-knob');
  let pid = null, cx = 0, cy = 0;
  const R = 56;
  const DEAD = 8;
  const HALF = 66; // stick widget half-size (css 132px)
  const setKnob = (x, y) => { knob.style.transform = `translate(${x}px,${y}px)`; };
  const placeAt = (x, y) => {
    // STICK-RAIL-CLAMP-001: center under finger but keep widget clear of bottom weapon rail.
    // Rail stays tappable (stick is pointer-events:none); clamp avoids covering color tiles.
    const size = HALF * 2;
    const rail = $('weapon-rail');
    let maxBottom = window.innerHeight - 8;
    if (rail) {
      const rr = rail.getBoundingClientRect();
      if (rr && rr.top > 0) maxBottom = rr.top - 10; // 10px air gap above rail
    } else {
      // fallback ≈ --hud-stick-clear band
      maxBottom = window.innerHeight - 96;
    }
    const minTop = 8;
    let top = y - HALF;
    let left = x - HALF;
    if (top + size > maxBottom) top = maxBottom - size;
    if (top < minTop) top = minTop;
    if (left < 4) left = 4;
    if (left + size > window.innerWidth - 4) left = window.innerWidth - 4 - size;
    root.style.left = Math.round(left) + 'px';
    root.style.top = Math.round(top) + 'px';
    root.style.right = 'auto';
    root.style.bottom = 'auto';
  };
  const resetHome = () => {
    // STICK-TOUCH-SHOW-001: hide immediately on release (CSS opacity fade ≤120ms if not .hidden yet).
    root.style.left = '';
    root.style.top = '';
    root.style.right = '';
    root.style.bottom = '';
    root.classList.remove('active', 'following', 'ready', 'hint-pulse');
    root.classList.add('hidden');
  };
  // v0.9.59 multi-tap: double→secondary burst, triple→throw (debounce ~350ms; ignore stick drags / rail)
  const TAP_WINDOW_MS = 360;
  const TAP_MOVE_MAX = 16;
  let tapCount = 0;
  let tapTimer = null;
  let pressMoved = false;
  let pressMaxDist = 0;
  const resolveTaps = () => {
    const n = tapCount;
    tapCount = 0;
    tapTimer = null;
    const g = S.game;
    if (!g || S.state !== 'play') return;
    if (n >= 3) {
      if (typeof g.activateThrowFromTap === 'function') g.activateThrowFromTap();
      else if (typeof g.requestThrow === 'function') {
        const thr = (g.loadout && g.loadout.throw) || [];
        for (const id of thr) { if (id && g.requestThrow(id)) break; }
      }
      updateWeaponSlotsHUD(g);
      return;
    }
    if (n === 2) {
      if (typeof g.activateSecondaryFromTap === 'function') g.activateSecondaryFromTap();
      else if (typeof g.selectWeaponTile === 'function') g.selectWeaponTile(2);
      updateWeaponSlotsHUD(g);
    }
  };
  const noteTap = () => {
    tapCount += 1;
    if (tapTimer) clearTimeout(tapTimer);
    if (tapCount >= 3) {
      resolveTaps();
      return;
    }
    tapTimer = setTimeout(resolveTaps, TAP_WINDOW_MS);
  };
  const begin = (clientX, clientY, pointerId) => {
    pid = pointerId;
    cx = clientX; cy = clientY;
    pressMoved = false;
    pressMaxDist = 0;
    placeAt(cx, cy);
    setKnob(0, 0);
    S.stick.active = true;
    S.stick.dx = 0; S.stick.dy = 0;
    hideRunCoach();
    const st = $('stick');
    if (st) st.classList.remove('hint-pulse');
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
    if (len > pressMaxDist) pressMaxDist = len;
    if (len > TAP_MOVE_MAX) pressMoved = true;
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
    const wasTap = !pressMoved && pressMaxDist <= TAP_MOVE_MAX;
    S.stick.active = false; S.stick.dx = 0; S.stick.dy = 0; setKnob(0, 0); pid = null;
    resetHome();
    if (wasTap && S.state === 'play') noteTap();
  };
  // Any playfield press (except real UI controls) starts the stick. ViewInput keeps pinch zoom.
  // Listen on window so transparent HUD chrome / safe-area overlays cannot swallow the down.
  // .weapon-rail / .wrail-tile excluded so multi-tap never fights rail taps.
  const UI_BLOCK = 'button, a, input, textarea, select, .level-card, .icon-btn, .neon-btn, .weapon-rail, .wrail-tile';
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
  S._multiTap = { TAP_WINDOW_MS, TAP_MOVE_MAX, noteTap, resolveTaps };
})();

window.addEventListener('keydown', (e) => {
  S.keys[e.code] = true;
  audio.init();
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (S.state === 'play') pauseRun();
    else if (S.state === 'pause') { S.state = 'play'; ui.show(null); }
  }
  if (e.code === 'KeyM') { toggleMutePersist(); }
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

/** v0.9.39 over-screen share / copy — secondary ghost; no SDK. */
function hideShareConfirm() {
  const el = $('share-confirm');
  if (el) { el.classList.add('hidden'); el.classList.remove('fail'); el.textContent = ''; }
  if (S._shareConfirmTimer) { clearTimeout(S._shareConfirmTimer); S._shareConfirmTimer = 0; }
}

function showShareConfirm(zh, en, fail = false) {
  const el = $('share-confirm');
  if (!el) return;
  const zhMode = (typeof i18n !== 'undefined' && i18n.isZh && i18n.isZh());
  el.textContent = zhMode ? (zh || '') : (en || zh || '');
  el.classList.toggle('fail', !!fail);
  el.classList.remove('hidden');
  if (S._shareConfirmTimer) clearTimeout(S._shareConfirmTimer);
  S._shareConfirmTimer = setTimeout(() => hideShareConfirm(), SHARE_CONFIRM_MS);
}

function refreshShareButton() {
  // v0.9.94 SHARE-BTN-ARIA-001 — aria-label mirrors visible zh/en labels
  const useShare = canNativeShare();
  const labels = shareButtonLabels(useShare);
  const zhEl = $('share-zh');
  const enEl = $('share-en');
  if (zhEl) zhEl.textContent = labels.zh;
  if (enEl) enEl.textContent = labels.en;
  const btn = $('btn-share');
  if (btn) {
    btn.dataset.mode = useShare ? 'share' : 'copy';
    btn.setAttribute('aria-label', labels.zh + ' ' + labels.en);
  }
}

async function onShareRun() {
  const snap = S._lastShare || {
    timeStr: ($('over-time') && $('over-time').textContent) || '0:00',
    kills: ($('over-kills') && $('over-kills').textContent) || '0',
    zone: ($('over-zone') && $('over-zone').textContent) || '—',
    score: ($('over-score') && $('over-score').textContent) || '0',
    isZh: i18n.isZh(),
  };
  const text = buildShareText({ ...snap, url: LIVE_URL });
  const result = await shareOrCopy(text, {
    title: snap.isZh ? '暴走機甲' : 'RAMPAGE MECH',
    preferShare: true,
  });
  if (result.aborted) return; // user cancelled share sheet
  const msg = confirmCopy(!!result.ok, !!result.usedShare);
  showShareConfirm(msg.zh, msg.en, !result.ok);
  try { if (result.ok && audio && audio.click) audio.click(); } catch (_) {}
}

S.buildShareText = buildShareText;
S.shareOrCopy = shareOrCopy;
S.refreshShareButton = refreshShareButton;
S.showShareConfirm = showShareConfirm;

$('btn-retry')?.addEventListener('click', () => startRun());
$('btn-share')?.addEventListener('click', () => { onShareRun().catch(() => {}); });
$('btn-menu')?.addEventListener('click', () => showMenu());
// HUD-MUTE-TO-GEAR-001: #btn-mute removed; in-run gear opens same settings sheet.
$('btn-settings-run')?.addEventListener('click', () => { openInRunSettings(); });

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

/** Shared settings opts — home gear + in-run gear (SETTINGS-AUDIO-SPLIT / QUALITY-SHARE-HOWTO). */
function settingsExtras() {
  return [
    {
      id: 'sfx', type: 'slider', labelKey: 'settings.sfx',
      get: () => (typeof audio.getVolumes === 'function' ? (audio.getVolumes().sfx ?? 1) : 1),
      set: (v) => { if (typeof audio.setVolume === 'function') audio.setVolume(v, 'sfx'); },
    },
    {
      id: 'bgm', type: 'slider', labelKey: 'settings.bgm',
      get: () => (typeof audio.getVolumes === 'function' ? (audio.getVolumes().music ?? 1) : 1),
      set: (v) => { if (typeof audio.setVolume === 'function') audio.setVolume(v, 'music'); },
    },
    {
      id: 'share', type: 'action', labelKey: 'settings.share', actionLabelKey: 'settings.shareGo',
      set: () => { onShareFromSettings().catch(() => {}); },
    },
    {
      id: 'howto', type: 'action', labelKey: 'settings.howto', actionLabelKey: 'settings.howtoGo',
      set: () => { openHowtoFromSettings(); },
    },
  ];
}

function settingsOpts() {
  return {
    audio: {
      get muted() { return !!audio.muted; },
      init: () => { try { audio.init(); } catch (_) {} },
      toggleMute: () => { toggleMutePersist(); },
      setVolume: (v, ch) => (typeof audio.setVolume === 'function' ? audio.setVolume(v, ch) : undefined),
      getVolumes: () => (typeof audio.getVolumes === 'function' ? audio.getVolumes() : { master: 1 }),
    },
    stage,
    extras: settingsExtras(),
    onOpen: () => { try { audio.click(); } catch (_) {} },
  };
}

/** Mid-run / menu share: reuse result-share; if no score yet, share game link. */
async function onShareFromSettings() {
  const g = S.game;
  let snap = S._lastShare || null;
  if (!snap && g && ((g.score | 0) > 0 || (g.kills | 0) > 0)) {
    const zh = i18n.isZh();
    snap = {
      timeStr: fmtTime(g.t || 0),
      kills: g.kills | 0,
      zone: zoneShortLabel(g.mapZone || 'lab', zh),
      score: Math.floor(g.score || 0),
      isZh: zh,
    };
  }
  if (!snap) {
    const isZh = i18n.isZh();
    const text = (isZh
      ? '暴走機甲 — 賽博機甲生存射擊\n'
      : 'RAMPAGE MECH — cyber mech survival shooter\n') + LIVE_URL;
    const result = await shareOrCopy(text, {
      title: isZh ? '暴走機甲' : 'RAMPAGE MECH',
      preferShare: true,
    });
    if (result.aborted) return;
    const msg = confirmCopy(!!result.ok, !!result.usedShare);
    showShareConfirm(msg.zh, msg.en, !result.ok);
    try { if (result.ok && audio && audio.click) audio.click(); } catch (_) {}
    return;
  }
  const text = buildShareText({ ...snap, url: LIVE_URL });
  const result = await shareOrCopy(text, {
    title: snap.isZh ? '暴走機甲' : 'RAMPAGE MECH',
    preferShare: true,
  });
  if (result.aborted) return;
  const msg = confirmCopy(!!result.ok, !!result.usedShare);
  showShareConfirm(msg.zh, msg.en, !result.ok);
  try { if (result.ok && audio && audio.click) audio.click(); } catch (_) {}
}

function openHowtoFromSettings() {
  try { ui.closeModal(); } catch (_) {}
  const o = ui._howtoOpts;
  if (!o || typeof o.getContent !== 'function') return;
  try { if (o.onOpen) o.onOpen(); } catch (_) {}
  const content = o.getContent() || {};
  if (o.privacyUrl && !content.privacyUrl) content.privacyUrl = o.privacyUrl;
  if (o.privacyHtml && !content.privacyHtml) content.privacyHtml = o.privacyHtml;
  ui.howto(content);
}

/** In-run gear: pause if playing, then same settings sheet as home.
 * SETTINGS-FOCUS-TRAP-NOTE-001: kit settings focuses Close; pause screen stays under modal so play cannot continue. */
function openInRunSettings() {
  if (S.state === 'play') pauseRun();
  try { audio.click(); } catch (_) {}
  ui.settings(settingsOpts());
}

// v0.9.52 + SETTINGS-*: settings sheet owns mute/volume/lang/sfx/bgm/quality/share/howto
// SETTINGS-QUALITY-AFFIRM-001: 畫質 = kit glow low/high via stage.setGlow({persist}); no second quality system
ui.mountSettings(settingsOpts());

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
      if (ev.weapon) pulseWeaponSlotFire(ev.weapon);
      const g = S.game;
      // Muzzle flash uses the SAME coords computed once at bullet spawn (js/muzzle.js).
      const mx = ev.muzzleX != null ? ev.muzzleX : g.px;
      const my = ev.muzzleY != null ? ev.muzzleY : 0.95;
      const mz = ev.muzzleZ != null ? ev.muzzleZ : g.pz;
      const muzzle = new THREE.Vector3(mx, my, mz);
      // v0.9.56 WEAPONS-FEEL-FX-001 — per-weapon muzzle / trail spark (pool-respecting)
      applyFeelBursts(muzzle, muzzleFeelFx(ev.weapon, { mobile: !!MOBILE_GFX }));
    }
    else if (ev.type === 'weaponCharge') {
      const mx = ev.muzzleX != null ? ev.muzzleX : S.game.px;
      const my = ev.muzzleY != null ? ev.muzzleY : 0.95;
      const mz = ev.muzzleZ != null ? ev.muzzleZ : S.game.pz;
      applyFeelBursts(
        new THREE.Vector3(mx, my, mz),
        chargeFeelFx(ev.weapon || 'ion_beam', ev.progress || 0.5, { mobile: !!MOBILE_GFX }),
      );
    }
    else if (ev.type === 'stick') {
      applyFeelBursts(
        new THREE.Vector3(ev.x, 0.7, ev.z),
        stickFeelFx({ mobile: !!MOBILE_GFX }),
      );
    }
    else if (ev.type === 'frostHit' || ev.type === 'frostBurst') {
      applyFeelBursts(
        new THREE.Vector3(ev.x, 0.55, ev.z),
        frostHitFeelFx({ mobile: !!MOBILE_GFX }),
      );
    }
    else if (ev.type === 'slowField') {
      applyFeelBursts(
        new THREE.Vector3(ev.x, 0.15, ev.z),
        slowFieldFeelFx({ mobile: !!MOBILE_GFX }),
      );
    }
    else if (ev.type === 'deployDrones') {
      applyFeelBursts(
        new THREE.Vector3(S.game.px, 0.9, S.game.pz),
        deployDronesFeelFx({ mobile: !!MOBILE_GFX }),
      );
    }
    else if (ev.type === 'blackhole') {
      applyFeelBursts(
        new THREE.Vector3(ev.x, 0.2, ev.z),
        blackholeFeelFx(ev.r || 3.4, { mobile: !!MOBILE_GFX }),
      );
    }
    else if (ev.type === 'flash') {
      applyFeelBursts(
        new THREE.Vector3(ev.x, 0.4, ev.z),
        flashFeelFx({ mobile: !!MOBILE_GFX }),
      );
      try { audio.nova(); } catch (_) {}
    }
        else if (ev.type === 'hit') {
      audio.hit();
      if (ev.x != null) {
        const c = new THREE.Color(ev.color || 0x00e5ff);
        const n = ev.heavy ? 22 : 12;
        particles.burst(new THREE.Vector3(ev.x, 0.5, ev.z), c, burstN(Math.min(n, 8)), { speed: ev.heavy ? 4 : 3, up: 1.2, life: 0.55, bright: 1.0 });
        // v0.8.5: no white hit particles
        if (ev.heavy) kickFx({ trauma: 0.08, slowmo: 0.04, bloomDamp: 0.35 });
        // v0.9.34 floating dmg (throttled per enemy)
        if (ev.dmg != null || ev.frontBlock) {
          spawnCombatFloat({
            kind: 'hit', amount: ev.dmg, x: ev.x, z: ev.z, y: 1.05,
            heavy: ev.heavy, frontBlock: ev.frontBlock,
            key: ev.id != null ? ev.id : `${ev.kind}:${Math.round(ev.x * 2)}:${Math.round(ev.z * 2)}`,
            jitterX: (Math.random() - 0.5) * 18,
            jitterY: -8 - Math.random() * 10,
          });
        }
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
      }
      // v0.9.22: ordinary kill — local burst only (no ring/wave/slowmo clutter in dense combat).
      // Elite/gore punch path above keeps ring + wave + hit-stop.
      // v0.9.37: first kill toast (once); defer if coach visible
      try {
        const fk = noteFirstKill(S._early, { coachVisible: isCoachVisible() });
        if (fk) {
          if (fk.show) {
            showEarlyToast(fk.zh, fk.en, fk.ms, fk.kind);
            if (!MOBILE_GFX) kickFx({ trauma: 0.05, fovKick: 0.01 });
            else kickFx({ trauma: 0.03 });
          }
          // defer path: pending set inside noteFirstKill; flush on hideRunCoach
        }
      } catch (_) {}
      // v0.9.38: soft kill-streak (feedback only — no DPS/XP); skip if toast busy
      try {
        if (!S._streak) S._streak = createStreakState();
        const sk = noteStreakKill(S._streak, performance.now(), {
          toastBusy: isEarlyToastBusy(),
        });
        if (sk && sk.show) {
          showEarlyToast(sk.zh, sk.en, sk.ms, 'streak');
          if (sk.kick) {
            if (!MOBILE_GFX) kickFx({ trauma: 0.04, fovKick: 0.01 });
            else kickFx({ trauma: 0.025 });
          }
        }
      } catch (_) {}
    }
    else if (ev.type === 'explode') {
      audio.nova();
      const pos = new THREE.Vector3(ev.x, 0.2, ev.z);
      // v0.9.56: distinct frag/chill/flash/gravity/tracking/acid bursts
      applyFeelBursts(pos, explodeFeelFx(ev.tag, { mobile: !!MOBILE_GFX, radius: ev.r || 1.6 }));
      if (view.burstGore) view.burstGore(ev.x, ev.z, 0x8a93a8);
      kickFx({ trauma: 0.1, slowmo: 0.04, fovKick: 0.03, bloomDamp: 0.9 });
    }
    else if (ev.type === 'puddle') {
      applyFeelBursts(
        new THREE.Vector3(ev.x, 0.12, ev.z),
        puddleFeelFx({ mobile: !!MOBILE_GFX }),
      );
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
      if (ev.amount != null) {
        spawnCombatFloat({
          kind: 'heal', amount: ev.amount, x: S.game.px, z: S.game.pz, y: 1.2,
          jitterY: -12,
        });
      }
      // v0.9.37: soft first-heal micro-toast (skip if coach / busy)
      try {
        const fh = noteFirstHeal(S._early, {
          coachVisible: isCoachVisible(),
          toastBusy: isEarlyToastBusy(),
        });
        if (fh && fh.show) showEarlyToast(fh.zh, fh.en, fh.ms, fh.kind);
      } catch (_) {}
    }
    else if (ev.type === 'weapon') {
      audio.nova();
      particles.burst(new THREE.Vector3(S.game.px, 0.8, S.game.pz), new THREE.Color(0xffe600), burstN(10), { speed: 2.8, up: 2.2, size: 0.5, bright: 1.0 });
    }
    else if (ev.type === 'hurt') {
      // Hurt feedback only — applyMoveFromInput / setMove still run during hitFlash/invuln.
      try { noteStreakBreak(S._streak || (S._streak = createStreakState())); } catch (_) {}
      audio.hurt();
      kickFx({ trauma: 0.14, aberr: 0.12, bloomDamp: 0.7 });
      // v0.9.33: keep light burst; add red edge vignette (no heavy FX)
      if (!MOBILE_GFX) {
        particles.burst(new THREE.Vector3(S.game.px, 0.7, S.game.pz), new THREE.Color(0xff2bd6), burstN(8), { speed: 3.2, up: 1.4, size: 0.45, bright: 1.0 });
      } else {
        particles.burst(new THREE.Vector3(S.game.px, 0.7, S.game.pz), new THREE.Color(0xff2bd6), burstN(3), { speed: 2.4, up: 1.0, size: 0.35, bright: 0.9 });
      }
      const flash = $('fx-flash');
      if (flash) { flash.classList.add('on'); clearTimeout(flash._t); flash._t = setTimeout(() => flash.classList.remove('on'), 50); }
      flashHurtVignette();
      if (ev.amount != null) {
        spawnCombatFloat({
          kind: 'hurt', amount: ev.amount, x: S.game.px, z: S.game.pz, y: 1.15,
          jitterX: (Math.random() - 0.5) * 12,
          jitterY: -6,
        });
      }
    }
    else if (ev.type === 'dead') { try { noteStreakBreak(S._streak); } catch (_) {} endRun(false); }
    else if (ev.type === 'levelup') {
      const from = ev.from || 'level';
      try {
        const fl = noteFirstLevel(S._early, { from });
        if (fl) {
          applyFirstLevelJuice($('screen-level'));
          // Tiny toast only if cards not yet covering — pulse is primary; skip toast under panel
        }
      } catch (_) {}
      showLevelCards(ev.cards, { from });
    }
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
      showBeatBanner(zh, en, BANNER_MS.zone, { kind: 'zone' });
      try { audio.wave(); } catch (_) {}
      // v0.9.48: chip stays after banner fades
      updateZoneHudChip(S.game);
    }
    else if (ev.type === 'eliteIn' || (ev.type === 'beat' && ev.kind === 'elite')) {
      const zh = ev.nameZh
        ? (`精英出現 · ${ev.nameZh}`)
        : t('beat.eliteIn');
      const en = ev.nameEn
        ? (`ELITE INBOUND · ${ev.nameEn}`)
        : t('beat.eliteInEn');
      showBeatBanner(zh, en, BANNER_MS.elite, { kind: 'elite' });
      audio.wave();
      // v0.9.20: skip elite inbound bloom kick on mobile
      if (!MOBILE_GFX) kickFx({ trauma: 0.08, bloomDamp: 0.35 }); // v0.9.22 less bloom spam
    }
    else if (ev.type === 'bossIn' || (ev.type === 'beat' && ev.kind === 'boss')) {
      const zh = ev.nameZh
        ? (`Boss 出現 · ${ev.nameZh}`)
        : t('beat.bossIn');
      const en = ev.nameEn
        ? (`BOSS INBOUND · ${ev.nameEn}`)
        : t('beat.bossInEn');
      showBeatBanner(zh, en, BANNER_MS.boss, { kind: 'boss', boss: true });
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
          showBeatBanner(zh, ev.phase.toUpperCase() + ' PHASE', BANNER_MS.phase, { kind: 'phase', boss: true });
        }
      } catch (_) {}
    }
    else if (ev.type === 'telegraph') {
      // View syncs warning lane / sniper red aim / boss lanes; light audio cue
      try { audio.wave(); } catch (_) {}
    }
    else if (ev.type === 'sniperShot') {
      const mx = ev.muzzleX != null ? ev.muzzleX : ev.x;
      const my = ev.muzzleY != null ? ev.muzzleY : 1.05;
      const mz = ev.muzzleZ != null ? ev.muzzleZ : ev.z;
      const muzzle = new THREE.Vector3(mx, my, mz);
      particles.burst(muzzle, new THREE.Color(0xff2a4a), burstN(4), { speed: 3.2, up: 0.4, life: 0.22, size: 0.36, bright: 1.0 });
      if (!MOBILE_GFX) {
        particles.burst(muzzle, new THREE.Color(0xff6a7a), burstN(2), { speed: 1.6, up: 0.6, life: 0.14, size: 0.28, bright: 0.95 });
      }
      try { audio.wave(); } catch (_) {}
      if (ev.hit) kickFx({ trauma: 0.06, fovKick: 0.01 });
    }
    else if (ev.type === 'artilleryImpact') {
      const ix = ev.x != null ? ev.x : 0;
      const iz = ev.z != null ? ev.z : 0;
      const impact = new THREE.Vector3(ix, 0.2, iz);
      particles.burst(impact, new THREE.Color(0xff6a1a), burstN(8), { speed: 4.0, up: 1.2, life: 0.35, size: 0.48, bright: 1.0 });
      if (!MOBILE_GFX) {
        particles.burst(impact, new THREE.Color(0xffa040), burstN(4), { speed: 2.2, up: 0.8, life: 0.22, size: 0.32, bright: 0.95 });
        particles.ring(impact, new THREE.Color(0xff6a1a), 14, 7, 0.32);
      }
      try { audio.nova(); } catch (_) {}
      if (ev.hit) {
        if (MOBILE_GFX) kickFx({ trauma: 0.08, fovKick: 0.015 });
        else kickFx({ trauma: 0.12, fovKick: 0.025, bloomDamp: 0.55 });
      } else if (!MOBILE_GFX) {
        kickFx({ trauma: 0.04, fovKick: 0.01 });
      }
    }
    else if (ev.type === 'bomberDetonate') {
      const ix = ev.x != null ? ev.x : 0;
      const iz = ev.z != null ? ev.z : 0;
      const impact = new THREE.Vector3(ix, 0.25, iz);
      particles.burst(impact, new THREE.Color(0xff1a3a), burstN(10), { speed: 4.5, up: 1.4, life: 0.38, size: 0.5, bright: 1.0 });
      if (!MOBILE_GFX) {
        particles.burst(impact, new THREE.Color(0xff2a6a), burstN(5), { speed: 2.4, up: 0.9, life: 0.24, size: 0.34, bright: 0.95 });
        particles.ring(impact, new THREE.Color(0xff1a3a), 16, 7.5, 0.34);
      }
      try { audio.nova(); } catch (_) {}
      if (ev.hit) {
        if (MOBILE_GFX) kickFx({ trauma: 0.09, fovKick: 0.018 });
        else kickFx({ trauma: 0.14, fovKick: 0.028, bloomDamp: 0.55 });
      } else if (!MOBILE_GFX) {
        kickFx({ trauma: 0.05, fovKick: 0.012 });
      }
    }
    else if (ev.type === 'flankerDash') {
      const ix = ev.x != null ? ev.x : 0;
      const iz = ev.z != null ? ev.z : 0;
      const impact = new THREE.Vector3(ix, 0.35, iz);
      particles.burst(impact, new THREE.Color(0x00e5ff), burstN(6), { speed: 3.6, up: 0.8, life: 0.28, size: 0.36, bright: 1.0 });
      if (!MOBILE_GFX) {
        particles.burst(impact, new THREE.Color(0x9b6dff), burstN(3), { speed: 2.0, up: 0.5, life: 0.18, size: 0.26, bright: 0.95 });
      }
      try { audio.wave(); } catch (_) {}
      if (ev.hit) {
        if (MOBILE_GFX) kickFx({ trauma: 0.07, fovKick: 0.014 });
        else kickFx({ trauma: 0.1, fovKick: 0.02, bloomDamp: 0.55 });
      }
    }
    else if (ev.type === 'medicHeal') {
      const ix = ev.x != null ? ev.x : 0;
      const iz = ev.z != null ? ev.z : 0;
      const impact = new THREE.Vector3(ix, 0.4, iz);
      particles.burst(impact, new THREE.Color(0xb6ff3a), burstN(7), { speed: 2.8, up: 1.0, life: 0.32, size: 0.34, bright: 1.0 });
      if (!MOBILE_GFX) {
        particles.burst(impact, new THREE.Color(0x7dffb0), burstN(4), { speed: 1.8, up: 0.6, life: 0.22, size: 0.24, bright: 0.9 });
        particles.ring(impact, new THREE.Color(0xb6ff3a), 10, 5.5, 0.26);
      }
      try { audio.wave(); } catch (_) {}
      if (!MOBILE_GFX) kickFx({ trauma: 0.04, fovKick: 0.008 });
    }
    else if (ev.type === 'jammerPulse') {
      // Visual only: reuse existing magenta fx-flash / particles — no new toast/coach/streak copy.
      if (!ev.miss) {
        const impact = new THREE.Vector3(S.game.px, 0.7, S.game.pz);
        particles.burst(impact, new THREE.Color(0xc44dff), burstN(6), { speed: 2.6, up: 1.1, life: 0.28, size: 0.32, bright: 1.0 });
        if (!MOBILE_GFX) {
          particles.burst(impact, new THREE.Color(0x9b4dff), burstN(3), { speed: 1.6, up: 0.5, life: 0.18, size: 0.22, bright: 0.9 });
        }
        const flash = $('fx-flash');
        if (flash) { flash.classList.add('on'); clearTimeout(flash._t); flash._t = setTimeout(() => flash.classList.remove('on'), 70); }
        try { audio.wave(); } catch (_) {}
        if (MOBILE_GFX) kickFx({ trauma: 0.05, fovKick: 0.01 });
        else kickFx({ trauma: 0.07, fovKick: 0.014, bloomDamp: 0.6 });
      }
    }
    else if (ev.type === 'dangerPulse') {
      const ix = ev.x != null ? ev.x : 0;
      const iz = ev.z != null ? ev.z : 0;
      const impact = new THREE.Vector3(ix, 0.22, iz);
      particles.burst(impact, new THREE.Color(0xff1a3a), burstN(8), { speed: 3.8, up: 1.1, life: 0.32, size: 0.46, bright: 1.0 });
      if (!MOBILE_GFX) {
        particles.burst(impact, new THREE.Color(0xff4a6a), burstN(4), { speed: 2.0, up: 0.7, life: 0.2, size: 0.3, bright: 0.95 });
        particles.ring(impact, new THREE.Color(0xff1a3a), 12, 6.5, 0.3);
      }
      try { audio.nova(); } catch (_) {}
      if (ev.hit) {
        if (MOBILE_GFX) kickFx({ trauma: 0.07, fovKick: 0.014 });
        else kickFx({ trauma: 0.11, fovKick: 0.022, bloomDamp: 0.5 });
      } else if (!MOBILE_GFX) {
        kickFx({ trauma: 0.04, fovKick: 0.01 });
      }
    }
    else if (ev.type === 'zonePressure') {
      // Persistent shrinking boundary start — light cue only; no toast (soft-juice DONE)
      if (ev.phase === 'start') {
        try { audio.wave(); } catch (_) {}
        if (!MOBILE_GFX) kickFx({ trauma: 0.03, fovKick: 0.008 });
      }
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
      // v0.9.51/v0.9.126: shed≥2 halves (shed≥3 1/3) particle + post GPU work on MOBILE_GFX
      const _shed = S._shedLevel | 0;
      const _sframe = S._shedFrame | 0;
      if (!shouldSkipParticleTick(_shed, _sframe)) {
        particles.update(dt);
      }
      waves.update(dt);
      fx.update(dt);
      view.sync(S.game, dt);
      view.frameCamera(stage.camera, S.game, dt);
      if (!shouldSkipPostFx(_shed, _sframe)) {
        fx.shake(stage.camera, performance.now() * 0.001, _shed >= 3 ? 0.22 : (_shed >= 2 ? 0.32 : 0.45));
        fx.applyPost(stage, performance.now() * 0.001);
      }
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
  if (flags.mute) {
    // Session override (?mute=1) — do not rewrite saved preference
    applyMutePreference(audio, muteButtons(), true, { persist: false, isZh: i18n.isZh() });
    ui.setMuted(true);
  } else {
    // Re-sync after async fonts / i18n so icon + aria match store (no unmuted flash)
    syncMuteChrome();
  }
  showMenu();
  ui.loaded();
  if (S.demo || flags.autostart) startRun();
  if (flags.debug) {
    window.__NS = { get game() { return S.game; }, get S() { return S; }, view, stage, audio };
  }
  const PERF = flags.get('perf') === '1';
  let _perfAcc = 0, _perfFrames = 0, _perfNearestMs = 0;
  // v0.9.51: apply shed level to PR / bloom (MOBILE_GFX only; desktop shed stays 0)
  function applyShedToStage(level) {
    if (!MOBILE_GFX) return;
    try {
      const wantPr = pixelRatioForShed(level, MAX_PR);
      if (Math.abs((stage.pixelRatio || 1) - wantPr) > 0.02) {
        stage.setPixelRatio(wantPr);
      }
      const bloom = bloomStrengthForShed(level, 0.10);
      stage.bloomBase = bloom;
      if (stage.bloomPass) stage.bloomPass.strength = bloom;
    } catch (_) {}
  }

  stage.loop((dt, time, rawDt) => {
    if (S.gfxLost) return; // freeze game + render after context loss (overlay owns the screen)
    const capped = Math.min(0.05, dt);

    // v0.9.51 mid-run GPU shed sample (~every frame accumulate; evaluate ~0.5s)
    if (MOBILE_GFX && S.game && (S.state === 'play' || S.state === 'level')) {
      S._shedFrame = (S._shedFrame | 0) + 1;
      const frameMs = Math.min(100, (rawDt || dt || 0) * 1000);
      S._shedAccMs = (S._shedAccMs || 0) + frameMs;
      S._shedAccN = (S._shedAccN || 0) + 1;
      if (S._shedAccN >= 30) {
        const avg = S._shedAccMs / S._shedAccN;
        S._shedAccMs = 0;
        S._shedAccN = 0;
        const next = computeShedLevel({
          mobile: true,
          runT: S.game.t || 0,
          avgFrameMs: avg,
          prevLevel: S._shedLevel | 0,
        });
        if (next !== (S._shedLevel | 0)) {
          S._shedLevel = next;
          applyShedToStage(next);
          console.info('[neon-swarm] GPU shed level', next, 'avgFrameMs', avg.toFixed(1));
        }
        if (avg >= SHED.frameMsHot) S._shedHot = (S._shedHot | 0) + 1;
        else S._shedHot = 0;
        if (shouldCoolPause({ shedLevel: S._shedLevel | 0, hotStreak: S._shedHot | 0, state: S.state })) {
          S._shedHot = 0;
          try {
            const snap = buildInterruptSnapshot(S.game, Date.now(), 'cool-pause');
            writeInterruptSnapshot(typeof sessionStorage !== 'undefined' ? sessionStorage : null, snap);
          } catch (_) {}
          pauseRun();
          console.warn('[neon-swarm] cool-pause after sustained hot frames (GPU pressure) shed', S._shedLevel);
        }
      }
    }

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
