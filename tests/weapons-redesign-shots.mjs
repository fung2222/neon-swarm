/**
 * WEAPONS-REDESIGN-001 (v0.9.54) — left rail + status HUD screenshots.
 * Run: node tests/weapons-redesign-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'weapons-redesign');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.54';
const WAIT = { timeout: 45000, polling: 250 };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'application/svg+xml',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
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
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--use-gl=angle',
      '--use-angle=swiftshader-webgl',
      '--ignore-gpu-blocklist',
      '--window-size=390,844',
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));
  await page.goto(base + `/index.html?v=${VER}&lang=zh&arsenal=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await page.click('#btn-play');
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
  await new Promise((r) => setTimeout(r, 500));
  const meta = await page.evaluate(() => {
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.bullets.length = 0;
    g.gems.length = 0;
    g.invuln = 99;
    g.px = 0; g.pz = 0;
    g.stopMove && g.stopMove();
    // force demo loadout already present; ensure HUD sync
    if (typeof window.__swarm.syncWeaponHud === 'function') window.__swarm.syncWeaponHud();
    const rail = document.getElementById('weapon-rail');
    const status = document.getElementById('weapon-status');
    const tiles = [...document.querySelectorAll('#weapon-rail .wrail-tile')];
    const rr = rail && rail.getBoundingClientRect();
    const sr = status && status.getBoundingClientRect();
    return {
      tileCount: tiles.length,
      filled: tiles.filter((t) => !t.classList.contains('empty')).length,
      railLeft: rr ? Math.round(rr.left) : null,
      railTop: rr ? Math.round(rr.top) : null,
      statusTop: sr ? Math.round(sr.top) : null,
      modeText: document.getElementById('wstat-mode')?.textContent || '',
      fireMode: g.fireMode,
      loadout: {
        p: (g.loadout?.primary || []).filter(Boolean),
        s: (g.loadout?.secondary || []).filter(Boolean),
        t: (g.loadout?.throw || []).filter(Boolean),
      },
    };
  });
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: join(SHOT_DIR, '01-mobile-play-hud.png'), type: 'png' });

  // tap secondary tile if present
  await page.evaluate(() => {
    const tiles = [...document.querySelectorAll('#weapon-rail .wrail-tile')];
    const sec = tiles.find((t) => t.dataset.cat === 'secondary' && t.dataset.weapon);
    if (sec) sec.click();
  });
  await new Promise((r) => setTimeout(r, 250));
  await page.screenshot({ path: join(SHOT_DIR, '02-secondary-selected.png'), type: 'png' });

  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver: VER, meta, errs }, null, 2));
  await browser.close();
  server.close();
  console.log('weapons-redesign shots OK', meta, errs);
  if (errs.length) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
