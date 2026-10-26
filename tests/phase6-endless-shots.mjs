/**
 * Phase 6 endless elite banner screenshot (optional).
 * Run: node tests/phase6-endless-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase6-endless');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.18';
const WAIT = { timeout: 45000, polling: 250 };
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png',
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
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, base: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

async function main() {
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader-webgl', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800 },
  });
  const page = await browser.newPage();
  try {
    await page.goto(base + `/index.html?v=${VER}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
    await new Promise((r) => setTimeout(r, 600));
    await page.click('#btn-play');
    await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.enemies.length = 0; g.bullets.length = 0; g.gems.length = 0; g.bossHazards.length = 0;
      g.invuln = 99; g.px = 0; g.pz = 0; g.stopMove(); g.spawnAcc = 0;
      g._beatsFired['120:sentinel'] = true;
      g._beatsFired['240:hunter'] = true;
      g._beatsFired['360:swarm_core'] = true;
      g.t = 449.5;
      g._nextEndlessEliteAt = 450;
      g._nextEndlessBossAt = 660;
      g._endlessEliteIdx = 0;
      g.mapZone = 'blockade';
      const v = window.__swarm.view;
      if (v && v.setMapZone) v.setMapZone('blockade');
    });
    // step a few frames via forced step if exposed; else bump t and call internal
    await page.evaluate(() => {
      const g = window.__swarm.game;
      // Force spawn endless elite + show banner like main would
      const events = [];
      g._spawnElite({ at: 450, kind: 'elite', id: 'sentinel' }, events);
      g._nextEndlessEliteAt = 540;
      g._endlessEliteIdx = 1;
      const banner = document.getElementById('beat-banner');
      const zh = document.getElementById('beat-zh');
      const en = document.getElementById('beat-en');
      if (zh) zh.textContent = '精英出現 · SENTINEL PRIME';
      if (en) en.textContent = 'ELITE INBOUND · SENTINEL PRIME';
      if (banner) banner.classList.remove('hidden', 'boss');
      g.t = 450;
    });
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: join(SHOT_DIR, 'endless-elite-banner-1280x800.png'), type: 'png' });
    console.log('shot OK →', SHOT_DIR);
  } finally {
    await browser.close();
    server.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
