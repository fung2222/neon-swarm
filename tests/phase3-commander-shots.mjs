/**
 * Phase 3 elite #3 screenshots: ARMY COMMANDER silhouette + summon/attack telegraphs.
 * Run: node tests/phase3-commander-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase3-commander');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.26';
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

async function placeCommander(page, phase = 'telegraph_summon') {
  await page.evaluate((ph) => {
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.bullets.length = 0;
    g.invuln = 99;
    g.px = 0; g.pz = 0;
    g.stopMove();
    g._beatsFired['120:sentinel'] = true;
    g._beatsFired['240:hunter'] = true;
    g._beatsFired['300:commander'] = true;
    const e = g._spawnElite({ at: 300, kind: 'elite', id: 'commander' }, []);
    e.x = 0; e.z = -5.0;
    e.cmdMode = ph === 'telegraph_attack' || ph === 'charge' ? 'attack' : 'summon';
    e.phase = ph;
    if (ph === 'telegraph_summon') {
      e.phaseT = 0.95;
      e.telegraphDur = 1.0;
      e.telegraphAt = g.t;
      e.summonMarks = [
        { x: -1.8, z: -3.6 },
        { x: 1.6, z: -3.4 },
        { x: -0.2, z: -6.6 },
        { x: 2.0, z: -5.8 },
      ];
    } else if (ph === 'telegraph_attack') {
      e.phaseT = 1.0;
      e.telegraphDur = 1.1;
      e.telegraphAt = g.t;
      e.chargeDx = 0; e.chargeDz = 1;
      e.summonMarks = null;
    } else {
      e.phaseT = 2.0;
      e.summonMarks = null;
    }
    e.vx = 0; e.vz = 0;
    const banner = document.getElementById('beat-banner');
    const zh = document.getElementById('beat-zh');
    const en = document.getElementById('beat-en');
    if (zh) zh.textContent = '精英出現 · 軍指揮官';
    if (en) en.textContent = 'ELITE INBOUND · ARMY COMMANDER';
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

    // Desktop: summon telegraph marks
    await placeCommander(page, 'telegraph_summon');
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: join(SHOT_DIR, 'commander-summon-telegraph-1280x800.png'), type: 'png' });
    console.log('shot: commander-summon-telegraph-1280x800.png');

    // Desktop: attack telegraph lane
    await placeCommander(page, 'telegraph_attack');
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: join(SHOT_DIR, 'commander-attack-telegraph-1280x800.png'), type: 'png' });
    console.log('shot: commander-attack-telegraph-1280x800.png');

    // Silhouette walk pose
    await placeCommander(page, 'walk');
    await page.evaluate(() => {
      const banner = document.getElementById('beat-banner');
      if (banner) banner.classList.add('hidden');
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: join(SHOT_DIR, 'commander-silhouette-1280x800.png'), type: 'png' });
    console.log('shot: commander-silhouette-1280x800.png');

    // Mobile framing
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await placeCommander(page, 'telegraph_summon');
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: join(SHOT_DIR, 'commander-summon-telegraph-390x844.png'), type: 'png' });
    console.log('shot: commander-summon-telegraph-390x844.png');

    if (errs.length) console.log('page errors:', errs.slice(0, 8));
    console.log('phase3-commander shots OK →', SHOT_DIR);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
