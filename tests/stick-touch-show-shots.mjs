/**
 * STICK-TOUCH-SHOW-001 screenshots (v0.9.65).
 * Phone portrait 390×844 — idle stick invisible; press shows stick at finger.
 * Run: node tests/stick-touch-show-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'stick-touch-show');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.65';
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

function stickProbe() {
  const el = document.getElementById('stick');
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    hidden: el.classList.contains('hidden'),
    ready: el.classList.contains('ready'),
    active: el.classList.contains('active'),
    following: el.classList.contains('following'),
    hintPulse: el.classList.contains('hint-pulse'),
    opacity: cs.opacity,
    visibility: cs.visibility,
    display: cs.display,
    left: el.style.left || '',
    top: el.style.top || '',
    box: {
      left: +r.left.toFixed(1), top: +r.top.toFixed(1),
      width: +r.width.toFixed(1), height: +r.height.toFixed(1),
      cx: +((r.left + r.right) / 2).toFixed(1),
      cy: +((r.top + r.bottom) / 2).toFixed(1),
    },
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
    if (window.__swarm.syncWeaponHud) window.__swarm.syncWeaponHud();
  });
  await new Promise((r) => setTimeout(r, 200));

  const idle = await page.evaluate(stickProbe);
  await page.screenshot({ path: join(SHOT_DIR, '01-idle-no-stick.png'), type: 'png' });

  const finger = { x: 160, y: 520 };
  await page.touchscreen.touchStart(finger.x, finger.y);
  await new Promise((r) => setTimeout(r, 80));
  const active = await page.evaluate(stickProbe);
  await page.screenshot({ path: join(SHOT_DIR, '02-press-at-finger.png'), type: 'png' });

  await page.touchscreen.touchEnd();
  await new Promise((r) => setTimeout(r, 80));
  const released = await page.evaluate(stickProbe);
  await page.screenshot({ path: join(SHOT_DIR, '03-release-hidden.png'), type: 'png' });

  const fail = [];
  if (!idle || !idle.hidden) fail.push('idle-not-hidden');
  if (idle && idle.ready) fail.push('idle-has-ready');
  if (idle && idle.hintPulse) fail.push('idle-has-hint-pulse');
  if (idle && idle.display !== 'none' && Number(idle.opacity) > 0.05) fail.push('idle-opacity:' + idle.opacity);
  if (!active || active.hidden) fail.push('press-still-hidden');
  if (!active || !(active.active || active.following)) fail.push('press-not-active');
  if (active && Number(active.opacity) < 0.9) fail.push('press-opacity:' + active.opacity);
  if (active && active.box) {
    const dx = Math.abs(active.box.cx - finger.x);
    const dy = Math.abs(active.box.cy - finger.y);
    if (dx > 40 || dy > 40) fail.push(`press-not-at-finger:dx=${dx},dy=${dy}`);
  }
  if (!released || !released.hidden) fail.push('release-not-hidden');
  if (released && (released.active || released.following)) fail.push('release-still-active');
  if (errs.length) fail.push(...errs.slice(0, 3).map((e) => 'pageerror:' + e));

  const meta = { ver: VER, ship: 'STICK-TOUCH-SHOW-001', idle, active, released, finger, fail };
  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify(meta, null, 2));

  await browser.close();
  server.close();
  if (fail.length) {
    console.error('stick-touch-show-shots FAIL', fail);
    process.exit(1);
  }
  console.log('stick-touch-show-shots.mjs: PASS', { idleHidden: idle.hidden, activeAt: active && active.box, releasedHidden: released.hidden });
}

main().catch((e) => { console.error(e); process.exit(1); });
