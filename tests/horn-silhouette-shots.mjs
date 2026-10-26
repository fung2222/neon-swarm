/**
 * HORN-SILHOUETTE-DIRECTION screenshots for Roy 肉眼.
 * Run: node tests/horn-silhouette-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, copyFileSync } from 'fs';
import { join, extname } from 'path';
import puppeteer from 'puppeteer-core';

const ROOT = '/workspace/neon-swarm';
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'horn-silhouette-mecha');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.21';
const WAIT = { timeout: 60000, polling: 250 };

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

async function poseMenu(page, yaw) {
  await page.evaluate((y) => {
    const v = window.__swarm?.view;
    if (!v) return;
    v._menuAutoSpin = false;
    v._menuDragUntil = performance.now() + 600000;
    v._menuYaw = y;
    if (v.menuMech) v.menuMech.rotation.y = y;
    if (v.setMenuMech) v.setMenuMech('horn');
    v._menuAutoSpin = false;
    v._menuDragUntil = performance.now() + 600000;
    v._menuYaw = y;
    if (v.menuMech) v.menuMech.rotation.y = y;
  }, yaw);
  await new Promise((r) => setTimeout(r, 800));
}

async function main() {
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--allow-file-access-from-files',
    ],
  });
  try {
    // Desktop — front 3/4
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
      await page.goto(`${base}/index.html?v=${VER}`, { waitUntil: 'networkidle0', timeout: 60000 });
      await page.waitForSelector('#btn-play, .mech-card, [data-mech]', WAIT).catch(() => {});
      await new Promise((r) => setTimeout(r, 1500));
      await poseMenu(page, 0.55); // front-ish three-quarter
      await page.screenshot({ path: join(SHOT_DIR, 'menu-desktop-1280x800.png'), fullPage: false });
      await poseMenu(page, Math.PI + 0.4); // rear three-quarter alt
      await page.screenshot({ path: join(SHOT_DIR, 'menu-desktop-rear-1280x800.png'), fullPage: false });
      console.log('desktop ok');
      await page.close();
    }
    // Mobile
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await page.goto(`${base}/index.html?v=${VER}`, { waitUntil: 'networkidle0', timeout: 60000 });
      await page.waitForSelector('#btn-play, .mech-card, [data-mech]', WAIT).catch(() => {});
      await new Promise((r) => setTimeout(r, 1500));
      await poseMenu(page, 0.55);
      await page.screenshot({ path: join(SHOT_DIR, 'menu-mobile-390x844.png'), fullPage: false });
      console.log('mobile ok');
      await page.close();
    }
    // In-game
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
      await page.goto(`${base}/index.html?v=${VER}`, { waitUntil: 'networkidle0', timeout: 60000 });
      await page.waitForSelector('#btn-play', WAIT);
      await new Promise((r) => setTimeout(r, 800));
      await page.click('#btn-play');
      await new Promise((r) => setTimeout(r, 2800));
      await page.screenshot({ path: join(SHOT_DIR, 'ingame-idle-horn-1280x800.png'), fullPage: false });
      console.log('ingame ok');
      await page.close();
    }
    for (const f of ['horn_n_idle_00.png', 'horn_e_idle_00.png', 'horn_s_idle_00.png', 'horn_w_idle_00.png', 'horn_n_gun_00_gun.png']) {
      const src = join(ROOT, 'assets/mechs/horn/sheets', f);
      if (existsSync(src)) copyFileSync(src, join(SHOT_DIR, `bake-${f}`));
    }
    console.log('SHOT_DIR', SHOT_DIR);
  } finally {
    await browser.close().catch(() => {});
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(2); });
