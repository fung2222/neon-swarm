// Scaffold shell — menu-home + NeonCity attract + timer stub run (no real gameplay yet).
import * as THREE from 'three';
import {
  i18n, t, flags, createStore, createStage, ThemeController, NeonCity, CyberUI, Platform,
  createAds, readHub, returnToHub as kitReturnToHub, shouldShowArcadeMenu, SynthAudio,
} from 'cyber-kit';
import { GAME_ID, TRIAL, ADS } from './config.js';
import './strings.js';

const $ = (id) => document.getElementById(id);
const Q = new URLSearchParams(location.search);
const ENT = (() => { try { return JSON.parse(localStorage.getItem('cyber.entitlement') || 'null'); } catch { return null; } })();
const HUB = {
  on: Q.get('hub') === '1',
  tier: Q.get('tier') || ENT?.tier || 'free',
  ads: Q.get('ads'),
  trial: Q.get('trial') === '1',
  trialLeft: Q.get('trialLeft'),
  ret: Q.get('ret'),
};
if (HUB.on && HUB.ads == null && ENT?.tier) HUB.ads = ENT.tier === 'free' ? '1' : '0';
const ADS_ON = HUB.ads === '1' || (!HUB.on && (flags.adsim || Platform.isNative));
const AD_FLAGS = { adsim: flags.adsim || HUB.ads === '1', debug: flags.debug };

const store = createStore(GAME_ID);
if (flags.reset) store.clear();
const ui = new CyberUI({ screens: ['start', 'pause', 'over'] });
const stage = createStage({
  canvas: $('scene'), bloom: 0.8, bloomRadius: 0.4, bloomThreshold: 0.82, fov: 42, exposure: 1.05,
  onFatal: (m) => ui.fatal(m),
});
ui.glowToggle(stage);
const theme = new ThemeController(); theme.set(1, true);
const city = new NeonCity(stage, {
  floor: 'plain', floorY: -0.6, innerRadius: 10.5, buildings: 200,
  billboard: { zh: '霓虹洪流', en: 'N E O N   S W A R M', pos: [0, 13, -20], width: 18 },
  dustArea: 12, dustHeight: 5,
});
void city;

const audio = new SynthAudio({ store, music: "chill" });
ui.setMuted(audio.muted);
const ads = createAds({ gameId: GAME_ID, ...ADS, flags: AD_FLAGS, onAdOpen: (on) => audio.duckAll?.(on) });

const S = { state: 'menu', demo: !!flags.demo, t: 0, score: 0, mode: 'play', hub: HUB };
window.__scaffold = S;

function fmtTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  return m + ':' + String(s % 60).padStart(2, '0');
}
function refreshBest() {
  const b = store.getNum('best', 0);
  if ($('start-best')) $('start-best').textContent = String(b);
}
function updateHUD() {
  if ($('hud-score')) $('hud-score').textContent = String(Math.floor(S.score));
  if ($('hud-time')) $('hud-time').textContent = fmtTime(S.t);
}

function showMenu() {
  S.state = 'menu';
  document.body.classList.add('in-menu');
  ui.show('start');
  $('hud').classList.add('hidden');
  refreshBest();
  if (HUB.trial) {
    const el = $('start-trial');
    if (el) {
      el.classList.remove('hidden');
      el.textContent = i18n.isZh()
        ? `試玩模式${HUB.trialLeft != null ? ` · 今日剩 ${HUB.trialLeft} 局` : ''}`
        : `Trial${HUB.trialLeft != null ? ` · ${HUB.trialLeft} left today` : ''}`;
    }
  }
}

function startRun(mode = 'play') {
  S.mode = mode;
  S.state = 'play';
  S.t = 0;
  S.score = 0;
  document.body.classList.remove('in-menu');
  ui.show(null);
  $('hud').classList.remove('hidden');
  if (S.demo) $('demo-tag').classList.remove('hidden');
  updateHUD();
  try { audio.click?.(); } catch {}
}

function endRun() {
  const score = Math.floor(S.score);
  const best = store.getNum('best', 0);
  if (score > best) store.setNum('best', score);
  S.state = 'over';
  $('hud').classList.add('hidden');
  if ($('over-score')) $('over-score').textContent = String(score);
  if ($('over-best')) $('over-best').textContent = String(store.getNum('best', 0));
  ui.show('over');
  if (ADS_ON) ads.naturalBreak?.("over").catch(() => {});
}

function tick(dt) {
  if (S.state !== 'play') return;
  S.t += dt;
  S.score += dt * 10;
  // Scaffold auto-ends so smoke / demo can cycle without real gameplay.
  if (S.t >= (S.demo ? 8 : 20)) endRun();
  updateHUD();
}

$('btn-play')?.addEventListener('click', () => startRun('play'));
$('btn-endless')?.addEventListener('click', () => startRun('endless'));
$('btn-pause')?.addEventListener('click', () => {
  if (S.state !== 'play') return;
  S.state = 'pause';
  ui.show('pause');
});
$('btn-resume')?.addEventListener('click', () => { S.state = 'play'; ui.show(null); });
$('btn-restart')?.addEventListener('click', () => startRun(S.mode));
$('btn-quit')?.addEventListener('click', () => showMenu());
$('btn-retry')?.addEventListener('click', () => startRun(S.mode));
$('btn-menu')?.addEventListener('click', () => showMenu());
$('btn-mute')?.addEventListener('click', () => { audio.toggleMute?.(); ui.setMuted(audio.muted); });

const hubMenu = HUB;
if (shouldShowArcadeMenu(hubMenu)) {
  const b = $('btn-arcade-menu');
  if (b) {
    b.classList.remove('hidden');
    b.addEventListener('click', () => kitReturnToHub({ gameId: GAME_ID, openStore: false }, location.search));
  }
}

ui.mountHowto({
  privacyUrl: './privacy.html',
  onOpen: () => { try { audio.click?.(); } catch {} },
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
  onOpen: () => { try { audio.click?.(); } catch {} },
});

i18n.onChange(() => refreshBest());
Platform.onBack?.(() => {
  if (S.state === 'pause') { S.state = 'play'; ui.show(null); return true; }
  if (S.state === 'over') { showMenu(); return true; }
  if (S.state === 'play') { S.state = 'pause'; ui.show('pause'); return true; }
  return false;
});

async function boot() {
  if (document.fonts) await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
  if (flags.mute) { audio.muted = true; ui.setMuted(true); }
  showMenu();
  // gentle orbit camera over city
  const cam = stage.camera;
  cam.position.set(0, 14, 18);
  cam.lookAt(0, 2, 0);
  ui.loaded();
  if (S.demo || flags.autostart) startRun('play');
  stage.loop((dt) => {
    tick(dt);
    const t = performance.now() * 0.00015;
    cam.position.x = Math.sin(t) * 2;
    cam.lookAt(0, 2, 0);
  }, { isActive: () => true, fpsEl: $('fps') });
  if (flags.fps) $('fps').classList.remove('hidden');
  ads.init?.().catch(() => {});
}
boot().catch((e) => { console.error(e); ui.fatal('載入失敗 Failed to start: ' + e.message); });
