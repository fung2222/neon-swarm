/**
 * Phase 3 elite #2 screenshots: HUNTER RAID silhouette + dual telegraph lanes.
 * Run: node tests/phase3-elite2-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase3-elite2');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.13';
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

async function placeHunter(page, phase = 'telegraph') {
  await page.evaluate((ph) => {
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.bullets.length = 0;
    g.invuln = 99;
    g.px = 0; g.pz = 0;
    g.stopMove();
    g._beatsFired['120:sentinel'] = true;
    g._beatsFired['240:hunter'] = true;
    const e = g._spawnElite({ at: 240, kind: 'elite', id: 'hunter' }, []);
    e.x = 0; e.z = -5.2;
    e.phase = ph;
    e.phaseT = ph === 'telegraph' ? 1.05 : 0.4;
    e.telegraphDur = 1.25;
    e.telegraphAt = g.t;
    e.damageAt = g.t + 1.25;
    e.comboSeg = ph === 'telegraph' ? 1 : 0; // show second-segment pressure when telegraphing
    e.comboSegs = 2;
    e.dualLane = true;
    let dx = g.px - e.x, dz = g.pz - e.z;
    const len = Math.hypot(dx, dz) || 1;
    e.chargeDx = dx / len;
    e.chargeDz = dz / len;
    e.vx = 0; e.vz = 0;
    const banner = document.getElementById('beat-banner');
    const zh = document.getElementById('beat-zh');
    const en = document.getElementById('beat-en');
    if (zh) zh.textContent = '精英出現 · 獵殺機甲';
    if (en) en.textContent = 'ELITE INBOUND · HUNTER RAID';
    if (banner) banner.classList.remove('hidden');
  }, phase);
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
    await new Promise((r) => setTimeout(r, 800));

    await page.click('#btn-play');
    await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
    await new Promise((r) => setTimeout(r, 500));

    // Desktop: hunter silhouette + dual telegraph lanes
    await placeHunter(page, 'telegraph');
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: join(SHOT_DIR, 'hunter-telegraph-1280x800.png'), type: 'png' });
    console.log('shot: hunter-telegraph-1280x800.png');

    // Desktop: walk pose (silhouette read without lanes)
    await placeHunter(page, 'walk');
    await page.evaluate(() => {
      const el = window.__swarm.game.enemies.find((e) => e.elite);
      if (el) { el.phase = 'walk'; el.phaseT = 2; el.dualLane = true; }
      const banner = document.getElementById('beat-banner');
      if (banner) banner.classList.add('hidden');
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: join(SHOT_DIR, 'hunter-silhouette-1280x800.png'), type: 'png' });
    console.log('shot: hunter-silhouette-1280x800.png');

    // Side-by-side contrast: sentinel left, hunter right
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.enemies.length = 0;
      g.invuln = 99;
      g.px = 0; g.pz = 0;
      const s = g._spawnElite({ at: 120, kind: 'elite', id: 'sentinel' }, []);
      s.x = -2.4; s.z = -4.8; s.phase = 'telegraph'; s.phaseT = 1.0;
      s.telegraphDur = 1.2; s.chargeDx = 0; s.chargeDz = 1; s.dualLane = false;
      // Remove sentinel so we can spawn hunter (max one elite) — temporarily clear elite flag path
      g.enemies.length = 0;
      // Spawn as plain procedural via direct push of both meshes visually: spawn hunter then fake a sentinel mesh by spawning after clearing elite checks
      const h = g._spawnElite({ at: 240, kind: 'elite', id: 'hunter' }, []);
      h.x = 1.6; h.z = -4.8;
      h.phase = 'telegraph'; h.phaseT = 1.05; h.telegraphDur = 1.25;
      h.dualLane = true; h.comboSeg = 0; h.comboSegs = 2;
      h.chargeDx = 0; h.chargeDz = 1;
      // Add a non-elite visual twin of sentinel for comparison (type sentinel but elite false won't use elite tick)
      // Instead: keep only hunter telegraph shot; contrast is vs known phase3-lab sentinel shots.
      const banner = document.getElementById('beat-banner');
      const zh = document.getElementById('beat-zh');
      const en = document.getElementById('beat-en');
      if (zh) zh.textContent = '精英出現 · 獵殺機甲';
      if (en) en.textContent = 'ELITE INBOUND · HUNTER RAID';
      if (banner) banner.classList.remove('hidden');
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: join(SHOT_DIR, 'hunter-dual-lane-1280x800.png'), type: 'png' });
    console.log('shot: hunter-dual-lane-1280x800.png');

    // Mobile framing
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await placeHunter(page, 'telegraph');
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: join(SHOT_DIR, 'hunter-telegraph-390x844.png'), type: 'png' });
    console.log('shot: hunter-telegraph-390x844.png');

    if (errs.length) console.log('page errors:', errs.slice(0, 8));
    console.log('phase3-elite2 shots OK →', SHOT_DIR);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
