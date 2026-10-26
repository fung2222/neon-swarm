/**
 * Phase 6 banner timing screenshots (v0.9.32).
 * Run: node tests/phase6-banner-timing-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase6-banner-timing');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.32';
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
  await page.goto(base + `/index.html?v=${VER}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await new Promise((r) => setTimeout(r, 250));
  await page.click('#btn-play');
  await page.waitForFunction(
    () => window.__swarm && window.__swarm.state === 'play' && window.__swarm.showBeatBanner,
    WAIT,
  );
  await new Promise((r) => setTimeout(r, 300));
  return errs;
}

async function shotBanner(page, name, { zh, en, kind, boss }) {
  await page.evaluate((opts) => {
    const S = window.__swarm;
    if (S._bannerCtl) S._bannerCtl.reset();
    S.showBeatBanner(opts.zh, opts.en, undefined, { kind: opts.kind, boss: !!opts.boss });
  }, { zh, en, kind, boss });
  await page.waitForFunction(
    () => {
      const el = document.getElementById('beat-banner');
      return el && !el.classList.contains('hidden');
    },
    WAIT,
  );
  await new Promise((r) => setTimeout(r, 120));
  await page.screenshot({ path: join(SHOT_DIR, name), type: 'png' });
}

async function shotPause(page, name) {
  // Ensure play so pauseRun() accepts; click HUD pause (v0.9.20 contract path)
  await page.evaluate(() => {
    const S = window.__swarm;
    if (S) S.state = 'play';
    const el = document.getElementById('screen-pause');
    if (el) { el.classList.add('hidden'); el.style.setProperty('display', 'none', 'important'); }
  });
  await page.click('#btn-pause');
  await page.waitForFunction(
    () => {
      const el = document.getElementById('screen-pause');
      if (!el || el.classList.contains('hidden')) return false;
      const d = getComputedStyle(el).display;
      return d !== 'none';
    },
    WAIT,
  );
  await new Promise((r) => setTimeout(r, 180));
  await page.screenshot({ path: join(SHOT_DIR, name), type: 'png' });
}

async function run() {
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1280,720'],
    defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
  });
  try {
    const page = await browser.newPage();
    const errs = await bootPlay(page, base);
    if (errs.length) console.warn('page errors', errs.slice(0, 3));

    await shotBanner(page, '1280-zone.png', {
      zh: '進入 · 裝配灣', en: 'ZONE · ASSEMBLY BAY', kind: 'zone',
    });
    await shotBanner(page, '1280-elite.png', {
      zh: '精英出現 · 哨戒長', en: 'ELITE INBOUND · SENTINEL', kind: 'elite',
    });
    await shotBanner(page, '1280-boss.png', {
      zh: 'Boss 出現 · 洪流核心', en: 'BOSS INBOUND · SWARM CORE', kind: 'boss', boss: true,
    });
    await shotPause(page, '1280-pause.png');

    // 390 mobile
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.evaluate(() => {
      if (window.__swarm && window.__swarm._bannerCtl) window.__swarm._bannerCtl.reset();
      // resume to play so banner visible over game
      const S = window.__swarm;
      S.state = 'play';
      const pause = document.getElementById('screen-pause');
      if (pause) pause.classList.add('hidden');
    });
    await shotBanner(page, '390-zone.png', {
      zh: '進入 · 裝配灣', en: 'ZONE · ASSEMBLY BAY', kind: 'zone',
    });
    await shotBanner(page, '390-boss.png', {
      zh: 'Boss 出現 · 洪流核心', en: 'BOSS INBOUND · SWARM CORE', kind: 'boss', boss: true,
    });
    await shotPause(page, '390-pause.png');

    console.log('shots written to', SHOT_DIR);
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
