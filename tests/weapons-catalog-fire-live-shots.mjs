/**
 * WEAPONS-CATALOG-FIRE-LIVE-001 smoke shots (v0.9.75) — boot play, no pageerror.
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'weapons-catalog-fire-live');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.75';
const WAIT = { timeout: 45000, polling: 250 };
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'application/svg+xml', '.woff2': 'font/woff2',
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
    server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` }));
  });
}

async function main() {
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader-webgl', '--ignore-gpu-blocklist', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));
  await page.goto(base + `/index.html?v=${VER}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await page.click('#btn-play');
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
  await new Promise((r) => setTimeout(r, 500));
  await page.evaluate(() => {
    try { localStorage.setItem('neon-swarm-coach-v1', '1'); } catch (_) {}
    const el = document.getElementById('run-coach');
    if (el) el.classList.add('hidden');
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.invuln = 99;
    // exercise non-starter catalog ids in loadout
    g.loadout = {
      primary: ['vulcan', 'zero_laser'],
      secondary: ['slow_gun', 'blackhole'],
      throw: ['flash', 'gravity'],
    };
    g.weaponSlots = ['vulcan', 'zero_laser', 'slow_gun', 'blackhole', 'flash', 'gravity'];
    g.taken = { vulcan: 1, zero_laser: 1, slow_gun: 1, blackhole: 1, flash: 1, gravity: 1 };
    g.weaponResources = {
      slow_gun: { type: 'energy', current: 8, max: 10 },
      blackhole: { type: 'charges', current: 2, max: 2 },
    };
    if (window.__swarm.syncWeaponHud) window.__swarm.syncWeaponHud();
  });
  await new Promise((r) => setTimeout(r, 300));
  const probe = await page.evaluate(() => {
    const tiles = [...document.querySelectorAll('.wrail-tile')].map((b) => ({
      i: b.dataset.i, empty: b.classList.contains('empty'), title: b.title,
    }));
    return { tiles, n: tiles.length, state: window.__swarm.state };
  });
  await page.screenshot({ path: join(SHOT_DIR, '01-phone-alt-catalog-loadout.png'), type: 'png' });
  const fail = [];
  if (probe.n < 6) fail.push('rail-tiles:' + probe.n);
  if (probe.tiles.some((t) => t.empty)) fail.push('unexpected-empty');
  if (errs.length) fail.push(...errs.slice(0, 3).map((e) => 'pageerror:' + e));
  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver: VER, probe, fail }, null, 2));
  await browser.close(); server.close();
  if (fail.length) { console.error('FAIL', fail); process.exit(1); }
  console.log('weapons-catalog-fire-live-shots.mjs: PASS', { titles: probe.tiles.map((t) => t.title) });
}
main().catch((e) => { console.error(e); process.exit(1); });
