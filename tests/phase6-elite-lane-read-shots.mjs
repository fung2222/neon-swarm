/**
 * PHASE6-ELITE-LANE-READ-001: thicker/brighter elite charge lanes.
 * Run: node tests/phase6-elite-lane-read-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase6-elite-lane-read');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.50';
const WAIT = { timeout: 45000, polling: 250 };
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.map': 'application/json',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent((req.url || '/').split('?')[0]);
      const file = join(ROOT, (url === '/' ? '/index.html' : url).replace(/^\//, ''));
      if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` }));
  });
}

async function bootPlay(page, base) {
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));
  await page.goto(base + `/index.html?v=${VER}&lang=zh&demo=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && (window.__swarm.state === 'play' || window.__swarm.state === 'menu'), WAIT);
  if (await page.evaluate(() => window.__swarm.state === 'menu')) await page.click('#btn-play');
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
  await new Promise((r) => setTimeout(r, 400));
  return errs;
}

async function placeElite(page, kind) {
  await page.evaluate((k) => {
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.bullets.length = 0;
    g.invuln = 99;
    g.px = 0; g.pz = 0;
    g.stopMove && g.stopMove();
    g._beatsFired = g._beatsFired || {};
    g._beatsFired['120:sentinel'] = true;
    g._beatsFired['240:hunter'] = true;
    g._beatsFired['300:commander'] = true;
    const e = g._spawnElite({ at: k === 'hunter' ? 240 : 120, kind: 'elite', id: k }, []);
    e.x = 0; e.z = -5.0;
    e.phase = k === 'commander' ? 'telegraph_attack' : 'telegraph';
    e.phaseT = 0.85;
    e.telegraphDur = 1.25;
    e.telegraphAt = g.t;
    e.damageAt = g.t + 1.25;
    if (k === 'hunter') { e.dualLane = true; e.comboSeg = 1; e.comboSegs = 2; }
    let dx = g.px - e.x, dz = g.pz - e.z;
    const len = Math.hypot(dx, dz) || 1;
    e.chargeDx = dx / len; e.chargeDz = dz / len;
    e.vx = 0; e.vz = 0;
  }, kind);
  await new Promise((r) => setTimeout(r, 250));
}

async function main() {
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--use-gl=angle', '--use-angle=swiftshader', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
  });
  const allErrs = [];
  try {
    const page = await browser.newPage();
    allErrs.push(...await bootPlay(page, base));

    await placeElite(page, 'hunter');
    await page.screenshot({ path: join(SHOT_DIR, 'hunter-dual-lane-1280x800.png'), type: 'png' });
    console.log('wrote hunter-dual-lane-1280x800.png');

    await placeElite(page, 'sentinel');
    await page.screenshot({ path: join(SHOT_DIR, 'sentinel-lane-1280x800.png'), type: 'png' });
    console.log('wrote sentinel-lane-1280x800.png');

    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await placeElite(page, 'hunter');
    await page.screenshot({ path: join(SHOT_DIR, 'hunter-dual-lane-mobile-390x844.png'), type: 'png' });
    console.log('wrote hunter-dual-lane-mobile-390x844.png');

    // verify lane visible via view
    const ok = await page.evaluate(() => {
      const v = window.__swarm.view;
      return !!(v && v.warnLane && v.warnLane.visible);
    });
    if (!ok) throw new Error('warnLane not visible on hunter telegraph');
  } finally {
    await browser.close();
    server.close();
  }
  const real = allErrs.filter((e) => !/ResizeObserver|favicon/i.test(e));
  if (real.length) { console.error('page errors', real); process.exit(1); }
  console.log('phase6-elite-lane-read-shots: OK');
}
main().catch((e) => { console.error(e); process.exit(1); });
