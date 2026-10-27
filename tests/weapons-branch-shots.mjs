/**
 * WEAPONS-BRANCH-PICK-001 screenshots (v0.9.54).
 * Run: node tests/weapons-branch-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'weapons-branch');
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
  await new Promise((r) => setTimeout(r, 400));

  const meta = await page.evaluate(() => {
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.bullets.length = 0;
    g.gems.length = 0;
    g.invuln = 99;
    g.px = 0; g.pz = 0;
    g.stopMove && g.stopMove();
    // Force gatling Lv3 → branch offer
    g.taken = { ...(g.taken || {}), gatling: 3, mg: 3 };
    g._queueWeaponPathOffers('gatling');
    g._flushPathOffer();
    return {
      pendingFrom: g.pendingFrom,
      choiceN: (g.pendingCards || []).length,
      titles: (g.pendingCards || []).map((c) => c.zh),
      paused: g.pausedForLevel,
    };
  });

  // Show the branch UI via swarm helper
  await page.evaluate(() => {
    const g = window.__swarm.game;
    if (window.__swarm.showLevelCards && g.pendingCards) {
      window.__swarm.showLevelCards(g.pendingCards, { from: g.pendingFrom || 'branch' });
    }
  });
  await new Promise((r) => setTimeout(r, 350));
  await page.screenshot({ path: join(SHOT_DIR, '01-branch-pick-mobile.png'), type: 'png' });

  // Pick branch B
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#level-cards .level-card')];
    if (cards[1]) cards[1].click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const after = await page.evaluate(() => {
    const g = window.__swarm.game;
    if (typeof window.__swarm.syncWeaponHud === 'function') window.__swarm.syncWeaponHud();
    return {
      branch: g.weaponBranches && g.weaponBranches.gatling,
      lvText: document.getElementById('wstat-lv')?.textContent || '',
      state: window.__swarm.state,
    };
  });
  await page.screenshot({ path: join(SHOT_DIR, '02-branch-applied-hud.png'), type: 'png' });

  // Force ult offer
  await page.evaluate(() => {
    const g = window.__swarm.game;
    g.taken.gatling = 5;
    g._queueWeaponPathOffers('gatling');
    g._flushPathOffer();
    if (window.__swarm.showLevelCards && g.pendingCards) {
      window.__swarm.showLevelCards(g.pendingCards, { from: g.pendingFrom || 'ult' });
    }
  });
  await new Promise((r) => setTimeout(r, 350));
  await page.screenshot({ path: join(SHOT_DIR, '03-ult-pick-mobile.png'), type: 'png' });

  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver: VER, meta, after, errs }, null, 2));
  await browser.close();
  server.close();
  console.log('weapons-branch shots OK', { meta, after, errs });
  if (errs.length) process.exitCode = 1;
  if (meta.pendingFrom !== 'branch' || meta.choiceN !== 3) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
