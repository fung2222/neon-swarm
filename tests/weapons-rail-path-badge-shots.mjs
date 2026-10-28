/**
 * WEAPONS-RAIL-PATH-BADGE-001 screenshots (v0.9.73) — branched rail shows A/B·U corner.
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'weapons-rail-path-badge');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.73';
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
  await new Promise((r) => setTimeout(r, 400));

  await page.evaluate(() => {
    try { localStorage.setItem('neon-swarm-coach-v1', '1'); } catch (_) {}
    const el = document.getElementById('run-coach');
    if (el) el.classList.add('hidden');
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.invuln = 99;
    g.loadout = {
      primary: ['gatling', 'ion_beam'],
      secondary: ['shotgun', 'acid_gun'],
      throw: ['frag', 'chill'],
    };
    g.weaponSlots = ['gatling', 'ion_beam', 'shotgun', 'acid_gun', 'frag', 'chill'];
    g.taken = { gatling: 4, ion_beam: 5, shotgun: 3, acid_gun: 1, frag: 2, chill: 1 };
    g.weaponBranches = { gatling: 'A', ion_beam: 'B', shotgun: 'A' };
    g.weaponUlts = { ion_beam: 'U1' };
    g.weaponResources = {
      shotgun: { type: 'ammo', current: 6, max: 8 },
      acid_gun: { type: 'energy', current: 8, max: 10 },
    };
    if (window.__swarm.syncWeaponHud) window.__swarm.syncWeaponHud();
  });
  await new Promise((r) => setTimeout(r, 200));

  const probe = await page.evaluate(() => {
    const tiles = [...document.querySelectorAll('.wrail-tile')].map((btn) => {
      const path = btn.querySelector('.wrail-path');
      const nameEl = btn.querySelector('.wrail-name, .wslot-name');
      return {
        i: btn.dataset.i,
        path: path ? path.textContent : null,
        hasName: !!nameEl,
        title: btn.title || '',
      };
    });
    return tiles;
  });
  await page.screenshot({ path: join(SHOT_DIR, '01-phone-rail-path-badge.png'), type: 'png' });

  const fail = [];
  const byI = Object.fromEntries(probe.map((t) => [t.i, t]));
  if (!byI['0'] || byI['0'].path !== 'A') fail.push('gatling-path-A:' + (byI['0'] && byI['0'].path));
  if (!byI['1'] || byI['1'].path !== 'B·U1') fail.push('ion-path-BU1:' + (byI['1'] && byI['1'].path));
  if (!byI['2'] || byI['2'].path !== 'A') fail.push('shotgun-path-A:' + (byI['2'] && byI['2'].path));
  if (byI['3'] && byI['3'].path) fail.push('acid-should-have-no-path');
  for (const t of probe) {
    if (t.hasName) fail.push('tile-' + t.i + '-shows-name');
  }
  if (errs.length) fail.push(...errs.slice(0, 3).map((e) => 'pageerror:' + e));
  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver: VER, probe, fail }, null, 2));
  await browser.close(); server.close();
  if (fail.length) { console.error('FAIL', fail); process.exit(1); }
  console.log('weapons-rail-path-badge-shots.mjs: PASS', probe.filter((t) => t.path));
}
main().catch((e) => { console.error(e); process.exit(1); });
