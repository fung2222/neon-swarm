/**
 * PHASE6-TRADEOFF-CARDS-001 screenshots: level-up showing trade-off cards.
 * Run: node tests/phase6-tradeoff-cards-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';
import { CARDS_BY_ID } from '../js/config.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase6-tradeoff-cards');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.43';
const WAIT = { timeout: 45000, polling: 250 };
const IDS = ['overclock', 'glass', 'heavy_frame'];

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

async function main() {
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--enable-webgl',
      '--use-gl=angle',
      '--use-angle=swiftshader-webgl',
      '--window-size=1280,800',
    ],
    defaultViewport: { width: 1280, height: 800 },
  });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));

  try {
    await page.goto(base + `/index.html?v=${VER}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
    await new Promise((r) => setTimeout(r, 400));
    await page.click('#btn-play');
    await page.waitForFunction(
      () => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game && window.__swarm.showLevelCards,
      WAIT,
    );
    await new Promise((r) => setTimeout(r, 400));

    const cards = IDS.map((id) => {
      const c = CARDS_BY_ID[id];
      return {
        id: c.id, kind: c.kind, icon: c.icon, shape: c.shape, max: c.max,
        zh: c.zh, en: c.en, descZh: c.descZh, descEn: c.descEn,
      };
    });

    const info = await page.evaluate((cardList) => {
      const S = window.__swarm;
      const g = S.game;
      g.enemies.length = 0;
      g.bullets.length = 0;
      g.gems.length = 0;
      g.invuln = 99;
      g.stopMove();
      g.pendingCards = cardList;
      g.pausedForLevel = true;
      g.pendingFrom = 'level';
      S.showLevelCards(cardList, { from: 'level' });
      const box = document.getElementById('level-cards');
      return {
        n: box ? box.children.length : 0,
        titles: box ? [...box.querySelectorAll('.card-title')].map((el) => el.textContent) : [],
        descs: box ? [...box.querySelectorAll('.card-desc')].map((el) => el.textContent) : [],
      };
    }, cards);

    console.log('level cards:', info);
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: join(SHOT_DIR, 'tradeoffs-1280x800.png'), type: 'png' });
    console.log('shot: tradeoffs-1280x800.png');

    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: join(SHOT_DIR, 'tradeoffs-mobile-390x844.png'), type: 'png' });
    console.log('shot: tradeoffs-mobile-390x844.png');

    if (errs.length) console.log('page errors:', errs.slice(0, 8));
    else console.log('no page errors');
    console.log('phase6-tradeoff-cards shots OK →', SHOT_DIR);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
