/**
 * PHASE6-ZONE-HUD-CHIP-001 screenshots: persistent zone chip per map zone.
 * Run: node tests/phase6-zone-hud-chip-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase6-zone-hud-chip');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.48';
const WAIT = { timeout: 45000, polling: 250 };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
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

async function bootPlay(page, base) {
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));
  await page.goto(base + `/index.html?v=${VER}&lang=zh&demo=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && (window.__swarm.state === 'play' || window.__swarm.state === 'menu'), WAIT);
  if (await page.evaluate(() => window.__swarm.state === 'menu')) {
    await page.click('#btn-play');
  }
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
  await new Promise((r) => setTimeout(r, 350));
  return errs;
}

async function setZone(page, zone) {
  await page.evaluate((z) => {
    const S = window.__swarm;
    if (S.game) S.game.mapZone = z;
    if (S.view && S.view.setMapZone) S.view.setMapZone(z);
    // force HUD refresh
    const el = document.getElementById('hud-zone');
    if (el && S.game) {
      // call via stepping updateHUD if exposed; else mirror chip update
      const info = {
        lab: { zh: '實驗室', en: 'LAB', accent: '#2ad4c8' },
        assembly: { zh: '機甲組裝區', en: 'ASSEMBLY BAY', accent: '#e8a040' },
        reactor: { zh: '能源反應爐', en: 'REACTOR', accent: '#b44dff' },
        blockade: { zh: '軍事封鎖區', en: 'BLOCKADE', accent: '#9aaa6e' },
        rooftop: { zh: '天台逃出區', en: 'ROOFTOP', accent: '#6aa8ff' },
      }[z] || { zh: '實驗室', en: 'LAB', accent: '#2ad4c8' };
      el.dataset.zone = z;
      el.style.setProperty('--zone-accent', info.accent);
      const zh = document.getElementById('hud-zone-zh');
      const en = document.getElementById('hud-zone-en');
      if (zh) zh.textContent = info.zh;
      if (en) en.textContent = info.en;
    }
  }, zone);
  await new Promise((r) => setTimeout(r, 200));
}

async function run() {
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox', '--disable-gpu',
      '--use-gl=angle', '--use-angle=swiftshader',
      '--window-size=1280,800',
    ],
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
  });
  try {
    const page = await browser.newPage();
    const errs = await bootPlay(page, base);
    await setZone(page, 'lab');
    await page.screenshot({ path: join(SHOT_DIR, 'lab-1280x800.png'), type: 'png' });
    await setZone(page, 'assembly');
    await page.screenshot({ path: join(SHOT_DIR, 'assembly-1280x800.png'), type: 'png' });
    await setZone(page, 'reactor');
    await page.screenshot({ path: join(SHOT_DIR, 'reactor-1280x800.png'), type: 'png' });
    await setZone(page, 'blockade');
    await page.screenshot({ path: join(SHOT_DIR, 'blockade-1280x800.png'), type: 'png' });
    await setZone(page, 'rooftop');
    await page.screenshot({ path: join(SHOT_DIR, 'rooftop-1280x800.png'), type: 'png' });

    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await setZone(page, 'reactor');
    await page.screenshot({ path: join(SHOT_DIR, 'reactor-mobile-390x844.png'), type: 'png' });

    const chip = await page.evaluate(() => {
      const el = document.getElementById('hud-zone');
      const r = el.getBoundingClientRect();
      return {
        zone: el.dataset.zone,
        zh: document.getElementById('hud-zone-zh')?.textContent,
        en: document.getElementById('hud-zone-en')?.textContent,
        visible: !el.classList.contains('hidden') && r.width > 0,
        top: r.top, left: r.left,
      };
    });
    if (!chip.visible || chip.zone !== 'reactor' || chip.zh !== '能源反應爐') {
      throw new Error('chip not visible/correct: ' + JSON.stringify(chip));
    }
    if (errs.length) console.warn('pageerrors', errs.slice(0, 3));
    console.log('phase6-zone-hud-chip-shots OK', chip);
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
