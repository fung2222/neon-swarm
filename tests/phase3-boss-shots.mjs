/**
 * Phase 3 boss screenshots: SWARM CORE silhouette + volley telegraph lanes.
 * Run: node tests/phase3-boss-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase3-boss');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.10';
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
    await new Promise((r) => setTimeout(r, 600));

    // Boss silhouette + HP bar + inbound banner
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.enemies.length = 0;
      g.bullets.length = 0;
      g.bossHazards = [];
      g.invuln = 99;
      g.px = 0; g.pz = 0;
      g.stopMove();
      g.t = 360;
      g._beatsFired['120:sentinel'] = true;
      g._beatsFired['360:swarm_core'] = true;
      const boss = g._spawnBoss({ at: 360, kind: 'boss', id: 'swarm_core' }, []);
      boss.x = 0; boss.z = -5.2;
      boss.vx = 0; boss.vz = 0;
      boss.speed = 0; boss.chase = 0;
      boss.phase = 'orbit';
      boss.bossSub = 'idle';
      boss.phaseT = 2.5;
      // Banner
      const banner = document.getElementById('beat-banner');
      const zh = document.getElementById('beat-zh');
      const en = document.getElementById('beat-en');
      if (zh) zh.textContent = 'Boss 出現 · 洪流核心';
      if (en) en.textContent = 'BOSS INBOUND · SWARM CORE';
      if (banner) { banner.classList.add('boss'); banner.classList.remove('hidden'); }
      // HP strip
      const bar = document.getElementById('boss-hp');
      const fill = document.getElementById('boss-hp-fill');
      if (bar) bar.classList.remove('hidden');
      if (fill) fill.style.width = '100%';
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: join(SHOT_DIR, 'boss-silhouette-1280x800.png'), type: 'png' });
    console.log('shot: boss-silhouette-1280x800.png');

    // Volley telegraph lanes
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.bossHazards = [];
      const boss = g.enemies.find((e) => e.boss);
      if (!boss) return;
      boss.x = 0; boss.z = -4.5;
      boss.speed = 0; boss.chase = 0;
      boss.phase = 'volley';
      boss.bossSub = 'telegraph';
      boss.phaseT = 0.7;
      boss.telegraphDur = 0.85;
      boss.volleyAng = Math.PI / 2;
      const ways = 6;
      for (let i = 0; i < ways; i++) {
        const ang = boss.volleyAng + (i / ways) * Math.PI * 2;
        g.bossHazards.push({
          kind: 'volleyLane',
          x: boss.x, z: boss.z,
          dx: Math.cos(ang), dz: Math.sin(ang),
          life: 0.7, maxLife: 0.85,
          damageAt: g.t + 0.7,
          bossId: boss.id,
          fired: false,
        });
      }
      const banner = document.getElementById('beat-banner');
      const zh = document.getElementById('beat-zh');
      const en = document.getElementById('beat-en');
      if (zh) zh.textContent = '齊射相位';
      if (en) en.textContent = 'VOLLEY PHASE';
      if (banner) { banner.classList.add('boss'); banner.classList.remove('hidden'); }
      const fill = document.getElementById('boss-hp-fill');
      if (fill) fill.style.width = '50%';
    });
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: join(SHOT_DIR, 'boss-volley-telegraph-1280x800.png'), type: 'png' });
    console.log('shot: boss-volley-telegraph-1280x800.png');

    // Mobile
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.evaluate(() => {
      const g = window.__swarm.game;
      const boss = g.enemies.find((e) => e.boss);
      if (boss) { boss.x = 0; boss.z = -4.2; boss.speed = 0; boss.chase = 0; }
      // keep volley lanes
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: join(SHOT_DIR, 'boss-volley-mobile-390x844.png'), type: 'png' });
    console.log('shot: boss-volley-mobile-390x844.png');

    if (errs.length) console.log('page errors:', errs.slice(0, 8));
    console.log('phase3-boss shots OK →', SHOT_DIR);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
