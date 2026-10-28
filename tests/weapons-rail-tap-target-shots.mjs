/**
 * WEAPONS-RAIL-TAP-TARGET-001 screenshots (v0.9.68).
 * Phone 390×844 — measure .wrail-tile ≥44×44; rail still color-only.
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'weapons-rail-tap-target');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.68';
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
  const rail = document.getElementById('weapon-rail');
  if (!rail) return null;
  const tiles = [...rail.querySelectorAll('.wrail-tile')].map((btn) => {
    const r = btn.getBoundingClientRect();
    const cs = getComputedStyle(btn);
    return {
      i: btn.dataset.i,
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
      minW: cs.minWidth,
      minH: cs.minHeight,
      hasName: !!(btn.querySelector('.wslot-name') && getComputedStyle(btn.querySelector('.wslot-name')).display !== 'none'),
    };
  });
  const rr = rail.getBoundingClientRect();
  return { tiles, railH: +rr.height.toFixed(1), railBottom: +(window.innerHeight - rr.bottom).toFixed(1) };
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
  await new Promise((r) => setTimeout(r, 400));

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
      acid_gun: { type: 'energy', current: 8, max: 10 },
    };
    if (window.__swarm.syncWeaponHud) window.__swarm.syncWeaponHud();
  });
  await new Promise((r) => setTimeout(r, 200));

  const phone = await page.evaluate(probe);
  await page.screenshot({ path: join(SHOT_DIR, '01-phone-rail-44.png'), type: 'png' });

  // Tap a secondary tile (index 2) — must remain tappable
  const tapOk = await page.evaluate(() => {
    const btn = document.querySelector('.wrail-tile[data-i="2"]');
    if (!btn) return false;
    btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
    return window.__swarm.game.fireMode === 'secondary';
  });
  await new Promise((r) => setTimeout(r, 100));
  await page.screenshot({ path: join(SHOT_DIR, '02-after-rail-tap.png'), type: 'png' });

  const fail = [];
  if (!phone || !phone.tiles || phone.tiles.length < 6) fail.push('rail-tiles-missing');
  for (const t of (phone && phone.tiles) || []) {
    if (t.w < 44 - 0.5 || t.h < 44 - 0.5) fail.push(`tile-${t.i}-too-small:${t.w}x${t.h}`);
    if (t.hasName) fail.push(`tile-${t.i}-shows-name`);
  }
  if (!tapOk) fail.push('rail-tap-did-not-select-secondary');
  if (errs.length) fail.push(...errs.slice(0, 3).map((e) => 'pageerror:' + e));

  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver: VER, phone, tapOk, fail }, null, 2));
  await browser.close();
  server.close();
  if (fail.length) {
    console.error('weapons-rail-tap-target-shots FAIL', fail);
    process.exit(1);
  }
  console.log('weapons-rail-tap-target-shots.mjs: PASS', {
    sample: phone.tiles[0],
    railH: phone.railH,
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
