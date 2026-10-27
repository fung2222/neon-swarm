/**
 * WEAPONS-HUD-CONTROLS-FLOOR-001 screenshots (v0.9.59).
 * Run: node tests/weapons-hud-controls-floor-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'weapons-hud-controls-floor');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.59';
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
  await new Promise((r) => setTimeout(r, 500));

  const meta = await page.evaluate(() => {
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.invuln = 99;
    g.loadout = {
      primary: ['gatling', 'ion_beam'],
      secondary: ['shotgun', 'acid_gun'],
      throw: ['frag', null],
    };
    g.weaponSlots = ['gatling', 'ion_beam', 'shotgun', 'acid_gun', 'frag', null];
    g.weaponBranches = { gatling: 'A' };
    g.fireMode = 'primary';
    g.secondaryBurstLeft = 0;
    g.secondaryBurstMax = 3;
    const rail = document.getElementById('weapon-rail');
    if (rail) delete rail.dataset.built;
    window.__swarm.syncWeaponHud();
    const floor = window.__swarm.view && window.__swarm.view.arenaFloor;
    const floorColor = floor && floor.material && floor.material.color
      ? floor.material.color.getHex() : null;
    const railRect = rail ? rail.getBoundingClientRect() : null;
    const names = [...document.querySelectorAll('#weapon-rail .wslot-name')].map((el) => el.textContent);
    const statusName = (document.getElementById('wstat-name') || {}).textContent || '';
    return {
      floorColor,
      railBottom: railRect ? Math.round(railRect.bottom) : null,
      railTop: railRect ? Math.round(railRect.top) : null,
      viewportH: window.innerHeight,
      railNames: names,
      statusName,
      burstMax: g.secondaryBurstMax,
      multiTap: !!(window.__swarm._multiTap && window.__swarm._multiTap.TAP_WINDOW_MS === 360),
    };
  });

  await page.screenshot({ path: join(SHOT_DIR, '01-bottom-rail-full-names.png'), type: 'png' });

  // Arm secondary burst via API (simulates double-tap result)
  await page.evaluate(() => {
    const g = window.__swarm.game;
    g.activateSecondaryFromTap();
    window.__swarm.syncWeaponHud();
  });
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: join(SHOT_DIR, '02-secondary-burst-armed.png'), type: 'png' });

  // Zone pressure / danger telegraph still present while floor stays dark
  await page.evaluate(() => {
    const g = window.__swarm.game;
    g.zonePressureActive = true;
    g.safeR = 18;
    if (typeof g._spawnDangerPulse === 'function') {
      try { g._spawnDangerPulse(); } catch (_) {}
    } else if (Array.isArray(g.dangerPulses)) {
      g.dangerPulses.push({ x: 4, z: 2, r: 3.2, t: 0, telegraph: 0.9, state: 'tele' });
    }
  });
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: join(SHOT_DIR, '03-near-black-floor-telegraphs.png'), type: 'png' });

  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({
    ver: VER,
    task: 'WEAPONS-HUD-CONTROLS-FLOOR-001',
    meta,
    pageErrors: errs.slice(0, 8),
    shots: [
      '01-bottom-rail-full-names.png',
      '02-secondary-burst-armed.png',
      '03-near-black-floor-telegraphs.png',
    ],
  }, null, 2));

  await browser.close();
  server.close();
  console.log('weapons-hud-controls-floor shots OK', meta);
  if (errs.length) console.warn('page errors', errs.slice(0, 5));
}

main().catch((e) => { console.error(e); process.exit(1); });
