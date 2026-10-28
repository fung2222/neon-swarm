/**
 * STICK-RAIL-CLAMP-001 screenshots (v0.9.66).
 * Phone 390×844 — press near bottom; stick clamps above #weapon-rail; idle still hidden.
 * Run: node tests/stick-rail-clamp-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'stick-rail-clamp');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.66';
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

function probe() {
  const stick = document.getElementById('stick');
  const rail = document.getElementById('weapon-rail');
  if (!stick) return null;
  const cs = getComputedStyle(stick);
  const sr = stick.getBoundingClientRect();
  const rr = rail ? rail.getBoundingClientRect() : null;
  const rcs = rail ? getComputedStyle(rail) : null;
  return {
    hidden: stick.classList.contains('hidden'),
    active: stick.classList.contains('active'),
    following: stick.classList.contains('following'),
    opacity: cs.opacity,
    stick: {
      top: +sr.top.toFixed(1), bottom: +sr.bottom.toFixed(1),
      left: +sr.left.toFixed(1), right: +sr.right.toFixed(1),
      cx: +((sr.left + sr.right) / 2).toFixed(1),
      cy: +((sr.top + sr.bottom) / 2).toFixed(1),
      z: cs.zIndex,
    },
    rail: rr ? {
      top: +rr.top.toFixed(1), bottom: +rr.bottom.toFixed(1),
      z: rcs.zIndex,
    } : null,
    gap: rr ? +(rr.top - sr.bottom).toFixed(1) : null,
  };
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
  await page.goto(base + `/index.html?v=${VER}&lang=zh&stick=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await page.click('#btn-play');
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
  await new Promise((r) => setTimeout(r, 500));

  await page.evaluate(() => {
    try { localStorage.setItem('neon-swarm-coach-v1', '1'); } catch (_) {}
    const el = document.getElementById('run-coach');
    if (el) el.classList.add('hidden');
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.invuln = 99;
    g.loadout = {
      primary: ['gatling', 'ion_beam'],
      secondary: ['shotgun', 'acid_gun'],
      throw: ['frag', 'chill'],
    };
    g.weaponSlots = ['gatling', 'ion_beam', 'shotgun', 'acid_gun', 'frag', 'chill'];
    g.taken = { gatling: 1, ion_beam: 1, shotgun: 1, acid_gun: 1, frag: 1, chill: 1 };
    g.weaponResources = {
      shotgun: { type: 'ammo', current: 6, max: 8 },
      acid_gun: { type: 'energy', current: 4, max: 10 },
    };
    if (window.__swarm.syncWeaponHud) window.__swarm.syncWeaponHud();
    else if (typeof window.updateWeaponSlotsHUD === 'function') {}
  });
  // force HUD rebuild via internal path
  await page.evaluate(() => {
    const g = window.__swarm.game;
    try {
      // poke HUD by touching score
      g.score += 0.01;
    } catch (_) {}
  });
  await new Promise((r) => setTimeout(r, 250));

  const idle = await page.evaluate(probe);
  await page.screenshot({ path: join(SHOT_DIR, '01-idle-rail-visible.png'), type: 'png' });

  // Press low on playfield (would cover rail without clamp) — above rail but low
  const finger = { x: 120, y: 780 };
  await page.touchscreen.touchStart(finger.x, finger.y);
  await new Promise((r) => setTimeout(r, 100));
  const clamped = await page.evaluate(probe);
  await page.screenshot({ path: join(SHOT_DIR, '02-press-near-rail-clamped.png'), type: 'png' });

  // Mid-field press still under finger
  await page.touchscreen.touchEnd();
  await new Promise((r) => setTimeout(r, 80));
  const mid = { x: 195, y: 420 };
  await page.touchscreen.touchStart(mid.x, mid.y);
  await new Promise((r) => setTimeout(r, 80));
  const midProbe = await page.evaluate(probe);
  await page.screenshot({ path: join(SHOT_DIR, '03-press-midfield.png'), type: 'png' });
  await page.touchscreen.touchEnd();
  await new Promise((r) => setTimeout(r, 80));
  const released = await page.evaluate(probe);
  await page.screenshot({ path: join(SHOT_DIR, '04-release-hidden.png'), type: 'png' });

  const fail = [];
  if (!idle || !idle.hidden) fail.push('idle-not-hidden');
  if (!clamped || clamped.hidden) fail.push('clamp-still-hidden');
  if (!clamped || !(clamped.active || clamped.following)) fail.push('clamp-not-active');
  if (clamped && clamped.rail && clamped.gap != null && clamped.gap < 4) {
    fail.push('stick-overlaps-rail:gap=' + clamped.gap);
  }
  if (clamped && clamped.rail && clamped.stick.bottom > clamped.rail.top + 1) {
    fail.push(`stick-bottom-below-rail-top:stickBottom=${clamped.stick.bottom},railTop=${clamped.rail.top}`);
  }
  if (clamped && Number(clamped.stick.z) >= Number(clamped.rail.z)) {
    // rail should be >= stick; equal was old — require rail > stick
    fail.push(`z-order:stick=${clamped.stick.z},rail=${clamped.rail && clamped.rail.z}`);
  }
  if (midProbe && midProbe.stick) {
    const dx = Math.abs(midProbe.stick.cx - mid.x);
    const dy = Math.abs(midProbe.stick.cy - mid.y);
    if (dx > 50 || dy > 50) fail.push(`mid-not-at-finger:dx=${dx},dy=${dy}`);
  }
  if (!released || !released.hidden) fail.push('release-not-hidden');
  if (errs.length) fail.push(...errs.slice(0, 3).map((e) => 'pageerror:' + e));

  const meta = { ver: VER, ship: 'STICK-RAIL-CLAMP-001', idle, clamped, midProbe, released, finger, mid, fail };
  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify(meta, null, 2));

  await browser.close();
  server.close();
  if (fail.length) {
    console.error('stick-rail-clamp-shots FAIL', fail);
    process.exit(1);
  }
  console.log('stick-rail-clamp-shots.mjs: PASS', {
    gap: clamped.gap,
    stickZ: clamped.stick.z,
    railZ: clamped.rail && clamped.rail.z,
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
