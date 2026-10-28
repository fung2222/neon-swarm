/**
 * WEAPONS-RAIL-FILL-EDGE-001 screenshots (v0.9.67).
 * Phone 390×844 — full / drained secondary / throw on-cd / bursting active.
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'weapons-rail-fill-edge');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.67';
const WAIT = { timeout: 45000, polling: 250 };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'application/svg+xml',
  '.woff2': 'font/woff2',
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

function probeRail() {
  const rail = document.getElementById('weapon-rail');
  if (!rail) return null;
  const tiles = [...rail.querySelectorAll('.wrail-tile')].map((btn) => {
    const fillEl = btn.querySelector('.wrail-fill');
    const fill = fillEl ? getComputedStyle(fillEl).getPropertyValue('--fill').trim() : null;
    // style attribute --fill
    const styleFill = fillEl && fillEl.style.getPropertyValue('--fill');
    return {
      i: btn.dataset.i,
      cat: btn.dataset.cat,
      empty: btn.classList.contains('empty'),
      active: btn.classList.contains('active'),
      drained: btn.classList.contains('drained'),
      onCd: btn.classList.contains('on-cd'),
      bursting: btn.classList.contains('bursting'),
      fill: styleFill || fill,
      title: btn.title,
    };
  });
  return { tiles, fireMode: window.__swarm?.game?.fireMode, burst: window.__swarm?.game?.secondaryBurstLeft };
}

async function main() {
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader-webgl',
      '--ignore-gpu-blocklist', '--window-size=390,844',
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));
  await page.goto(base + `/index.html?v=${VER}&lang=zh&stick=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
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
    g.taken = { gatling: 1, ion_beam: 1, shotgun: 1, acid_gun: 1, frag: 1, chill: 1 };
    g.weaponResources = {
      shotgun: { type: 'ammo', current: 8, max: 8 },
      acid_gun: { type: 'energy', current: 10, max: 10 },
    };
    g.throwCdT = { frag: 0, chill: 0 };
    g.fireMode = 'primary';
    g.secondaryBurstLeft = 0;
    if (window.__swarm.syncWeaponHud) window.__swarm.syncWeaponHud();
  });
  await new Promise((r) => setTimeout(r, 150));

  const full = await page.evaluate(probeRail);
  await page.screenshot({ path: join(SHOT_DIR, '01-fill-full.png'), type: 'png' });

  // Drain shotgun + put frag on CD + select secondary bursting
  await page.evaluate(() => {
    const g = window.__swarm.game;
    g.weaponResources.shotgun.current = 0;
    g.throwCdT.frag = 1.4;
    g.weaponResources.shotgun.current = 3;
    g.selectWeaponTile(2);
    if (window.__swarm.syncWeaponHud) window.__swarm.syncWeaponHud();
  });
  await new Promise((r) => setTimeout(r, 200));
  const bursting = await page.evaluate(probeRail);
  await page.screenshot({ path: join(SHOT_DIR, '02-secondary-bursting-throw-cd.png'), type: 'png' });

  // Fully drain secondary
  await page.evaluate(() => {
    const g = window.__swarm.game;
    g.weaponResources.shotgun.current = 0;
    g.weaponResources.acid_gun.current = 0;
    g.throwCdT.frag = 1.2;
    g.throwCdT.chill = 0;
    g.fireMode = 'primary';
    g.secondaryBurstLeft = 0;
    if (window.__swarm.syncWeaponHud) window.__swarm.syncWeaponHud();
  });
  await new Promise((r) => setTimeout(r, 250));
  const drained = await page.evaluate(probeRail);
  await page.screenshot({ path: join(SHOT_DIR, '03-secondary-drained-throw-oncd.png'), type: 'png' });

  // Near-empty quantize (0.01 → drained)
  await page.evaluate(() => {
    const g = window.__swarm.game;
    g.weaponResources.shotgun.current = 0.05; // /8 ≈ 0.006 → snap 0
    g.weaponResources.shotgun.max = 8;
    g.throwCdT.frag = 0;
    if (window.__swarm.syncWeaponHud) window.__swarm.syncWeaponHud();
  });
  await new Promise((r) => setTimeout(r, 200));
  const nearEmpty = await page.evaluate(probeRail);
  await page.screenshot({ path: join(SHOT_DIR, '04-near-empty-quantize.png'), type: 'png' });

  const fail = [];
  const find = (probe, cat, pred) => (probe?.tiles || []).find((t) => t.cat === cat && pred(t));

  // bursting shot: shotgun active+bursting OR at least frag on-cd
  if (bursting) {
    const frag = find(bursting, 'throw', (t) => !t.empty && (t.title || '').includes('破片') || (t.title || '').toLowerCase().includes('frag') || t.i === '4');
    // find by index 4 = frag
    const fragTile = (bursting.tiles || []).find((t) => t.i === '4');
    if (!fragTile || !fragTile.onCd) fail.push('bursting-shot:frag-not-on-cd');
    const sg = (bursting.tiles || []).find((t) => t.i === '2');
    if (!sg || !sg.active) fail.push('bursting-shot:shotgun-not-active');
    if (sg && !sg.bursting) fail.push('bursting-shot:shotgun-not-bursting');
  } else fail.push('no-bursting-probe');

  if (drained) {
    const sg = (drained.tiles || []).find((t) => t.i === '2');
    const acid = (drained.tiles || []).find((t) => t.i === '3');
    const frag = (drained.tiles || []).find((t) => t.i === '4');
    if (!sg || !sg.drained) fail.push('drained-shot:shotgun-not-drained');
    if (!acid || !acid.drained) fail.push('drained-shot:acid-not-drained');
    if (!frag || !frag.onCd) fail.push('drained-shot:frag-not-on-cd');
    if (sg && Number(sg.fill) > 0.02) fail.push('drained-shot:shotgun-fill-not-0:' + sg.fill);
  } else fail.push('no-drained-probe');

  if (nearEmpty) {
    const sg = (nearEmpty.tiles || []).find((t) => t.i === '2');
    if (!sg || !sg.drained) fail.push('near-empty:not-drained');
    if (sg && Number(sg.fill) > 0) fail.push('near-empty:fill-not-snapped:' + sg.fill);
  }

  if (errs.length) fail.push(...errs.slice(0, 3).map((e) => 'pageerror:' + e));

  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver: VER, full, bursting, drained, nearEmpty, fail }, null, 2));
  await browser.close();
  server.close();
  if (fail.length) {
    console.error('weapons-rail-fill-edge-shots FAIL', fail);
    process.exit(1);
  }
  console.log('weapons-rail-fill-edge-shots.mjs: PASS');
}

main().catch((e) => { console.error(e); process.exit(1); });
