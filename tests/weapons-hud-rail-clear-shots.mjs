/**
 * WEAPONS-HUD-RAIL-CLEAR-001 screenshots (v0.9.62).
 * Phone portrait 390×844 — hub centered; rail no names; water fill on S/T.
 * Run: node tests/weapons-hud-merge-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'weapons-hud-rail-clear');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.62';
const WAIT = { timeout: 45000, polling: 250 };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'application/svg+xml',
  '.woff2': 'font/woff2',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent((req.url || '/').split('?')[0]);
      let rel = url === '/' ? '/index.html' : url;
      const file = join(ROOT, rel.replace(/^\//, ''));
      if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, base: `http://127.0.0.1:${port}` });
    });
  });
}

async function main() {
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader-webgl',
      '--ignore-gpu-blocklist', '--window-size=390,844',
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));
  await page.goto(base + `/index.html?v=${VER}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await page.click('#btn-play');
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
  await new Promise((r) => setTimeout(r, 600));

  const layout = await page.evaluate(() => {
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.invuln = 99;
    g.hp = Math.max(1, Math.floor((g.maxHp || 5) * 0.6));
    g.xp = Math.floor((g.xpNeed || 10) * 0.42);
    g.loadout = {
      primary: ['gatling', 'ion_beam'],
      secondary: ['shotgun', 'acid_gun'],
      throw: ['frag', null],
    };
    g.weaponSlots = ['gatling', 'ion_beam', 'shotgun', 'acid_gun', 'frag', null];
    g.weaponBranches = { gatling: 'A' };
    g.weaponResources = {
      shotgun: { type: 'ammo', current: 3, max: 8 },
      acid_gun: { type: 'ammo', current: 7, max: 10 },
    };
    g.throwCdT = { frag: 0.85 };
    g.fireMode = 'primary';
    g.kills = 19;
    const rail = document.getElementById('weapon-rail');
    if (rail) delete rail.dataset.built;
    window.__swarm.syncWeaponHud();
    window.__swarm.game && (window.__swarm._forceHud = true);
    // force HUD refresh via sync
    if (typeof window.__swarm.syncWeaponHud === 'function') window.__swarm.syncWeaponHud();

    const q = (sel) => document.querySelector(sel);
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1), left: +r.left.toFixed(1), right: +r.right.toFixed(1), width: +r.width.toFixed(1), height: +r.height.toFixed(1), cx: +((r.left + r.right) / 2).toFixed(1) };
    };
    const hit = (a, b) => {
      if (!a || !b || a.width <= 0 || b.width <= 0) return false;
      return !(a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1);
    };
    const hub = box(q('#hud-hub'));
    const xp = box(q('#hud-hub .xp-bar'));
    const railBox = box(q('#weapon-rail'));
    const stick = box(q('#stick'));
    const btns = box(q('.hud-buttons.top'));
    const wstat = q('#weapon-status');
    const wstatVisible = !!(wstat && getComputedStyle(wstat).display !== 'none' && !wstat.hidden);
    const labels = [...document.querySelectorAll('#weapon-rail .wrail-label, #weapon-rail .wslot-name')]
      .filter((el) => getComputedStyle(el).display !== 'none');
    const fills = [...document.querySelectorAll('#weapon-rail .wrail-fill')].map((el) => ({
      cat: el.parentElement && el.parentElement.className,
      fill: el.style.getPropertyValue('--fill') || getComputedStyle(el).getPropertyValue('--fill'),
    }));
    const vw = window.innerWidth;
    const stickGap = (stick && railBox) ? +(railBox.top - stick.bottom).toFixed(1) : null;
    return {
      hub, xp, rail: railBox, stick, btns,
      hubCentered: hub ? Math.abs(hub.cx - vw / 2) < 8 : false,
      stickGap,
      wstatVisible,
      visibleRailLabels: labels.map((el) => el.textContent),
      fills,
      overlaps: {
        hubVsRail: hit(hub, railBox),
        hubVsStick: hit(hub, stick),
        railVsStick: hit(railBox, stick),
        hubVsBtns: hit(hub, btns),
      },
      xpPctText: (document.getElementById('xp-pct') || {}).textContent || '',
      hpFillW: (document.getElementById('hub-hp-fill') || {}).style?.width || '',
      viewport: { w: vw, h: window.innerHeight },
    };
  });

  // trigger a HUD tick so xp/hp bars paint
  await page.evaluate(() => {
    const g = window.__swarm.game;
    g.xp = Math.floor((g.xpNeed || 10) * 0.42);
    g.hp = Math.max(1, Math.floor((g.maxHp || 5) * 0.6));
    // poke internal snap by calling update path if exposed
    if (window.__swarm.syncWeaponHud) window.__swarm.syncWeaponHud();
  });
  await new Promise((r) => setTimeout(r, 250));

  await page.screenshot({ path: join(SHOT_DIR, '01-hub-top.png'), type: 'png', clip: { x: 0, y: 0, width: 390, height: 200 } });
  await page.screenshot({ path: join(SHOT_DIR, '02-full-phone-hud.png'), type: 'png' });
  await page.screenshot({ path: join(SHOT_DIR, '03-bottom-rail-water.png'), type: 'png', clip: { x: 0, y: 844 - 200, width: 390, height: 200 } });

  // Drain secondary further for water readability
  await page.evaluate(() => {
    const g = window.__swarm.game;
    g.weaponResources.shotgun.current = 1;
    g.throwCdT.frag = 1.4;
    g.activateSecondaryFromTap();
    const rail = document.getElementById('weapon-rail');
    if (rail) delete rail.dataset.built;
    window.__swarm.syncWeaponHud();
  });
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: join(SHOT_DIR, '04-secondary-water-drain.png'), type: 'png', clip: { x: 0, y: 844 - 200, width: 390, height: 200 } });

  const hard = ['hubVsRail', 'hubVsStick', 'railVsStick', 'hubVsBtns'];
  const bad = hard.filter((k) => layout.overlaps[k]);
  const fail = [];
  if (!layout.hubCentered) fail.push('hub-not-centered');
  if (layout.wstatVisible) fail.push('weapon-status-visible');
  if (layout.visibleRailLabels.length) fail.push('rail-labels-visible:' + layout.visibleRailLabels.join('|'));
  if (bad.length) fail.push(...bad.map((k) => 'overlap:' + k));
  if (layout.stickGap == null || layout.stickGap < 28) fail.push('stick-gap:' + layout.stickGap);

  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({
    ver: VER,
    task: 'WEAPONS-HUD-RAIL-CLEAR-001',
    layout,
    failures: fail,
    pageErrors: errs.slice(0, 8),
    shots: [
      '01-hub-top.png',
      '02-full-phone-hud.png',
      '03-bottom-rail-water.png',
      '04-secondary-water-drain.png',
    ],
  }, null, 2));

  await browser.close();
  server.close();
  console.log('weapons-hud-rail-clear shots OK', { hubCentered: layout.hubCentered, stickGap: layout.stickGap, fills: layout.fills, fail });
  if (fail.length) {
    console.error('FAILURES', fail);
    process.exit(2);
  }
  if (errs.length) console.warn('page errors', errs.slice(0, 5));
}

main().catch((e) => { console.error(e); process.exit(1); });
